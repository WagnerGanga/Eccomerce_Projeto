const pool = require("../../Model/connection");
const bcrypt = require("bcrypt");
const validator = require("validator");

class ActualizarUsuario {
    async actualizarUsuario(req, res) {
        let connection;

        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const { id_usuario } = req.params;
            if (!id_usuario || isNaN(id_usuario)) {
                return res.status(400).json({ success: false, message: "ID de usuário inválido" });
            }

            const queryString = "SELECT * FROM tbl_usuarios WHERE id_usuario = ?";
            const [userExists] = await connection.query(queryString, [id_usuario]);
            if (userExists.length === 0) {
                return res.status(404).json({ success: false, message: "Usuário não encontrado" });
            }

            const {
                primeiro_nome,
                segundo_nome,
                sexo,
                email,
                telefone,
                logradouro,
                rua,
                numero,
                cidade,
                password,
            } = req.body;

            // SANITIZAÇÃO
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

            const updates_tbl_usuario = [];
            const values_tbl_usuario = [];
            const updates_tbl_contactos = [];
            const values_tbl_contactos = [];
            const updates_tbl_enderecos = [];
            const values_tbl_enderecos = [];

            if (sanitizedInputs.primeiro_nome) {
                updates_tbl_usuario.push("primeiro_nome_usuario = ?");
                values_tbl_usuario.push(sanitizedInputs.primeiro_nome);
            }
            if (sanitizedInputs.segundo_nome) {
                updates_tbl_usuario.push("segundo_nome_usuario = ?");
                values_tbl_usuario.push(sanitizedInputs.segundo_nome);
            }
            if (sanitizedInputs.sexo) {
                updates_tbl_usuario.push("sexo_usuario = ?");
                values_tbl_usuario.push(sanitizedInputs.sexo);
            }
            if (sanitizedInputs.email) {
                if (!validator.isEmail(sanitizedInputs.email)) {
                    return res.status(400).json({ success: false, message: "Formato de e-mail inválido" });
                }

                const emailQuery = "SELECT email_usuario FROM tbl_usuarios WHERE email_usuario = ?";
                const [emailResponse] = await connection.query(emailQuery, [sanitizedInputs.email]);
                if (emailResponse.length > 0) {
                    return res.status(400).json({ success: false, message: "Este email já está em uso" });
                }

                updates_tbl_usuario.push("email_usuario = ?");
                values_tbl_usuario.push(sanitizedInputs.email);
            }
            if (sanitizedInputs.password) {
                const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
                if (!passwordRegex.test(sanitizedInputs.password)) {
                    return res.status(400).json({
                        success: false,
                        message: "A senha deve ter pelo menos 8 caracteres, incluir letras, números e pelo menos um caractere especial (@$!%*#?&)",
                    });
                }
                const passwordHashed = await bcrypt.hash(sanitizedInputs.password, 12);
                updates_tbl_usuario.push("password_usuario = ?");
                values_tbl_usuario.push(passwordHashed);
            }

            if (sanitizedInputs.telefone) {
                updates_tbl_contactos.push("numero_telefone = ?");
                values_tbl_contactos.push(sanitizedInputs.telefone);
            }

            if (sanitizedInputs.logradouro) {
                updates_tbl_enderecos.push("logradouro = ?");
                values_tbl_enderecos.push(sanitizedInputs.logradouro);
            }
            if (sanitizedInputs.rua) {
                updates_tbl_enderecos.push("rua = ?");
                values_tbl_enderecos.push(sanitizedInputs.rua);
            }
            if (sanitizedInputs.numero) {
                updates_tbl_enderecos.push("numero = ?");
                values_tbl_enderecos.push(sanitizedInputs.numero);
            }
            if (sanitizedInputs.cidade) {
                updates_tbl_enderecos.push("cidade = ?");
                values_tbl_enderecos.push(sanitizedInputs.cidade);
            }

            if (
                updates_tbl_usuario.length === 0 &&
                updates_tbl_contactos.length === 0 &&
                updates_tbl_enderecos.length === 0
            ) {
                return res.status(400).json({ success: false, message: "Nenhum dado válido fornecido para atualização" });
            }

            if (updates_tbl_usuario.length > 0) {
                const queryStringUsuario = `UPDATE tbl_usuarios SET ${updates_tbl_usuario.join(", ")} WHERE id_usuario = ?`;
                values_tbl_usuario.push(id_usuario);
                await connection.query(queryStringUsuario, values_tbl_usuario);
            }

            if (updates_tbl_contactos.length > 0) {
                const queryStringContactos = `UPDATE tbl_contactos SET ${updates_tbl_contactos.join(", ")} WHERE id_usuario = ?`;
                values_tbl_contactos.push(id_usuario);
                await connection.query(queryStringContactos, values_tbl_contactos);
            }

            if (updates_tbl_enderecos.length > 0) {
                const queryStringEnderecos = `UPDATE tbl_enderecos SET ${updates_tbl_enderecos.join(", ")} WHERE id_usuario = ?`;
                values_tbl_enderecos.push(id_usuario);
                await connection.query(queryStringEnderecos, values_tbl_enderecos);
            }

            const string = `
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
                LEFT JOIN
                    tbl_contactos ON tbl_usuarios.id_usuario = tbl_contactos.id_usuario
                LEFT JOIN 
                    tbl_enderecos ON tbl_usuarios.id_usuario = tbl_enderecos.id_usuario
                WHERE tbl_usuarios.id_usuario = ?
            `;
            const [datas] = await connection.query(string, [id_usuario]);

            await connection.commit();
            return res.status(200).json({ success: true, response: datas, message: "Dados atualizados com sucesso" });
        } catch (error) {
            if (connection) await connection.rollback();
            console.error("Erro ao atualizar usuário:", error.message, error.stack);
            return res.status(500).json({ success: false, message: "Houve um erro, tente mais tarde!" });
        } finally {
            if (connection) connection.release();
        }
    }
}

module.exports = new ActualizarUsuario();
