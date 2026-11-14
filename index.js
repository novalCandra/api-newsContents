const express = require("express");
const apiRouter = require("./src/router/ai.route.js")
const app = express()
const port = 3000
const cors = require("cors")
app.use(express.json())
app.use(cors())
app.get("/", (req, res) => {
    res.send(`Hello wordl`)
})

app.use("/api", apiRouter)

app.listen(port, () => {
    console.log(`Back end berjalan pada port : ${port}`)
})