
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 0,

    charset: 'utf8mb4'
});

// Pemeriksaan koneksi database
async function checkDatabaseConnection() {
    let connection;

    try {
        connection = await pool.getConnection();

        await connection.ping();

        console.log('Koneksi database MySQL berhasil.');
    } catch (error) {
        console.error('Koneksi database MySQL gagal:', error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = pool;
module.exports.checkDatabaseConnection = checkDatabaseConnection;