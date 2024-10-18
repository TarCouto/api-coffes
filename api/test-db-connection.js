const { Pool } = require('pg');

// Configuração do pool de conexão
const pool = new Pool({
  connectionString: 'postgres://default:nzfsVMC7xr6b@ep-snowy-salad-a6gkoffw.us-west-2.aws.neon.tech:5432/verceldb?sslmode=require',
});

// Testando a conexão ao banco de dados
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexão ao banco de dados bem-sucedida!');
    client.release(); // Libera a conexão de volta para o pool
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err.stack);
  }
};

testConnection();
