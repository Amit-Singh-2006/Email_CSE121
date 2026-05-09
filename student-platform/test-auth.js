const axios = require('axios');

async function test() {
    const reg = await axios.post('http://localhost:3000/api/auth/register', {
        name: 'Amit Admin',
        email: 'superadmin@lpu.com',
        password: 'Admin@123',
        role: 'INSTITUTION_ADMIN',
        tenantId: 'cmoy07h1h0000ksrjph6lv8iz'
    });
    console.log('✅ Registered!');
    console.log('🔑 TOKEN:', reg.data.token);
}

test().catch(err => console.error('❌', err.response?.data || err.message));