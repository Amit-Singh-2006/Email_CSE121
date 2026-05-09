const express = require('express');
const dotenv = require('dotenv');
const cron = require('node-cron');
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const { authenticateToken } = require('./middleware/auth');

// Public routes
app.use('/webhook', require('./routes/webhook'));
app.use('/api/auth', require('./routes/auth'));
app.get('/', (req, res) => res.json({ status: '✅ Student Platform API Running', version: '1.0.0', timestamp: new Date().toISOString() }));

// Protected routes
app.use('/api/students', authenticateToken, require('./routes/students'));
app.use('/api/alerts', authenticateToken, require('./routes/alerts'));
app.use('/api/upload', authenticateToken, require('./routes/upload'));
app.use('/api/ai', authenticateToken, require('./routes/ai'));

// Cron jobs
const { checkAndSendAttendanceAlerts } = require('./workers/alertWorker');
cron.schedule('0 8 * * 1', () => checkAndSendAttendanceAlerts(75));
cron.schedule('0 9 * * *', () => checkAndSendAttendanceAlerts(60));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login`);
});