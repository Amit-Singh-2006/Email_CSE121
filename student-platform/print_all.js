const Brevo = require('@getbrevo/brevo');
console.log('Brevo object keys:', Object.keys(Brevo));
if (Brevo.Brevo) {
    console.log('Brevo.Brevo keys:', Object.keys(Brevo.Brevo));
}
