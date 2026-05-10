require('dotenv').config();
const prisma = require('../lib/prisma');
const { sendAttendanceAlert } = require('../services/whatsapp');
const { sendStudentReport, sendAIStudentReport, sendBulkReports } = require('../services/email');

// ─── Check and send attendance alerts ─────────────────────────────────────────
async function checkAndSendAttendanceAlerts(threshold = 75, tenantId = null) {
  console.log(`\n🔍 Checking attendance alerts (threshold: ${threshold}%)...`);

  try {
    const atRiskStudents = await prisma.student.findMany({
      where: {
        isActive: true,
        attendance: { lt: threshold },
        parentPhone: { not: null },
        ...(tenantId && { tenantId })
      },
      include: {
        department: true,
        semesterRecords: {
          orderBy: { semester: 'desc' },
          take: 1,
          include: { subjects: true }
        }
      }
    });

    if (atRiskStudents.length === 0) {
      console.log(`✅ No students below ${threshold}% attendance.`);
      return { whatsappResults: [], emailResults: [] };
    }

    console.log(`⚠️  Found ${atRiskStudents.length} students below ${threshold}%`);
    atRiskStudents.forEach(s => console.log(`   - ${s.name}: ${s.attendance}%`));

    const whatsappResults = [];
    const emailResults = [];

    for (const student of atRiskStudents) {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Send WhatsApp
      const waResult = await sendAttendanceAlert(
        student.parentPhone,
        student.name,
        student.rollNumber,
        student.attendance
      );
      whatsappResults.push({ student: student.name, ...waResult });
      await logCommunication({ tenantId: student.tenantId, studentId: student.id, channel: 'WHATSAPP', type: 'attendance_alert', recipient: student.parentPhone, result: waResult });

      // Send Email
      if (student.parentEmail) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const emailResult = await sendStudentReport(formatStudentForEmail(student));
        emailResults.push({ student: student.name, ...emailResult });
        await logCommunication({ tenantId: student.tenantId, studentId: student.id, channel: 'EMAIL', type: 'attendance_alert_report', recipient: student.parentEmail, result: emailResult });
      }

      // Update risk category
      await prisma.student.update({
        where: { id: student.id },
        data: { riskCategory: calculateRiskCategory(student.attendance, student.cgpa) }
      });
    }

    const waSent = whatsappResults.filter(r => r.success).length;
    const emailSent = emailResults.filter(r => r.success).length;
    console.log(`\n📊 Summary: WhatsApp ${waSent}/${atRiskStudents.length} | Email ${emailSent}/${atRiskStudents.length}`);

    return { whatsappResults, emailResults };

  } catch (error) {
    console.error('❌ Alert worker error:', error);
    throw error;
  }
}

// ─── Send monthly reports to ALL students ─────────────────────────────────────
async function sendMonthlyReportsToAll(tenantId = null) {
  console.log('\n📅 Sending monthly reports to all students...');

  const students = await prisma.student.findMany({
    where: { isActive: true, parentEmail: { not: null }, ...(tenantId && { tenantId }) },
    include: { department: true, semesterRecords: { orderBy: { semester: 'desc' }, take: 1, include: { subjects: true } } }
  });

  let sent = 0;
  for (const student of students) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const tone = student.riskCategory === 'CRITICAL' ? 'urgent' :
      student.riskCategory === 'AT_RISK' ? 'formal' : 'supportive';

    const result = await sendAIStudentReport(formatStudentForEmail(student), tone);
    if (result.success) {
      sent++;
      await logCommunication({ tenantId: student.tenantId, studentId: student.id, channel: 'EMAIL', type: 'monthly_report', recipient: student.parentEmail, result });
    }
  }

  console.log(`✅ Monthly reports: ${sent}/${students.length} sent`);
  return { sent, total: students.length };
}

// ─── Get analytics ─────────────────────────────────────────────────────────────
async function getAnalytics(tenantId = null) {
  const where = { isActive: true, ...(tenantId && { tenantId }) };
  const [total, atRisk, critical, onTrack, avgAtt, avgCgpa] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.count({ where: { ...where, riskCategory: 'AT_RISK' } }),
    prisma.student.count({ where: { ...where, riskCategory: 'CRITICAL' } }),
    prisma.student.count({ where: { ...where, riskCategory: 'ON_TRACK' } }),
    prisma.student.aggregate({ where, _avg: { attendance: true } }),
    prisma.student.aggregate({ where, _avg: { cgpa: true } })
  ]);
  return {
    totalStudents: total, atRisk, critical, onTrack,
    monitor: total - atRisk - critical - onTrack,
    avgAttendance: Math.round(avgAtt._avg.attendance || 0),
    avgCgpa: (avgCgpa._avg.cgpa || 0).toFixed(2)
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function logCommunication({ tenantId, studentId, channel, type, recipient, result }) {
  try {
    await prisma.communicationLog.create({
      data: {
        tenantId, studentId, channel, type, recipient,
        status: result.success ? 'SENT' : 'FAILED',
        messageId: result.data?.messages?.[0]?.id || result.messageId || null,
        failReason: result.success ? null : JSON.stringify(result.error),
        sentAt: result.success ? new Date() : null
      }
    });
  } catch (err) {
    console.error('Log error:', err.message);
  }
}

function formatStudentForEmail(student) {
  const latestSem = student.semesterRecords?.[0];
  return {
    name: student.name,
    rollNumber: student.rollNumber,
    parentName: student.parentName,
    parentEmail: student.parentEmail,
    department: student.department?.name,
    semester: student.currentSemester,
    cgpa: student.cgpa,
    attendance: student.attendance,
    riskCategory: student.riskCategory,  // ← ADD THIS
    subjects: latestSem?.subjects?.map(s => ({
      name: s.subjectName,
      ca: s.caMarks,
      mid: s.midtermMarks,
      end: s.endtermMarks,
      total: s.totalMarks
    }))
  };
}

function calculateRiskCategory(attendance, cgpa) {
  if (attendance < 50 || cgpa < 4) return 'CRITICAL';
  if (attendance < 65 || cgpa < 5) return 'AT_RISK';
  if (attendance < 75 || cgpa < 7) return 'MONITOR';
  return 'ON_TRACK';
}

if (require.main === module) {
  checkAndSendAttendanceAlerts(75)
    .then(() => { console.log('\n✅ Done!'); process.exit(0); })
    .catch(err => { console.error('❌', err); process.exit(1); });
}

module.exports = { checkAndSendAttendanceAlerts, sendMonthlyReportsToAll, getAnalytics };