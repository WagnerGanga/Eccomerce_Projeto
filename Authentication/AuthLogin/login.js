const pool = require("../../Model/connection");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../../Configs/config");

class Login{
    async login(req, res) {
        let connection
        try {
            const { email, password } = req.body;
            
            connection = await pool.getConnection()
            await connection.beginTransaction()
            // Verificar se os campos estão preenchidos
            if (!email || !password) {
                return res.status(400).json({ success:false, message: "Preencha todos os campos" });
            }

            // Consulta ao banco de dados para obter o usuário pelo email
            const queryString = "SELECT id_usuario, primeiro_nome_usuario,segundo_nome_usuario,sexo_usuario, password_usuario,createdAt, updatedAt FROM tbl_usuarios WHERE email_usuario = ?";
            const getTipoUsuario = "SELECT tipo_usuario FROM tbl_usuarios WHERE email_usuario = ?"
            const [users] = await connection.query(queryString, [email]);
            const [tipo_usuarios] =  await connection.query(getTipoUsuario, [email])

            // Verificar se o usuário foi encontrado
            if (users.length === 0) {
                return res.status(401).json({success:false, message: "Credenciais Inválidas" });
            }

            const user = users[0];
            const tipo = tipo_usuarios[0].tipo_usuario

            // Comparar a senha fornecida com a senha armazenada no banco de dados
            const passwordCompare = bcrypt.compareSync(password, user.password_usuario);
            if (!passwordCompare) {
                return res.status(401).json({ success:false, message: "Credenciais Inválidas" });
            }

            // Gerar um token JWT se a autenticação for bem-sucedida
            const token = JWT.sign({ usuarioId: user.id_usuario, tipoUsuario:tipo }, config.JWT_SECRET);
            
            delete user.password_usuario
            // Responder com sucesso, retornando o token e os dados do usuário
            return res.status(200).json({ user, token, isLogged: true});

        } catch (error) {
            console.error("Houve um erro: ", error);
            return res.status(500).json({ message: "Houve um erro de servidor" });
        }
    }
};

module.exports = new Login();
