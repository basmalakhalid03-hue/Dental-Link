require('dotenv').config();
const { setupRuntime } = require('./lib/runtime');
setupRuntime();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getUploadsDir } = require('./lib/runtime');

const authRoutes     = require('./routes/auth');
const casesRoutes    = require('./routes/cases');
const stepsRoutes    = require('./routes/steps');
const filesRoutes    = require('./routes/files');
const adminRoutes    = require('./routes/admin');
const deliveryRoutes = require('./routes/delivery');
const workflowRoutes   = require('./routes/workflow');
const crownTypeRoutes  = require('./routes/crownTypes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_BRANCH_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.VERCEL) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(getUploadsDir()));

app.use('/api/auth',     authRoutes);
app.use('/api/cases',    casesRoutes);
app.use('/api/steps',    stepsRoutes);
app.use('/api/files',    filesRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/workflow',    workflowRoutes);
app.use('/api/crown-types', crownTypeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DentalLink API is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
