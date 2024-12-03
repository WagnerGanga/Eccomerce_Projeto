const pool = require("../../Model/connection");
const bcrypt = require("bcrypt");
const validator = require("validator");

class CriarUsuario {
    async criarUsuario(req, res) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            // Sanitização e validação dos dados de entrada
            const { primeiro_nome, segundo_nome, sexo, email, telefone, logradouro, rua, numero, cidade, password, tipo_usuario } = req.body;
            if (!primeiro_nome || !segundo_nome || !sexo || !email || !telefone || !logradouro || !rua || !numero || !cidade || !password)
            {
              console.log("Preencha todos os campos")
              return res.status(400).json({success:false, message: "Verifique se preencheu todos os campos obrigatórios"})
            }
            if (!["M", "F"].includes(sexo.trim().toUpperCase()))
            {
              return res.status(400).json({success:false, message: "Sexo invalido"})
            }
            const validUserTypes = ["admin", "cliente"];
            if (!validUserTypes.includes(tipo_usuario)) {
              return res.status(400).json({ success: false, message: "Tipo de usuário inválido" });
            }
            // Sanitizar entradas
            const sanitizedInputs = {
                primeiro_nome: primeiro_nome ? validator.escape(validator.trim(primeiro_nome)) : null,
                segundo_nome: segundo_nome ? validator.escape(validator.trim(segundo_nome)) : null,
                sexo: sexo ? validator.escape(validator.trim(sexo)) : null,
                email: email ? validator.normalizeEmail(email) : null,
                telefone: telefone ? validator.escape(validator.trim(telefone)) : null,
                logradouro: logradouro ? validator.escape(validator.trim(logradouro)) : null,
                rua: rua ? validator.escape(validator.trim(rua)) : null,
                numero: numero ? validator.escape(validator.trim(numero)) : null,
                cidade: cidade ? validator.escape(validator.trim(cidade)) : null,
                password: password ? validator.escape(validator.trim(password)) : null,
            };

            // Validação de e-mail
            if (sanitizedInputs.email && !validator.isEmail(sanitizedInputs.email)) {
                return res.status(400).json({ success: false, message: "Formato de e-mail inválido" });
            }

            // Validação de senha (mínimo 8 caracteres, pelo menos 1 número e 1 caractere especial)
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
            if (sanitizedInputs.password && !passwordRegex.test(sanitizedInputs.password)) {
                return res.status(400).json({
                    success: false,
                    message: "A senha deve ter pelo menos 8 caracteres, incluir letras, números e pelo menos um caractere especial (@$!%*#?&)",
                });
            }

            const phoneQuery = "SELECT numero_telefone FROM tbl_contactos WHERE numero_telefone = ?";
            const [phoneResponse] = await connection.query(phoneQuery, [sanitizedInputs.numero]);
            if (phoneResponse.length > 0) {
                return res.status(400).json({ success: false, message: "Este numero de telefone já está em uso" });
            }

            // Verificar se o e-mail já existe
            const emailQuery = "SELECT email_usuario FROM tbl_usuarios WHERE email_usuario = ?";
            const [emailResponse] = await connection.query(emailQuery, [sanitizedInputs.email]);
            if (emailResponse.length > 0) {
                return res.status(400).json({ success: false, message: "Este e-mail já está em uso" });
            }

            // Hash da senha antes de salvar
            const passwordHashed = await bcrypt.hash(sanitizedInputs.password, 12);

            // Inserir dados na tabela tbl_usuarios
            const queryStringUsuario = `
                INSERT INTO tbl_usuarios (primeiro_nome_usuario, segundo_nome_usuario, sexo_usuario, email_usuario, password_usuario)
                VALUES (?, ?, ?, ?, ?)
            `;
            const [resultUsuario] = await connection.query(queryStringUsuario, [
                sanitizedInputs.primeiro_nome,
                sanitizedInputs.segundo_nome,
                sanitizedInputs.sexo,
                sanitizedInputs.email,
                passwordHashed,
            ]);
            const id_usuario = resultUsuario.insertId;

            // Inserir dados na tabela tbl_contactos
            const queryStringContactos = `
                INSERT INTO tbl_contactos (id_usuario, numero_telefone)
                VALUES (?, ?)
            `;
            await connection.query(queryStringContactos, [id_usuario, sanitizedInputs.telefone]);

            // Inserir dados na tabela tbl_enderecos
            const queryStringEnderecos = `
                INSERT INTO tbl_enderecos (id_usuario, logradouro, rua, numero, cidade)
                VALUES (?, ?, ?, ?, ?)
            `;
            await connection.query(queryStringEnderecos, [
                id_usuario,
                sanitizedInputs.logradouro,
                sanitizedInputs.rua,
                sanitizedInputs.numero,
                sanitizedInputs.cidade,
            ]);

            await connection.commit();

            return res.status(201).json({
                success: true,
                message: "Usuário criado com sucesso",
                id_usuario: id_usuario,
            });
        } catch (error) {
            if (connection) await connection.rollback();
            console.error("Erro ao criar usuário:", error.message, error.stack);
            return res.status(500).json({
                success: false,
                message: "Houve um erro, tente mais tarde!",
            });
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = new CriarUsuario();
