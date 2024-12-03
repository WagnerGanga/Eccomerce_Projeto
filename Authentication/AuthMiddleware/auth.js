const pool = require("../../Model/connection");
const jwt = require("jsonwebtoken");
const config = require("../../Configs/config");

class RotaProtegida {
    async Autenticacao(req, res, next) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const cabecalho = req.headers.authorization;
            if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
                console.log("Cabeçalho de autenticação inválido");
                return res.status(401).json({ success: false, message: "Erro na autenticação, tente novamente." });
            }

            const tokenExtraido = cabecalho.split(" ")[1];
            if (!tokenExtraido) {
                return res.status(401).json({ success: false, message: "Token não encontrado" });
            }

            const decoded = jwt.verify(tokenExtraido, config.JWT_SECRET);
            const idUsuario = decoded.usuarioId;
            const tipo_usuario = decoded.tipoUsuario;

            const [dados] = await connection.query("SELECT id_usuario, tipo_usuario FROM tbl_usuarios WHERE  id_usuario = ? AND tipo_usuario = ?", [ idUsuario, tipo_usuario]);
            if (!dados || dados.length === 0) {
                return res.status(401).json({ success: false, message: "Usuário não encontrado" });
            }

            req.dados = dados[0];
            console.log(req.dados);
            await connection.commit();
            next();
        } catch (error) {
            console.error("Erro ao acessar a rota protegida: ", error.name);

            if (connection) {
                await connection.rollback();
            }

            if (error.name === "JsonWebTokenError") {
                return res.status(401).json({ success: false, message: "Token inválido ou ausente" });
            }

            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ success: false, message: "Token expirado" });
            }

            return res.status(500).json({ success: false, message: "Erro interno. Tente novamente mais tarde." });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = new RotaProtegida();
