import fs from "node:fs"
import path from "node:path"
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);
async function generateCartoonImage(prompt, outPath, retries = 3) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=720&height=1280&nologo=true`;
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!(res.headers.get("content-type") ?? "").startsWith("image/"))
        throw new Error("Response is not an image");
      fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
      return;
    } catch (e) {
      console.warn(`image attempt ${i} failed:`, e.message);
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 5000 * i)); // backoff
    }
  }
}

async function generateVoicerCover(text, ouputpath) {
    try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata("id-ID-GadisNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

        // msedge-tts menyimpan output sebagai "audio.mp3" di dalam direktori tujuan
        const targetDir = path.dirname(ouputpath);
        await tts.toFile(targetDir, text);

        // File default yang dihasilkan msedge-tts
        const defaultGeneratedFile = path.join(targetDir, "audio.mp3");

        // Rename/pindahkan "audio.mp3" menjadi "scene_X.mp3" (ouputpath)
        if (fs.existsSync(defaultGeneratedFile)) {
            if (fs.existsSync(ouputpath)) {
                fs.unlinkSync(ouputpath); // Hapus jika file lama sudah ada
            }
            fs.renameSync(defaultGeneratedFile, ouputpath);
        } else {
            throw new Error("msedge-tts gagal menghasilkan file audio.mp3");
        }
    } catch (error) {
        console.error("Error detail dari MsEdgeTTS:", error);
        throw error; // Wajib pakai throw agar error-nya tertangkap dan menghentikan proses jika gagal
    }
}


function createSceneClip(imagePath, audioPath, outputClipPath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(imagePath)
            .loop()
            .input(audioPath)
            .outputOption([
                '-c:v libx264',
                '-preset ultrafast',
                '-tune stillimage',
                '-c:a aac',
                '-b:a 192k',
                '-pix_fmt yuv420p',
                '-shortest'
            ])
            .save(outputClipPath)
            .on('end', () => resolve(outputClipPath))
            .on('error', (error) => reject(error))
    })
}


export async function buildVideoImage(videoPackage, outputFolder = './temp_video') {
    // if (!fs.existsSync(outputFolder)) fs.mkdir(outputFolder, { recursive: true })
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });
    const clipPhats = [];
    for (const scene of videoPackage.scenes) {
        const idx = scene.sceneNumber;
        const imagePath = path.join(outputFolder, `scene_${idx}.jpg`)
        const audioPath = path.join(outputFolder, `scene_${idx}.mp3`)
        const videoPath = path.join(outputFolder, `clip${idx}.mp4`);

        console.log("prosess melakuka create video".idx);

        try {
            console.log(`- Mengunduh gambar untuk scene ${idx}...`);
            await generateCartoonImage(scene.imagePrompt, imagePath);
        } catch (err) {
            throw new Error(`Gagal di Gambar Scene ${idx}: ${err.message}`);
        }

        try {
            console.log(`- Membuat voiceover untuk scene ${idx}...`);
            await generateVoicerCover(scene.voiceover, audioPath);
        } catch (err) {
            throw new Error(`Gagal di Voiceover Scene ${idx}: ${err.message}`);
        }

        // Pastikan file benar-benar ada
        if (!fs.existsSync(imagePath)) {
            throw new Error(`File gambar scene ${idx} tidak ditemukan di disk!`);
        }
        if (!fs.existsSync(audioPath)) {
            throw new Error(`File audio scene ${idx} tidak ditemukan di disk!`);
        }

        await createSceneClip(imagePath, audioPath, videoPath);
        clipPhats.push(videoPath);
    }

    const CreateFullVideo = path.join(outputFolder, 'final_video.mp4');
    return new Promise((resolver, reject) => {
        const mergedVideo = ffmpeg();
        clipPhats.forEach((clip) => mergedVideo.input(clip))

        mergedVideo
            .on('end', () => resolver(CreateFullVideo))
            .on('error', (error) => reject(error))
            .mergeToFile(CreateFullVideo, outputFolder)
    })
}