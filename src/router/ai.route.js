import express from "express"
import AiController from "../controller/ai.controller.js"
const apiRouterArtificialInteligence = express.Router()

apiRouterArtificialInteligence.post("/generate", AiController)


export default apiRouterArtificialInteligence