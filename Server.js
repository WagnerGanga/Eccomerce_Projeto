const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const helmet = require("helmet")
const app = express()
const Porta = 2004
const UsuarioRotas = require("./Routes/UsuariosRotas/routes")
dotenv.config()

app.use(express.json())
app.use(cors())
app.use(helmet())
app.use("/app", UsuarioRotas)

app.use((req, res, next) => {
    next()
    console.error("Rota não encontrada")
    return res.status(404).json({message: "Houve um erro, por favor tente mais tarde"})

})

app.listen(Porta, function(){
    console.log("Servidor online na porta: ", Porta)
})