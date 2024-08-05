// dbConfig.js
const sql = require('mssql');

const config = {
    user: 'admin',
    password: '12345',
    server: 'DESKTOP-2OJB142', // 'localhost' for local development
    database: 'mydb',
    options: {
        encrypt: true, // If you are using Azure
        enableArithAbort: true,
        trustServerCertificate: true // Add this line to bypass self-signed certificate validation
    }
};

module.exports = config;
