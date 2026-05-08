const Brevo = require('@getbrevo/brevo');
const b = Brevo.Brevo || Brevo;
console.log('TransactionalEmailsApi' in b);
console.log('TransactionalEmailsApi keys:', Object.keys(b).filter(k => k === 'TransactionalEmailsApi'));
