const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require('cors'); 
const dbConfig = require('./dbConfig');

const app = express();
const port = process.env.PORT || 3000;


app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
        res.json({
            response: true,
            Code: 1,
            data: result.recordset
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            response: false,
            Code: '0',
            message: 'Error retrieving data'
        });
    }
});


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


app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const request = new sql.Request(pool);
        const query = 'SELECT * FROM login WHERE email = @Email AND password = @Password';
        request.input('Email', sql.VarChar, email);
        request.input('Password', sql.VarChar, password);

        const result = await request.query(query);

        if (result.recordset.length > 0) {
            res.json({
                success: true,
                code: 1,
                message: 'Login successful'
            });
        } else {
            res.json({
                success: false,
                code: 1,
                message: 'Invalid email or password'
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            Code: 0,
            message: 'Error verifying credentials'
        });
    }
});


app.post('/api/createUser', async (req, res) => {
    const {
        userName,
        userPassword,
        gender,
        contact,
        age,
        EmployeeCode,
        Email,
        rolename
    } = req.body;

    try {
        const request = new sql.Request(pool);

        request.input('userName', sql.NVarChar(50), userName);
        request.input('userPassword', sql.NVarChar(50), userPassword);
        request.input('gender', sql.NVarChar(10), gender);
        request.input('contact', sql.NVarChar(20), contact);
        request.input('age', sql.Int, age);
        request.input('EmployeeCode', sql.NVarChar(10), EmployeeCode);
        request.input('Email', sql.NVarChar(50), Email);
        request.input('rolename', sql.NVarChar(50), rolename);
        request.output('ErrorMessage', sql.NVarChar(255));

        const result = await request.execute('insertuser');

        const errorMessage = result.output.ErrorMessage;

        res.json({
            success: errorMessage === 'User has been successfully added.',
            message: errorMessage
        });
    } catch (err) {
        console.error("API Error: ", err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the user.'
        });
    }
});

app.get('/api/validateUser', async (req, res) => {
    const { email, password } = req.query;

    try {
        const request = new sql.Request(pool);

        request.input('Email', sql.NVarChar(50), email);
        request.input('userPassword', sql.NVarChar(50), password);
        request.output('message', sql.NVarChar(5));

        const result = await request.execute('validateUser');

        const message = result.output.message;

        res.json({
            success: message === 'true',
            code: 1,
            message: message
        });
    } catch (err) {
        console.error('SQL Server error:', err);
        res.status(500).json({
            success: false,
            code: 0,
            message: 'Error validating user'
        });
    }
});



process.on('SIGINT', async () => {
    console.log('Closing database connection');
    await sql.close();
    process.exit(0);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
