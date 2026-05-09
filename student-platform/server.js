const express = require('express');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const app = express();
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
const webhookRouter = require('./routes/webhook');
const studentsRouter = require('./routes/students');
const alertsRouter = require('./routes/alerts');

app.use('/webhook', webhookRouter);
app.use('/api/students', studentsRouter);
app.use('/api/alerts', alertsRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: '✅ Student Platform API Running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── Scheduled Jobs ───────────────────────────────────────────────────────────
const { checkAndSendAttendanceAlerts } = require('./workers/alertWorker');

// Every Monday at 8:00 AM — send weekly attendance alerts
cron.schedule('0 8 * * 1', async () => {
  console.log('🕐 Running weekly attendance check...');
  await checkAndSendAttendanceAlerts();
});

// Every day at 9:00 AM — check for critical attendance (below 60%)
cron.schedule('0 9 * * *', async () => {
  console.log('🚨 Running daily critical attendance check...');
  await checkAndSendAttendanceAlerts(60); // critical threshold
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
});

const aiRouter = require('./routes/ai');
app.use('/api/ai', aiRouter);