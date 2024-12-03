const pool = require("../../Model/connection");

class ProcurarUsuarios {
    async procurarUsuarios(req, res) {
        let connection;
        try {
            // Obtém uma conexão do pool
            connection = await pool.getConnection();

            // Inicia uma transação (se necessário)
            await connection.beginTransaction();

            // Limitação e paginação (se fornecido pelo cliente)
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10; // Default: 10 registros
            const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0; // Default: Começar do início

            // Sanitização e validação de entradas
            if (isNaN(limit) || limit <= 0 || limit > 100) {
                return res.status(400).json({
                    success: false,
                    message: "O limite deve ser um número válido entre 1 e 100.",
                });
            }
            if (isNaN(offset) || offset < 0) {
                return res.status(400).json({
                    success: false,
                    message: "O offset deve ser um número válido maior ou igual a 0.",
                });
            }

            // Consulta segura com paginação
            const queryString = `
              SELECT 
                  tbl_usuarios.id_usuario, 
                  tbl_usuarios.primeiro_nome_usuario, 
                  tbl_usuarios.segundo_nome_usuario, 
                  tbl_usuarios.email_usuario, 
                  tbl_enderecos.logradouro, 
                  tbl_enderecos.rua, 
                  tbl_enderecos.numero, 
                  tbl_enderecos.cidade, 
                  tbl_contactos.numero_telefone
              FROM 
                  tbl_usuarios
              INNER JOIN
                  tbl_contactos ON tbl_usuarios.id_usuario = tbl_contactos.id_usuario
              INNER JOIN 
                  tbl_enderecos ON tbl_usuarios.id_usuario = tbl_enderecos.id_usuario
              LIMIT ? OFFSET ?
            `;

            // Executa a consulta no banco com valores parametrizados
            const [datas] = await connection.query(queryString, [limit, offset]);

            // Finaliza a transação
            await connection.commit();

            // Retorna os dados resgatados
            return res.status(200).json({
                success: true,
                message: "Dados resgatados com sucesso",
                response: datas,
            });
        } catch (error) {
            console.error("Erro ao resgatar dados: ", error);

            // Rollback em caso de erro
            if (connection) await connection.rollback();

            return res.status(500).json({
                success: false,
                message: "Houve um erro ao processar a solicitação. Por favor, tente novamente mais tarde.",
            });
        } finally {
            // Libera a conexão de volta ao pool
            if (connection) connection.release();
        }
    }
}

module.exports = new ProcurarUsuarios();
