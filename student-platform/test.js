const { sendTestMessage } = require('./services/whatsapp');

const recipient = '+917877076804';
console.log(`🚀 Sending test message to ${recipient} from student-platform...`);

sendTestMessage(recipient)
  .then(res => console.log('✅ Sent!', JSON.stringify(res, null, 2)))
  .catch(err => console.error('❌ Failed:', err.response?.data || err.message));
