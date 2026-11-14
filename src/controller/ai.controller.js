const { extractArticle } = require("../service/ai.extract");
const { responseAiService } = require("../service/ai.service");

const AiController = async (req, res) => {
    try {
        const { url, tone = "casual" } = req.body;
        const article = await extractArticle(url)
        const createArticle = await responseAiService(article.textContent.slice(0, 2000), tone);
        return res.status(201).json({
            status: true,
            message: "success extract article",
            data: createArticle
        })
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        })
    }
}

module.exports = {
    AiController
}