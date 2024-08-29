const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require('cors'); 
const dbConfig = require('./dbConfig');
const { sendEmail } = require('./mailer'); 


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


app.get('/api/AgentSupervisorTasks', async (req, res) => {
    try {
        const request = new sql.Request(pool);
        const result = await request.execute('AgentSupervisorTasks');
        
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error executing stored procedure');
    }
});


app.get('/api/NumberOfTasks', async (req, res) => {
    try {
       
        const request = new sql.Request(pool);
        const result = await request.execute('NumberOfTasks');
        
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error executing stored procedure');
    }
});




app.post('/api/update-extended-flag', async (req, res) => {
    try {
        
        await sql.query`EXEC UpdateExtendedFlag`;

        res.status(200).json({ message: 'Extended flags updated successfully.' });
    } catch (err) {
        console.error('Error executing stored procedure:', err);
        res.status(500).json({ message: 'An error occurred while updating extended flags.' });
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


app.post('/api/toggleUserActivity', async (req, res) => {
    const { userid } = req.body;

    try {
        const request = new sql.Request(pool);

        request.input('userid', sql.Int, userid);
        request.output('message', sql.NVarChar(50));

        const result = await request.execute('ToggleUserActivity');

        const message = result.output.message; 

        res.json({
            success: true,
            message: message
        });
    } catch (err) {
        console.error("API Error: ", err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while toggling the user activity.'
        });
    }
});

app.post('/api/submitButton', async (req, res) => {
    const { agentid, taskid } = req.body;

    try {
        const request = new sql.Request(pool);

       
        request.input('agentid', sql.Int, agentid);
        request.input('taskid', sql.Int, taskid);

       
        request.output('ErrorMessage', sql.NVarChar(255));

       
        const result = await request.execute('UpdateTaskStatus');

       
        const errorMessage = result.output.ErrorMessage;

        
        if (errorMessage && errorMessage.startsWith('Error:')) {
            res.status(400).json({
                success: false,
                message: errorMessage
            });
        } else {
            res.json({
                success: true,
                message: errorMessage || 'Task status updated successfully.'
            });
        }
    } catch (err) {
        console.error("API Error: ", err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the task status.'
        });
    }
});

app.post('/api/toggleUserActivityLog', async (req, res) => {
    const { userid, updatedBy, key } = req.body;

    try {
        const request = new sql.Request(pool);

       
        request.input('userid', sql.Int, userid);
        request.input('updatedBy', sql.NVarChar(100), updatedBy);
        request.input('key', sql.NVarChar(100), key);

       
        request.output('message', sql.NVarChar(50));

        const result = await request.execute('ToggleUserActivityAndLog');

    
        const message = result.output.message;

       
        res.json({
            success: true,
            message: message
        });
    } catch (err) {
        console.error("API Error: ", err);
        res.status(500).json({
            success: false,
            message: 'An error occurred while toggling the user activity.'
        });
    }
});


app.get('/api/getUserLogs/:userID', async (req, res) => {
    const userID = req.params.userID;

    try {
        const request = new sql.Request();
        request.input('userID', sql.Int, userID);
        const result = await request.execute('GetUserLogs');

        res.json(result.recordset);
    } catch (err) {
        console.error('Error executing stored procedure:', err);
        res.status(500).json({ error: 'Failed to retrieve user logs' });
    }
});

app.get('/api/getAgentsWithMinimumTasksExcluding/:excludedAgentId', async (req, res) => {
    const excludedAgentId = req.params.excludedAgentId; 

    try {
        const request = new sql.Request();
        request.input('ExcludedAgentId', sql.Int, excludedAgentId);

        const result = await request.execute('GetAgentsWithMinimumTasksExcluding');

        res.json(result.recordset);
    } catch (err) {
        console.error('Error executing stored procedure:', err);
        res.status(500).json({ error: 'An error occurred while executing the stored procedure' });
    }
});

app.post('/api/approveToken', async (req, res) => {
    const { tokenid, AdminRemarks, userid } = req.body;

  
    if (!tokenid || !AdminRemarks || !userid) {
        return res.status(400).json({ message: 'tokenid, AdminRemarks, and userid are required' });
    }

    try {
        const request = new sql.Request(pool);

     
        request.input('tokenid', sql.Int, tokenid);
        request.input('AdminRemarks', sql.NVarChar(255), AdminRemarks);
        request.input('userid', sql.Int, userid); 

   
        request.output('ErrorMessage', sql.NVarChar(255));

        const result = await request.execute('ApproveToken');
        const errorMessage = result.output.ErrorMessage;

        if (errorMessage.startsWith('Error:')) {
            res.status(400).json({ message: errorMessage });
        } else {
            res.status(200).json({ message: errorMessage });
        }

    } catch (err) {
        console.error('SQL error: ', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/api/rejectToken', async (req, res) => {
    const { tokenid, AdminRemarks, userid } = req.body;

    if (!tokenid || !AdminRemarks || !userid) {
        return res.status(400).json({ message: 'tokenid, AdminRemarks, and userid are required' });
    }

    try {
        const request = new sql.Request(pool);

     
        request.input('tokenid', sql.Int, tokenid);
        request.input('AdminRemarks', sql.NVarChar(255), AdminRemarks);
        request.input('userid', sql.Int, userid);  

        request.output('ErrorMessage', sql.NVarChar(255));

        const result = await request.execute('RejectToken');
        const errorMessage = result.output.ErrorMessage;

      
        if (errorMessage.startsWith('Error:')) {
            return res.status(400).json({ message: errorMessage });
        } else {
            return res.status(200).json({ message: errorMessage });
        }

    } catch (err) {
        console.error('SQL error: ', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});



app.get('/api/getTasksByAgent/:agentid', async (req, res) => {
    const agentid = parseInt(req.params.agentid, 10); 

    try {
        const request = new sql.Request();
        request.input('agentid', sql.Int, agentid);

        const result = await request.execute('GetTasksByAgent');

      
        if (result.recordset.length > 0 && result.recordset[0].ErrorMessage) {
            res.status(400).json({ error: result.recordset[0].ErrorMessage });
        } else {
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error executing stored procedure:', err);
        res.status(500).json({ error: 'Failed to retrieve tasks' });
    }
});


app.get('/api/agentSupervisory/:supervisorid', async (req, res) => {
    const supervisorid = parseInt(req.params.supervisorid, 10);  

    try {
        const request = new sql.Request(pool);
        request.input('supervisorid', sql.Int, supervisorid);
        request.output('ErrorMessage', sql.NVarChar(255)); 

        
        const result = await request.execute('AgentSupervisor');

       
        const errorMessage = result.output.ErrorMessage;
        const recordset = result.recordset;

        if (errorMessage) {
            if (errorMessage === 'Data retrieved successfully') {
                res.json(recordset);
            } else {
                res.status(400).json({ message: errorMessage });
            }
        } else {
            res.status(404).json({ message: 'No data found' });
        }
    } catch (err) {
        console.error('Error executing stored procedure:', err.message);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ error: 'Failed to retrieve tasks', details: err.message });
    }
});



app.get('/api/allAgents', async (req, res) => {
    try {
        const request = new sql.Request(pool);
        const result = await request.execute('SelectAllAgents');
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Error fetching all agents:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve agents'
        });
    }
});


app.get('/api/allTasks', async (req, res) => {
    try {
        const request = new sql.Request(pool);
        const result = await request.execute('SelectAllTasks');
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Failed to fetch tasks', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks'
        });
    }
});


