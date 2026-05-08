const { BrevoClient } = require('@getbrevo/brevo');
const client = new BrevoClient({ apiKey: 'test' });
console.log('transactionalEmails methods:', Object.keys(client.transactionalEmails));
