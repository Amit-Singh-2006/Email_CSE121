const axios = require('axios');
require('dotenv').config();

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const headers = {
  'api-key': process.env.BREVO_API_KEY,
  'Content-Type': 'application/json'
};

// ─── Send single email ─────────────────────────────────────────────────────────
async function sendEmail({ toEmail, toName, subject, htmlContent, attachments = [] }) {
  const payload = {
    sender: {
      name: process.env.EMAIL_SENDER_NAME || 'College Reports',
      email: process.env.EMAIL_SENDER_ADDRESS
    },
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent,
    ...(attachments.length > 0 && { attachment: attachments })
  };

  try {
    const res = await axios.post(BREVO_URL, payload, { headers });
    console.log(`✅ Email sent to ${toEmail}`);
    return { success: true, messageId: res.data.messageId };
  } catch (error) {
    console.error(`❌ Email failed to ${toEmail}:`, error.response?.data);
    return { success: false, error: error.response?.data };
  }
}

// ─── Generate attendance alert email HTML ──────────────────────────────────────
function generateAttendanceEmailHTML(student) {
  const attendanceColor = student.attendance < 60 ? '#dc2626' :
    student.attendance < 75 ? '#f59e0b' : '#16a34a';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: #1e3a5f; color: white; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 4px 0 0; opacity: 0.8; font-size: 14px; }
    .body { padding: 32px; }
    .stat-card { background: #f8fafc; border-left: 4px solid ${attendanceColor}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 16px 0; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 28px; font-weight: bold; color: ${attendanceColor}; margin: 4px 0 0; }
    .marks-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .marks-table th { background: #1e3a5f; color: white; padding: 10px 14px; text-align: left; font-size: 13px; }
    .marks-table td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .marks-table tr:hover td { background: #f8fafc; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .alert-box p { margin: 0; color: #991b1b; font-size: 14px; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: ${attendanceColor}20; color: ${attendanceColor}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Academic Performance Report</h1>
      <p>${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <div class="body">
      <p>Dear <strong>${student.parentName || 'Parent/Guardian'}</strong>,</p>
      <p>This is an update regarding the academic performance of your ward:</p>
      
      <div class="stat-card">
        <div class="stat-label">Student Name</div>
        <div style="font-size:18px;font-weight:bold;color:#1e3a5f;margin-top:4px">${student.name}</div>
        <div style="margin-top:6px;font-size:13px;color:#6b7280">Roll No: ${student.rollNumber} | ${student.department} | Sem ${student.semester}</div>
      </div>
 
      <div style="display:flex;gap:16px;margin:16px 0">
        <div class="stat-card" style="flex:1">
          <div class="stat-label">Attendance</div>
          <div class="stat-value">${student.attendance}%</div>
          <span class="badge">${student.attendance < 75 ? '⚠️ Below Required' : '✅ Satisfactory'}</span>
        </div>
        <div class="stat-card" style="flex:1;border-color:#3b82f6">
          <div class="stat-label">CGPA</div>
          <div class="stat-value" style="color:#3b82f6">${student.cgpa}</div>
          <span class="badge" style="background:#dbeafe;color:#1d4ed8">Semester ${student.semester}</span>
        </div>
      </div>
 
      ${student.subjects ? `
      <h3 style="color:#1e3a5f;font-size:15px">Subject-wise Marks</h3>
      <table class="marks-table">
        <thead>
          <tr><th>Subject</th><th>CA</th><th>Mid</th><th>End</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${student.subjects.map(s => `
          <tr>
            <td>${s.name}</td>
            <td>${s.ca}</td>
            <td>${s.mid}</td>
            <td>${s.end}</td>
            <td><strong>${s.total}</strong></td>
          </tr>`).join('')}
        </tbody>
      </table>` : ''}
 
      ${student.attendance < 75 ? `
      <div class="alert-box">
        <p>⚠️ <strong>Attendance Alert:</strong> Current attendance (${student.attendance}%) is below the minimum required 75%. 
        Continued absence may result in academic consequences including being barred from examinations.</p>
      </div>` : ''}
 
      ${student.mentorNote ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:#166534"><strong>📝 Mentor Note:</strong> ${student.mentorNote}</p>
      </div>` : ''}
 
      <p style="font-size:13px;color:#6b7280">For any queries, please contact the college office or your ward's mentor directly.</p>
    </div>
    <div class="footer">
      <p>${process.env.COLLEGE_NAME || 'Your College'} | Academic Reports System</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send student report email ─────────────────────────────────────────────────
async function sendStudentReport(student) {
  return await sendEmail({
    toEmail: student.parentEmail,
    toName: student.parentName || 'Parent/Guardian',
    subject: `Academic Report - ${student.name} | Semester ${student.semester}`,
    htmlContent: generateAttendanceEmailHTML(student)
  });
}

// ─── Bulk send emails ──────────────────────────────────────────────────────────
async function sendBulkReports(students) {
  const results = [];

  for (const student of students) {
    await new Promise(resolve => setTimeout(resolve, 200)); // rate limit: 5/sec
    const result = await sendStudentReport(student);
    results.push({ student: student.name, email: student.parentEmail, ...result });
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`📧 Bulk email complete: ${successCount}/${students.length} sent`);
  return results;
}

module.exports = { sendEmail, sendStudentReport, sendBulkReports, generateAttendanceEmailHTML };
