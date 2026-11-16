import express from "express";
import cors from "cors"
import helment from "helmet"
import apiRouterArtificialInteligence from "./src/router/ai.route.js";
const app = express()
const port = 3000
app.use(express.json({ limit: "16kb" }))
app.use(cors())
app.use(helment())
app.get("/", (req, res) => {
    res.send(`Hello wordl`)
})

app.use("/api", apiRouterArtificialInteligence)

app.listen(port, () => {
    console.log(`Back end berjalan pada port : ${port}`)
})

export default app