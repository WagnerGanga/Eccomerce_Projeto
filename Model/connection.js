const mysql = require("mysql2");

const dbConfig = {
    host: process.env.DB_HOST_URI || "localhost",
    user: process.env.DB_USER_URI || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME_URI || "db_kawasport",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Cria o pool de conexões
const pool = mysql.createPool(dbConfig);

// Lida com erros globais do pool
pool.on('error', (error) => {
    if (error.code === 'ECONNRESET') {
        console.error("Erro: A conexão com o servidor MySQL foi reiniciada. Verifique se o servidor está funcionando corretamente.");
    } else {
        console.error("Erro na conexão com o MySQL:", error.message);
    }
});

// Função de teste para garantir que a conexão está funcionando
const testConnection = async () => {
    try {
        const connection = await pool.promise().getConnection();
        console.log("Conexão com o MySQL bem-sucedida!");
        connection.release(); // Libera a conexão de volta ao pool
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error("Erro: Não foi possível conectar aos servidores, tente novamente.");
        } else {
            console.error("Erro ao conectar ao banco de dados:", error.message);
        }
        process.exit(1);
    }
};

// Testa a conexão
testConnection();

// Exporta o pool com suporte a Promises
module.exports = pool.promise();
