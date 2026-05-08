const axios = require('axios');
require('dotenv').config();

const BASE_URL = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const headers = {
  'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

/**
 * Send a simple text message via WhatsApp
 * (This works for 24 hours after a user sends a message to your business)
 */
async function sendWhatsAppText(toNumber, textBody) {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toNumber.replace('+', ''),
    type: "text",
    text: {
      preview_url: false,
      body: textBody
    }
  };

  try {
    const res = await axios.post(BASE_URL, payload, { headers });
    console.log(`✅ Text reply sent to ${toNumber}`);
    return { success: true, data: res.data };
  } catch (error) {
    console.error(`❌ Failed to send text to ${toNumber}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data };
  }
}

module.exports = { sendWhatsAppText };
