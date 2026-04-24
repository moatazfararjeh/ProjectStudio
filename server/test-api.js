const axios = require('axios');

async function testAPI() {
  try {
    console.log('\n🧪 Testing API Endpoints...\n');
    
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const health = await axios.get('http://localhost:5000/health');
    console.log('✅ Health:', health.data);
    
    // Test 2: Login
    console.log('\n2. Testing Login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@epm.com',
      password: 'admin123'
    });
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    
    // Test 3: Get Projects
    console.log('\n3. Testing Get Projects...');
    const projectsResponse = await axios.get('http://localhost:5000/api/projects', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Projects Response:', JSON.stringify(projectsResponse.data, null, 2));
    console.log(`\n📊 Total Projects: ${projectsResponse.data.data.projects.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAPI();
