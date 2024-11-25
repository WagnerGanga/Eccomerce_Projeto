const pool = require("../../Model/connection");

class ProcurarUsuarios {
    async procurarUsuarios(req, res) {
        let connection; // Declaração da conexão fora do bloco `try`
        try {
            // Obtém uma conexão do pool
            connection = await pool.getConnection();
            await connection.beginTransaction(); // Inicia a transação

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
            `;

            // Executa a consulta e obtém o resultado
            const [rows] = await connection.query(queryString);

            // Finaliza a transação
            await connection.commit();

            // Retorna os dados
            return res.status(200).json({
                success: true,
                message: "Dados resgatados com sucesso",
                data: rows, // Corrige o retorno do resultado da consulta
            });
        } catch (error) {
            console.error("Houve um erro: ", error);

            // Faz rollback caso ocorra erro
            if (connection) await connection.rollback();

            return res.status(500).json({
                success: false,
                message: "Por favor, tente mais tarde",
            });
        } finally {
            // Libera a conexão de volta ao pool
            if (connection) connection.release();
        }
    }
}

module.exports = new ProcurarUsuarios();
