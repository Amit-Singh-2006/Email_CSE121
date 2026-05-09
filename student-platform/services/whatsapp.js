const axios = require('axios');
require('dotenv').config();

const BASE_URL = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const headers = {
  'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

// Send hello_world test template
async function sendTestMessage(toNumber) {
  const payload = {
    messaging_product: "whatsapp",
    to: toNumber.replace('+', ''),
    type: "template",
    template: {
      name: "hello_world",
      language: { code: "en" }
    }
  };

  const res = await axios.post(BASE_URL, payload, { headers });
  return res.data;
}

// ─── Send attendance alert ─────────────────────────────────────────────────────
// Template variables:
//   {{1}} = studentName  e.g. "Rahul Sharma"
//   {{2}} = rollNumber   e.g. "CS2024001"
//   {{3}} = attendance   e.g. "68"
async function sendAttendanceAlert(toNumber, studentName, rollNumber, attendance) {
  const payload = {
    messaging_product: "whatsapp",
    to: toNumber.replace('+', ''),
    type: "template",
    template: {
      name: "attendance_alert",
      language: { code: "en" },
      components: [
        {
          type: "header",
          parameters: [
            { type: "text", text: String(studentName) }
          ]
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: String(studentName) },
            { type: "text", text: String(rollNumber) },
            { type: "text", text: String(attendance) }
          ]
        }
      ]
    }
  };

  try {
    const res = await axios.post(BASE_URL, payload, { headers });
    console.log(`✅ Attendance alert sent to ${toNumber} for ${studentName}`);
    return { success: true, data: res.data };
  } catch (error) {
    console.error(`❌ Failed to send to ${toNumber}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data };
  }
}

// ─── Send CGPA drop alert ──────────────────────────────────────────────────────
async function sendCGPAAlert(toNumber, studentName, cgpa) {
  const payload = {
    messaging_product: "whatsapp",
    to: toNumber.replace('+', ''),
    type: "template",
    template: {
      name: "cgpa_drop_alert",
      language: { code: "en" },
      components: [{
        type: "body",
        parameters: [
          { type: "text", text: String(studentName) },
          { type: "text", text: String(cgpa) }
        ]
      }]
    }
  };

  try {
    const res = await axios.post(BASE_URL, payload, { headers });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: error.response?.data };
  }
}

// ─── Bulk send to multiple parents ────────────────────────────────────────────
async function sendBulkAttendanceAlerts(students) {
  const results = [];

  for (const student of students) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = await sendAttendanceAlert(
      student.parentPhone,
      student.studentName,
      student.rollNumber,
      student.attendance
    );

    results.push({
      student: student.studentName,
      phone: student.parentPhone,
      ...result
    });
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`📊 Bulk send complete: ${successCount}/${students.length} sent`);
  return results;
}

module.exports = {
  sendTestMessage,
  sendAttendanceAlert,
  sendCGPAAlert,
  sendBulkAttendanceAlerts
};
