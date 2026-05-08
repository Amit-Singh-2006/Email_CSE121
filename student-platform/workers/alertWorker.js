require('dotenv').config();
const { sendAttendanceAlert, sendBulkAttendanceAlerts } = require('../services/whatsapp');
const { sendBulkReports } = require('../services/email');

// ─── Mock student data (replace with Prisma DB query later) ───────────────────
// This is what your DB query will return
const getMockStudents = () => [
  {
    id: 1,
    name: 'Rahul Sharma',
    rollNumber: 'CS2024001',
    parentPhone: '+917877076804', // your test number for now
    parentEmail: 'parent1@example.com',
    parentName: 'Mr. Sharma',
    department: 'Computer Science',
    semester: 4,
    attendance: 68,
    cgpa: 7.2,
    subjects: [
      { name: 'Data Structures', ca: 18, mid: 22, end: 45, total: 85 },
      { name: 'DBMS', ca: 15, mid: 18, end: 38, total: 71 },
      { name: 'OS', ca: 12, mid: 20, end: 40, total: 72 },
    ],
    mentorNote: 'Student needs to improve attendance and focus on DBMS.'
  },
  {
    id: 2,
    name: 'Priya Patel',
    rollNumber: 'CS2024002',
    parentPhone: '+917877076804', // same test number
    parentEmail: 'parent2@example.com',
    parentName: 'Mrs. Patel',
    department: 'Computer Science',
    semester: 4,
    attendance: 55, // critical
    cgpa: 6.1,
    subjects: [
      { name: 'Data Structures', ca: 10, mid: 15, end: 30, total: 55 },
      { name: 'DBMS', ca: 12, mid: 14, end: 32, total: 58 },
    ],
    mentorNote: 'Urgent: Student attendance is critically low.'
  }
];

// ─── Check and send attendance alerts ─────────────────────────────────────────
// threshold: send alert if attendance below this % (default 75)
async function checkAndSendAttendanceAlerts(threshold = 75) {
  console.log(`\n🔍 Checking attendance alerts (threshold: ${threshold}%)...`);

  // Replace this with: const students = await prisma.student.findMany({ where: { attendance: { lt: threshold } } });
  const allStudents = getMockStudents();
  const atRiskStudents = allStudents.filter(s => s.attendance < threshold);

  if (atRiskStudents.length === 0) {
    console.log('✅ No students below threshold. No alerts needed.');
    return;
  }

  console.log(`⚠️  Found ${atRiskStudents.length} students below ${threshold}% attendance`);

  // Send WhatsApp alerts
  const whatsappResults = await sendBulkAttendanceAlerts(
    atRiskStudents.map(s => ({
      parentPhone: s.parentPhone,
      studentName: s.name,
      rollNumber: s.rollNumber,
      attendance: s.attendance
    }))
  );

  // Send Email reports
  const emailResults = await sendBulkReports(atRiskStudents);

  // Summary
  const waSent = whatsappResults.filter(r => r.success).length;
  const emailSent = emailResults.filter(r => r.success).length;

  console.log(`\n📊 Alert Summary:`);
  console.log(`   WhatsApp: ${waSent}/${atRiskStudents.length} sent`);
  console.log(`   Email:    ${emailSent}/${atRiskStudents.length} sent`);

  return { whatsappResults, emailResults };
}

// ─── Send monthly reports to ALL students ─────────────────────────────────────
async function sendMonthlyReportsToAll() {
  console.log('\n📅 Sending monthly reports to all students...');

  // Replace with: const students = await prisma.student.findMany();
  const allStudents = getMockStudents();

  const emailResults = await sendBulkReports(allStudents);
  const sent = emailResults.filter(r => r.success).length;
  console.log(`✅ Monthly reports: ${sent}/${allStudents.length} sent`);
}

// ─── Run manually for testing ──────────────────────────────────────────────────
// node workers/alertWorker.js
if (require.main === module) {
  console.log('🧪 Running alert worker manually...\n');
  checkAndSendAttendanceAlerts(75)
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}

module.exports = { checkAndSendAttendanceAlerts, sendMonthlyReportsToAll };
