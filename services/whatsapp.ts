import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const headers = {
  'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

// ─── Send hello_world test template ───────────────────────────────────────────
export async function sendTestMessage(toNumber: string) {
  const payload = {
    messaging_product: "whatsapp",
    to: toNumber.replace('+', ''),
    type: "template",
    template: {
      name: "hello_world",
      language: { code: "en_US" }
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
export async function sendAttendanceAlert(
  toNumber: string,
  studentName: string,
  rollNumber: string,
  attendance: number
) {
  const payload = {
    messaging_product: "whatsapp",
    to: toNumber.replace('+', ''),
    type: "template",
    template: {
      name: "attendance_alert",
      language: { code: "en" },
      components: [{
        type: "body",
        parameters: [
          { type: "text", text: studentName },
          { type: "text", text: rollNumber },
          { type: "text", text: String(attendance) }
        ]
      }]
    }
  };

  try {
    const res = await axios.post(BASE_URL, payload, { headers });
    console.log(`✅ Alert sent to ${toNumber} for ${studentName}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    console.error(`❌ Failed:`, error.response?.data);
    return { success: false, error: error.response?.data };
  }
}

// ─── Bulk send to multiple parents ────────────────────────────────────────────
export async function sendBulkAttendanceAlerts(students: {
  parentPhone: string;
  studentName: string;
  rollNumber: string;
  attendance: number;
}[]) {
  const results = [];

  for (const student of students) {
    await new Promise(resolve => setTimeout(resolve, 500)); // rate limit protection
    const result = await sendAttendanceAlert(
      student.parentPhone,
      student.studentName,
      student.rollNumber,
      student.attendance
    );
    results.push({ student: student.studentName, ...result });
  }

  console.log(`📊 Bulk: ${results.filter(r => r.success).length}/${students.length} sent`);
  return results;
}