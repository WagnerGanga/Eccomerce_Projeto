const pool = require("../../Model/connection");
class ProcurarUsuarioController {
  async ProcurarUsuario(req, res) {
      let connection;
      try {
          connection = await pool.getConnection(); // Obtém uma conexão temporária do pool
          await connection.beginTransaction(); // Inicia a transação
          
          const { id_usuario } = req.params;

          // Validação do parâmetro
          if (!id_usuario || isNaN(Number(id_usuario))) {
              console.log("ID inválido");
              return res.status(400).json({ success: false, message: "ID de usuário inválido" });
          }

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
              WHERE tbl_usuarios.id_usuario = ?
          `;

          // Executa a consulta
          const [datas] = await connection.query(queryString, [id_usuario]);

          // Verifica se o usuário foi encontrado
          if (datas.length === 0) {
              console.log("Usuário não encontrado");
              return res.status(404).json({ success: false, message: "Usuário não encontrado" });
          }

          // Retorna o usuário encontrado
          return res.status(200).json({ success: true, response: datas });
      } catch (error) {
          console.error("Houve um erro: ", error);
          return res.status(500).json({ success: false, message: "Por favor, tente mais tarde" });
      } finally {
          if (connection) connection.release(); // Garante que a conexão será liberada
      }
  }
}

module.exports = new ProcurarUsuarioController();
