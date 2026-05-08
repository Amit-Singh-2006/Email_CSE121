const Brevo = require('@getbrevo/brevo');
const b = Brevo.Brevo || Brevo;
const keys = Object.keys(b);
console.log('Searching for TransactionalEmailsApi in keys...');
console.log(keys.filter(k => k.toLowerCase().includes('transactional')));
