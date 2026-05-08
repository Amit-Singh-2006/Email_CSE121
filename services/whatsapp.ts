import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

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
      language: { code: "en_US" }
    }
  };

  const res = await axios.post(BASE_URL, payload, { headers });
  return res.data;
}

// Send attendance alert (after template approved)
async function sendAttendanceAlert(toNumber, studentName, attendance) {
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
          { type: "text", text: String(attendance) }
        ]
      }]
    }
  };

  const res = await axios.post(BASE_URL, payload, { headers });
  return res.data;
}

export { sendTestMessage, sendAttendanceAlert };