app.post('/api/RescheduleTask', async (req, res) => {
    const { taskid, agentid, approverID, end_date, remarks } = req.body;

    try {
        const request = new sql.Request(pool);

       
        request.input('taskid', sql.Int, taskid);
        request.input('agentid', sql.Int, agentid);
        request.input('approverID', sql.Int, approverID);
        request.input('end_date', sql.Date, end_date);
        request.input('remarks', sql.NVarChar(255), remarks);

      
        request.output('ErrorMessage', sql.NVarChar(255));

    
        const result = await request.execute('RescheduleTask');

        const errorMessage = result.output.ErrorMessage;

      
        if (errorMessage === 'Approved record inserted successfully.') {
            res.json({
                success: true,
                message: errorMessage 
            });
        } else {
            res.json({
                success: false,
                message: errorMessage 
            });
        }

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});


app.post('/api/updateRescheduled', async (req, res) => {
    const { tokenid } = req.body;

    try {
        const request = new sql.Request(pool);

      
        request.input('tokenid', sql.Int, tokenid);

      
        request.output('ErrorMessage', sql.NVarChar(255));

       
        const result = await request.execute('UpdateIsRescheduled');

      
        const errorMessage = result.output.ErrorMessage;

        
        if (errorMessage && errorMessage.startsWith('Error:')) {
            res.status(400).json({
                success: false,
                message: errorMessage
            });
        } else {
            res.json({
                success: true,
                message: errorMessage
            });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the isRescheduled flag.'
        });
    }
});

