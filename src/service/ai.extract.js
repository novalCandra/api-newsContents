import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

export async function ExtractArticle(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch (error) {
        throw new Error("INVALID_URL");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("INVALID_URL");

    const host = parsed.hostname;
    const isPrivate = host === "localhost" || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
    if (isPrivate) throw new Error("BLOCKED_ERROR");

    const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; NewsToContent/1.0)" },
        signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error("FETCHING_FAILED");
    const html = await res.text();

    // CHANGED: linkedom instead of JSDOM
    const { document } = parseHTML(html);
    const article = new Readability(document).parse();
    if (!article) throw new Error("NO_ARTICLE_FOUND");

    const textContent = article.textContent.trim();
    return {
        title: article.title,
        byLine: article.byline,
        siteName: article.siteName,
        excerpt: article.excerpt,
        textContent,
        wordCount: textContent.split(/\s+/).length
    };
}