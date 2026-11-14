import express from "express";
import cors from "cors"
import apiRouterArtificialInteligence from "../server/src/router/ai.route.js";
const app = express()
const port = 3000
app.use(express.json())
app.use(cors())
app.get("/", (req, res) => {
    res.send(`Hello wordl`)
})

app.use("/api", apiRouterArtificialInteligence)

app.listen(port, () => {
    console.log(`Back end berjalan pada port : ${port}`)
})