const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const dbConfig = require('./dbConfig');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

let pool;

sql.connect(dbConfig).then(p => {
    pool = p;
    console.log('Database connected successfully');
}).catch(err => {
    console.error('Database connection failed:', err);
});

app.get('/', (req, res) => {
    res.send('Hello World');
});

// Example route to get data from SQL Server
app.get('/api/data', async (req, res) => {
    try {
        const request = new sql.Request(pool);
        const result = await request.query('SELECT * FROM login');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving data');
    }
});

// Endpoint to execute stored procedure userdetails
app.get('/api/userdetails', async (req, res) => {
    try {
        const request = new sql.Request(pool);
        const result = await request.execute('userdetails');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error executing stored procedure');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