app.post('/api/rescheduleTasky', async (req, res) => {
    const { taskid, agentid, approverID, start_date, end_date, supervisorid } = req.body;

    try {
        const request = new sql.Request(pool);

      
        request.input('taskid', sql.Int, taskid);
        request.input('agentid', sql.Int, agentid);
        request.input('approverID', sql.Int, approverID);
        request.input('start_date', sql.Date, start_date); 
        request.input('end_date', sql.Date, end_date);
        request.input('supervisorid', sql.Int, supervisorid);

       
        request.output('ErrorMessage', sql.NVarChar(255));

       
        const result = await request.execute('RescheduleTaskWithStartDate');

       
        const errorMessage = result.output.ErrorMessage;

      
        if (errorMessage && errorMessage.startsWith('Error:')) {
            res.status(400).json({  
                success: false,
                message: errorMessage
            });
        } else {
            await sendEmail(
                'haniak363@gmail.com',
                'Task Rescheduled Successfully',
                `The task with ID ${taskid} has been successfully rescheduled.`
            );
            res.json({
                success: true,
                message: 'Task rescheduled successfully'
            });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while rescheduling the task (500).'
        });
    }
});



app.post('/api/assignTask', async (req, res) => {
    const { taskid, supervisorid, agentid, start_date, end_date, pendingFlag, remarks } = req.body;

    try {
        const request = new sql.Request(pool);

       
        request.input('taskid', sql.Int, taskid);
        request.input('supervisorid', sql.Int, supervisorid);
        request.input('agentid', sql.Int, agentid);
        request.input('start_date', sql.Date, start_date);  
        request.input('end_date', sql.Date, end_date);
        request.input('pendingFlag', sql.Bit, pendingFlag || 1);
        request.input('remarks', sql.NVarChar(255), remarks);

        request.output('ErrorMessage', sql.NVarChar(255));

       
        const result = await request.execute('InsertIntoToken');

      
        const errorMessage = result.output.ErrorMessage;

        
        if (errorMessage && errorMessage.startsWith('Error:')) {
            res.status(400).json({  
                success: false,
                message: errorMessage
            });
        } else {
            res.json({
                success: true,
                message: 'Task assigned successfully'
            });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while assigning the task.'
        });
    }
});





// app.get('/api/validateUser', async (req, res) => {
//     const { email, password } = req.query;

//     try {
//         const request = new sql.Request(pool);

//         request.input('Email', sql.NVarChar(50), email);
//         request.input('userPassword', sql.NVarChar(50), password);
//         request.output('message', sql.NVarChar(5));

//         const result = await request.execute('validateUser');

//         const message = result.output.message;

//         res.json({
//             success: message === 'true',
//             code: 1,
//             message: message
//         });
//     } catch (err) {
//         console.error('SQL Server error:', err);
//         res.status(500).json({
//             success: false,
//             code: 0,
//             message: 'Error validating user'
//         });
//     }
// });

app.get('/api/validateUser', async (req, res) => {
    const { email, password } = req.query;

    try {
        const request = new sql.Request(pool);

        request.input('Email', sql.NVarChar(50), email);
        request.input('userPassword', sql.NVarChar(50), password);
        request.output('message', sql.NVarChar(5));
        request.output('userid', sql.Int);
        request.output('username', sql.NVarChar(50));
        request.output('role', sql.NVarChar(50));

        const result = await request.execute('validateUser');

        const { message, userid, username, role } = result.output;

        if (message === 'true') {
            res.json({
                success: true,
                code: 1,
                message: 'User validated successfully',
                userid: userid,
                username: username,
                role: role
            });
        } else {
            res.json({
                success: false,
                code: 0,
                message: 'Invalid email or password'
            });
        }
    } catch (err) {
        console.error('SQL Server error:', err);
        res.status(500).json({
            success: false,
            code: 0,
            message: 'Error validating user'
        });
    }
});


app.get('/api/agentSupervisor', async (req, res) => {
    const { supervisorId } = req.query;

    try {
       
        if (!supervisorId) {
            return res.status(400).json({
                success: false,
                code: 0,
                message: 'Supervisor ID is required'
            });
        }

        const request = new sql.Request(pool);

        request.input('supervisorid', sql.Int, supervisorId);
        request.output('ErrorMessage', sql.NVarChar(255));

        const result = await request.execute('AgentSupervisor');

        const { ErrorMessage } = result.output;

      
        if (ErrorMessage) {
            return res.json({
                success: false,
                code: 0,
                message: ErrorMessage
            });
        }

        const tasks = result.recordset;

        if (tasks.length > 0) {
            res.json({
                success: true,
                code: 1,
                message: 'Tasks retrieved successfully',
                data: tasks
            });
        } else {
            res.json({
                success: false,
                code: 0,
                message: 'No tasks found for this supervisor'
            });
        }
    } catch (err) {
        console.error('SQL Server error:', err);
        res.status(500).json({
            success: false,
            code: 0,
            message: 'Error retrieving tasks'
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
