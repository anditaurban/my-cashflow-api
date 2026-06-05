require('dotenv').config();

const cors = require('cors');
const express = require('express');
const routes = require('./routes');
const asyncHandler = require('./middleware/asyncHandler');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { pool } = require('./config/database');
const { sendSuccess } = require('./utils/response');

const app = express();

function getCorsOrigin() {
  const origin = process.env.CORS_ORIGIN || '*';

  if (origin === '*') {
    return '*';
  }

  return origin
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

app.use(cors({ origin: getCorsOrigin() }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  sendSuccess(res, {
    name: 'Cashflow Harian API',
    version: '1.0.0',
    api_base_url: '/api'
  });
});

app.get('/api/health', asyncHandler(async (req, res) => {
  await pool.query('SELECT 1 AS ok');

  sendSuccess(res, {
    status: 'ok',
    database: 'connected'
  });
}));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
