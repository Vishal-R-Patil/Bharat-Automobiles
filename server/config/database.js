const mysql= require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool(process.env.DATABASE_URL);

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log("✅ Successfully connected to the Bharat Automobiles database!");
        connection.release();
    })
    .catch(err => {
        console.error("❌ Database connection failed: ", err.message);
    });

module.exports = pool;