const express = require('express');
const router = express.Router();
const { checkAndSendAttendanceAlerts, sendMonthlyReportsToAll } = require('../workers/alertWorker');

// POST /api/alerts/attendance — manually trigger attendance alerts
router.post('/attendance', async (req, res) => {
  const threshold = req.body.threshold || 75;
  console.log(`📨 Manual attendance alert triggered (threshold: ${threshold}%)`);
  const results = await checkAndSendAttendanceAlerts(threshold);
  res.json({ success: true, results });
});

// POST /api/alerts/monthly — send monthly reports to all
router.post('/monthly', async (req, res) => {
  console.log('📅 Manual monthly report triggered');
  await sendMonthlyReportsToAll();
  res.json({ success: true, message: 'Monthly reports queued' });
});

// GET /api/alerts/analytics
router.get('/analytics', async (req, res) => {
  try {
    const { getAnalytics } = require('../workers/alertWorker');
    const data = await getAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
