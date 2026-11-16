import { ExtractArticle } from "../service/ai.extract.js";
import { ResponseAiService } from "../service/ai.service.js";

const AiController = async (req, res) => {
    try {
        const ALLOWED_TONES = new Set(["casual", "formal", "neutral"]);
        const { url, tone = "casual" } = req.body ?? {};

        if (typeof url !== "string" || url.length > 2048) return res.status(400).json({
            status: false,
            message: "Invalid Input"
        })

        if (!ALLOWED_TONES.has(tone)) return res.status(400).json({
            status: false,
            message: "Invalid Input"
        })

        const article = await ExtractArticle(url)
        const createArticle = await ResponseAiService(article.textContent.slice(0, 2000), tone);
        return res.status(201).json({
            status: true,
            message: "success extract article",
            data: createArticle
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: false,
            message: error.message
        })
    }
}

export default AiController