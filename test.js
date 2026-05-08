import { sendTestMessage } from './services/whatsapp.js';

// Using the recipient number from your request
const recipient = '+917877076804';

console.log(`🚀 Sending test message to ${recipient}...`);

sendTestMessage(recipient)
  .then(res => console.log('✅ Sent successfully!', JSON.stringify(res, null, 2)))
  .catch(err => {
    console.error('❌ Failed to send message:');
    if (err.response) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  });
