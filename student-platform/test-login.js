const axios = require('axios');

async function test() {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
        email: 'amit.panwar2k6@gmail.com',
        password: 'hashed_password_here'
    });
    console.log('✅ Logged in!');
    console.log('\n🔑 YOUR TOKEN:');
    console.log(res.data.token);
}

test().catch(err => console.error('❌', err.response?.data || err.message));