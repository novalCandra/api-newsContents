import express from "express"
import AiController from "../controller/ai.controller.js"
import { aiLimit } from "../middleware/procted.js"
const apiRouterArtificialInteligence = express.Router()

apiRouterArtificialInteligence.post("/generate", aiLimit, AiController)


export default apiRouterArtificialInteligence