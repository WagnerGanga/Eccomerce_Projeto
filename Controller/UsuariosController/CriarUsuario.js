const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../../Model/connection");
class CriarUsuarioController {
  async create(req, res) {
    let connection; // Variável para armazenar a conexão temporária
    try {
      const {
        primeiro_nome,
        segundo_nome,
        sexo,
        enderecos, // Array de objetos
        telefone, // Array de objetos
        email,
        password,
        tipo_usuario,
      } = req.body;

      const createdAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();

      // Validação dos campos
      if (!primeiro_nome || !segundo_nome || !sexo || !email || !password || !tipo_usuario || !enderecos || !telefone) {
        return res.status(400).json({ success: false, message: "Verifique se preencheu todos os campos obrigatórios" });
      }

      if (!["M", "F"].includes(sexo.trim().toUpperCase())) {
        return res.status(400).json({ success: false, message: "Sexo inválido" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Formato de e-mail inválido" });
      }

      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message: "Senha insegura. Deve ter pelo menos 8 caracteres, incluir letras, números e caracteres especiais.",
        });
      }

      const validUserTypes = ["admin", "cliente"];
      if (!validUserTypes.includes(tipo_usuario)) {
        return res.status(400).json({ success: false, message: "Tipo de usuário inválido" });
      }

      connection = await pool.getConnection(); // Obtém uma conexão temporária do pool
      await connection.beginTransaction(); // Inicia a transação

      // Verifica se o e-mail já está em uso
      const emailQuery = "SELECT email_usuario FROM tbl_usuarios WHERE email_usuario = ?";
      const [emailresponse] = await connection.query(emailQuery, [email]);
      if (emailresponse.length > 0) {
        return res.status(400).json({ success: false, message: "Este email já está em uso" });
      }

      // Cria o hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insere o usuário
      const queryString = `
        INSERT INTO tbl_usuarios (primeiro_nome_usuario, segundo_nome_usuario, sexo_usuario, email_usuario, password_usuario, tipo_usuario, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await connection.query(queryString, [primeiro_nome, segundo_nome, sexo, email, hashedPassword, tipo_usuario, createdAt, updatedAt]);
      const id_usuario = result.insertId;

      // Insere múltiplos endereços
      if (Array.isArray(enderecos) && enderecos.length > 0) {
        const enderecoQuery = `
          INSERT INTO tbl_enderecos (logradouro, rua, numero, cidade, id_usuario)
          VALUES (?, ?, ?, ?, ?)
        `;
        for (const endereco of enderecos) {
          const { logradouro, rua, numero, cidade } = endereco;
          if (!logradouro || !rua || !numero || !cidade) {
            return res.status(400).json({ success: false, message: "Este numero já está em uso" });
          }
          await connection.query(enderecoQuery, [logradouro, rua, numero, cidade, id_usuario]);
        }
      }

      // Insere múltiplos telefones
      if (Array.isArray(telefone) && telefone.length > 0) {
        for (const telefones of telefone) {
          const { numero_telefone } = telefones;
          if (!numero_telefone) {
            throw new Error("Todos os campos de telefone são obrigatórios");
          }

          // Verificar se o número já existe
          const ExistsPhone = "SELECT numero_telefone FROM tbl_contactos WHERE numero_telefone = ?";
          const [response] = await connection.query(ExistsPhone, [numero_telefone]);
          if (response.length > 0) {
            throw new Error(`O número ${numero_telefone} já está em uso`);
          }

          // Inserir o telefone
          const phoneQuery = "INSERT INTO tbl_contactos (id_contacto, numero_telefone, id_usuario) VALUES (default, ?, ?)";
          await connection.query(phoneQuery, [numero_telefone, id_usuario]);
        }
      }

      await connection.commit(); // Confirma a transação
      return res.status(201).json({ success: true, message: "Usuário criado com sucesso", id_usuario });
    } catch (error) {
      if (connection) await connection.rollback(); // Reverte alterações em caso de erro
      console.error("Erro ao criar usuário:", error.message);
      return res.status(500).json({ success: false, message: "Erro interno do servidor" });
    } finally {
      if (connection) connection.release(); // Libera a conexão
    }
  }
}

module.exports = new CriarUsuarioController();
