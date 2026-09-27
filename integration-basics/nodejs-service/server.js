const express = require('express');
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
app.use(express.json());
app.use(express.static('public')); 

const PORT = 3000;
const PYTHON_URL = 'http://localhost:5001';

const csvWriter = createCsvWriter({
    path: 'calculation_history.csv',
    header: [
        {id: 'timestamp', title: 'TIMESTAMP'},
        {id: 'num1', title: 'NUM1'},
        {id: 'num2', title: 'NUM2'},
        {id: 'operation', title: 'OPERATION'},
        {id: 'result', title: 'RESULT'}
    ]
});

app.get('/hello', (req, res) => {
    res.json({ message: 'Hello from Node.js Gateway!' });
});

app.post('/api/calculate', async (req, res) => {
    console.log('Node.js received:', req.body);
    try {
        const pythonResponse = await axios.post(`${PYTHON_URL}/calculate`, req.body);
        const resultData = pythonResponse.data;

        await csvWriter.writeRecords([{
            timestamp: new Date().toISOString(),
            num1: req.body.num1,
            num2: req.body.num2,
            operation: req.body.operation,
            result: resultData.result
        }]);

        res.json({
            gateway_message: 'Node.js successfully aggregated the data',
            python_result: resultData
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to reach Python service. Is it running on port 5001?'
        });
    }
});

app.get('/api/status', async (req, res) => {
    try {
        const ping = await axios.get(`${PYTHON_URL}/ping`);
        res.json({ gateway: 'Node.js is running', python: ping.data });
    } catch (error) {
        res.status(500).json({ gateway: 'Node.js is running', python: 'Python is NOT reachable' });
    }
});

app.listen(PORT, () => {
    console.log(`Node.js Gateway: http://localhost:${PORT}`);
    console.log(`Python URL: ${PYTHON_URL}`);
});