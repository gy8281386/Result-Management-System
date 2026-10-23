const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // XAMPP me default blank hota hai
    database: 'result_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed ❌:", err.message);
    } else {
        console.log("Database connected successfully ✅");
        connection.release();
    }
});

module.exports = db;                      