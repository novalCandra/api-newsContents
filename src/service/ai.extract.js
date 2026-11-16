import dns from "node:dns/promises"
import ipadrr from "ipaddr.js"
import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

function isBlockedIP(ip) {
    const range = ipadrr.parse(ip).range();
    return range !== "unicast"
}


async function assertPublicHost(hostname) {
    if (hostname === "localhost" || hostname.endsWith(".local")) throw new Error("BLOCKED_URL");
    const record = await dns.lookup(hostname, { all: true, verbatim: true })
    if (!record.length) throw new Error("BLOCKED_URL");
    for (const { address } of record) if (isBlockedIP(address)) throw new Error("BLOECKED_URL")
}

export async function ExtractArticle(url) {
    let parsed;
    try {
        parsed = new URL(url);
    } catch (error) {
        throw new Error("INVALID_URL");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("INVALID_URL");

    await assertPublicHost(parsed.hostname)
    const host = parsed.hostname;
    const isPrivate = host === "localhost" || /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
    if (isPrivate) throw new Error("BLOCKED_ERROR");

    const res = await fetch(parsed.toString(), {
        redirect: "manual",
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