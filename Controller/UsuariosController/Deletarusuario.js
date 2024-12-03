const pool = require("../../Model/connection");

class ApagarUsuario {
    async apagarUsuario(req, res) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const { id_usuario } = req.params;

            // Validação básica de entrada
            if (!id_usuario || isNaN(parseInt(id_usuario, 10))) {
                console.log("ID inválido fornecido.");
                return res.status(400).json({
                    success: false,
                    message: "O ID fornecido é inválido. Por favor, envie um ID numérico válido.",
                });
            }

            // Verifica se o usuário existe antes de excluir
            const queryCheckUser = "SELECT id_usuario FROM tbl_usuarios WHERE id_usuario = ?";
            const [userExists] = await connection.query(queryCheckUser, [id_usuario]);

            if (userExists.length === 0) {
                console.log(`Usuário com ID ${id_usuario} não encontrado.`);
                return res.status(404).json({
                    success: false,
                    message: "Usuário não encontrado.",
                });
            }

            // Sequência de exclusão em tabelas associadas
            const deleteQueries = [
                { table: "tbl_contactos", column: "id_usuario" },
                { table: "tbl_carrinho", column: "id_usuario" },
                { table: "tbl_enderecos", column: "id_usuario" },
                { table: "tbl_compras", column: "id_usuario" },
                { table: "tbl_produtos_compra", column: "id_usuario" },
                { table: "tbl_usuarios", column: "id_usuario" }, // Exclusão final do usuário
            ];

            for (const query of deleteQueries) {
                await connection.query(`DELETE FROM ${query.table} WHERE ${query.column} = ?`, [id_usuario]);
            }

            // Confirma a transação
            await connection.commit();
            console.log(`Usuário com ID ${id_usuario} deletado com sucesso.`);
            return res.status(200).json({
                success: true,
                message: `Perfil  ${id_usuario} deletado com sucesso.`,
            });
        } catch (error) {
            // Rollback em caso de erro
            if (connection) await connection.rollback();
            console.error("Erro ao deletar usuário: ", error);

            return res.status(500).json({
                success: false,
                message: "Houve um erro ao tentar excluir o usuário. Por favor, tente novamente mais tarde.",
            });
        } finally {
            // Libera a conexão sempre
            if (connection) connection.release();
        }
    }
}

module.exports = new ApagarUsuario();
