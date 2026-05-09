const axios = require('axios');
require('dotenv').config();

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const headers = {
  'api-key': process.env.BREVO_API_KEY,
  'Content-Type': 'application/json'
};

async function sendEmail({ toEmail, toName, subject, htmlContent }) {
  const payload = {
    sender: { name: process.env.EMAIL_SENDER_NAME || 'College Reports', email: process.env.EMAIL_SENDER_ADDRESS },
    to: [{ email: toEmail, name: toName }],
    subject, htmlContent
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

function generateAIEmailHTML(student, aiContent) {
  const attendanceColor = student.attendance < 60 ? '#dc2626' : student.attendance < 75 ? '#f59e0b' : '#16a34a';
  const riskBadge = {
    CRITICAL: { bg: '#fef2f2', color: '#991b1b', text: '🔴 Critical' },
    AT_RISK: { bg: '#fffbeb', color: '#92400e', text: '🟡 At Risk' },
    MONITOR: { bg: '#eff6ff', color: '#1e40af', text: '🔵 Monitor' },
    ON_TRACK: { bg: '#f0fdf4', color: '#166534', text: '🟢 On Track' },
  }[student.riskCategory] || { bg: '#f9fafb', color: '#374151', text: 'Unknown' };

  const subjectsTable = student.subjects?.length ? `
    <h3 style="color:#1e3a5f;font-size:15px;margin:24px 0 12px">📚 Subject-wise Performance</h3>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#1e3a5f;color:white">
        <th style="padding:10px 14px;text-align:left;font-size:13px">Subject</th>
        <th style="padding:10px 14px;text-align:center;font-size:13px">CA</th>
        <th style="padding:10px 14px;text-align:center;font-size:13px">Mid</th>
        <th style="padding:10px 14px;text-align:center;font-size:13px">End</th>
        <th style="padding:10px 14px;text-align:center;font-size:13px">Total</th>
      </tr></thead>
      <tbody>${student.subjects.map((s, i) => `
        <tr style="background:${i % 2 === 0 ? '#f8fafc' : 'white'}">
          <td style="padding:10px 14px;font-size:14px;border-bottom:1px solid #e5e7eb">${s.name}</td>
          <td style="padding:10px 14px;text-align:center;font-size:14px;border-bottom:1px solid #e5e7eb">${s.ca ?? '-'}</td>
          <td style="padding:10px 14px;text-align:center;font-size:14px;border-bottom:1px solid #e5e7eb">${s.mid ?? '-'}</td>
          <td style="padding:10px 14px;text-align:center;font-size:14px;border-bottom:1px solid #e5e7eb">${s.end ?? '-'}</td>
          <td style="padding:10px 14px;text-align:center;font-size:14px;font-weight:bold;border-bottom:1px solid #e5e7eb">${s.total ?? '-'}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : '';

  const recsSection = aiContent.recommendations?.length ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
      <p style="margin:0 0 8px;font-weight:bold;color:#166534;font-size:14px">📌 AI Recommendations:</p>
      ${aiContent.recommendations.map(r => `<div style="margin:6px 0;font-size:13px;color:#166534"><strong>${r.subject}:</strong> ${r.tip}</div>`).join('')}
    </div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:20px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
  <div style="background:#1e3a5f;color:white;padding:24px 32px">
    <h1 style="margin:0;font-size:22px">📊 Academic Performance Report</h1>
    <p style="margin:4px 0 0;opacity:0.8;font-size:14px">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <div style="padding:32px">
    <p style="font-size:15px">Dear <strong>${student.parentName || 'Parent/Guardian'}</strong>,</p>
    <div style="background:#f8fafc;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0">
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7">${aiContent.parentMessage}</p>
    </div>
    <div style="background:#f8fafc;border-left:4px solid #1e3a5f;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0">
      <div style="font-size:18px;font-weight:bold;color:#1e3a5f">${student.name}</div>
      <div style="margin-top:6px;font-size:13px;color:#6b7280">Roll No: ${student.rollNumber} | ${student.department || 'N/A'} | Sem ${student.semester}</div>
      <div style="margin-top:8px"><span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:bold;background:${riskBadge.bg};color:${riskBadge.color}">${riskBadge.text}</span></div>
    </div>
    <div style="display:flex;gap:16px;margin:16px 0">
      <div style="flex:1;background:#f8fafc;border-left:4px solid ${attendanceColor};padding:16px;border-radius:0 8px 8px 0">
        <div style="font-size:12px;color:#6b7280;text-transform:uppercase">Attendance</div>
        <div style="font-size:28px;font-weight:bold;color:${attendanceColor};margin-top:4px">${student.attendance}%</div>
        <div style="font-size:12px;color:${student.attendance < 75 ? '#dc2626' : '#16a34a'};margin-top:4px">${student.attendance < 75 ? '⚠️ Below 75% required' : '✅ Satisfactory'}</div>
      </div>
      <div style="flex:1;background:#f8fafc;border-left:4px solid #3b82f6;padding:16px;border-radius:0 8px 8px 0">
        <div style="font-size:12px;color:#6b7280;text-transform:uppercase">CGPA</div>
        <div style="font-size:28px;font-weight:bold;color:#3b82f6;margin-top:4px">${student.cgpa}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">out of 10.0</div>
      </div>
    </div>
    ${subjectsTable}
    ${recsSection}
    <p style="font-size:13px;color:#6b7280;margin-top:20px">For queries, contact the college office or your ward's assigned mentor.</p>
  </div>
  <div style="background:#f8fafc;padding:20px 32px;text-align:center;font-size:12px;color:#9ca3af">
    <p style="margin:0">${process.env.COLLEGE_NAME || 'Your College'} | Student Intelligence Platform</p>
    <p style="margin:4px 0 0">This is an automated message. Please do not reply.</p>
  </div>
</div>
</body></html>`;
}

async function sendAIStudentReport(student, tone = 'supportive') {
  if (!student.parentEmail) return { success: false, error: 'No parent email' };
  try {
    const { generateAIEmailContent } = require('./ai');
    const aiContent = await generateAIEmailContent(student, tone);
    const html = generateAIEmailHTML(student, aiContent);
    const result = await sendEmail({
      toEmail: student.parentEmail,
      toName: student.parentName || 'Parent/Guardian',
      subject: `Academic Report - ${student.name} | ${['CRITICAL', 'AT_RISK'].includes(student.riskCategory) ? '⚠️ Action Required | ' : ''}Semester ${student.semester}`,
      htmlContent: html
    });
    return { ...result, aiContent };
  } catch (error) {
    console.error('AI email error:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendStudentReport(student) {
  return await sendAIStudentReport(student, 'supportive');
}

async function sendBulkReports(students, tone = 'supportive') {
  const results = [];
  for (const student of students) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = await sendAIStudentReport(student, tone);
    results.push({ student: student.name, email: student.parentEmail, ...result });
  }
  console.log(`📧 Bulk AI email: ${results.filter(r => r.success).length}/${students.length} sent`);
  return results;
}

module.exports = { sendEmail, sendStudentReport, sendAIStudentReport, sendBulkReports };