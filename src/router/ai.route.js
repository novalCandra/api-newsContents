const express = require("express");
const { AiController } = require("../controller/ai.controller");
const AiRouter = express.Router()

AiRouter.post("/generate", AiController)

module.exports = AiRouter