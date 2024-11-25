const router = require("express").Router()
const criar = require("../../Controller/UsuariosController/CriarUsuario")
const procurarUsuario = require("../../Controller/UsuariosController/ProcurarUsuario")
const procurarUsuarios = require("../../Controller/UsuariosController/ProcurarUsuarios")
const login = require("../../Authentication/AuthLogin/login")

router.route("/signup").post((req, res) => {criar.create(req, res)})
router.route("/usuario/login").post((req, res) => {login.login(req, res)})
router.route("/usuario/:id_usuario").post((req, res) =>{procurarUsuario.ProcurarUsuario(req, res)})
router.route("/usuarios").get((req, res) => {procurarUsuarios.procurarUsuarios(req, res)})
module.exports = router
