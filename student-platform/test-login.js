const axios = require('axios');

async function test() {
    const res = await axios.post('https://web-production-7d77.up.railway.app/api/auth/login', {
        email: 'admin7291@lpu.com',
        password: 'Admin@123'
    });
    console.log('🔑 TOKEN:', res.data.token);
}

test().catch(err => console.error('❌', err.response?.data || err.message));