const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

// Import serverless handlers and wrap for Express
const submitHandler = require('../api/submit');
const updateHandler = require('../api/update');
const healthHandler = require('../api/health');
const reminderHandler = require('../api/cron/reminder');

app.post('/api/submit', (req, res) => submitHandler(req, res));
app.get('/api/update', (req, res) => updateHandler(req, res));
app.get('/api/health', (req, res) => healthHandler(req, res));
app.get('/api/cron/reminder', (req, res) => reminderHandler(req, res));

// OPTIONS preflight
app.options('/api/*', (req, res) => res.status(200).end());

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dev server running on port ${PORT}`);
});
