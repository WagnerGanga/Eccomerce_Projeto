function validateUserData({ primeiro_nome, segundo_nome, sexo, email, password, tipo_usuario }) {
    if (!primeiro_nome || !segundo_nome || !sexo || !email || !password || !tipo_usuario) {
      throw new Error("Oooops!! Verifique se preencheu todos os campos");
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Formato de e-mail inválido");
    }
  
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error("Senha insegura. Ela deve ter pelo menos 8 caracteres, incluir letras, números e caracteres especiais.");
    }
  
    const validUserTypes = ["admin", "cliente"];
    if (!validUserTypes.includes(tipo_usuario)) {
      throw new Error("Tipo de usuário inválido");
    }
  }

module.exports = {validateUserData}