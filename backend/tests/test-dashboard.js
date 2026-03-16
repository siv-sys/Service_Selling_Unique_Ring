// Test dashboard API endpoint
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/dashboard',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Dashboard API Response:');
      console.log('Total Users:', response.stats?.totalUsers);
      console.log('Total Rings Sold:', response.stats?.totalRingsSold);
      console.log('Active Relationships:', response.stats?.activeRelationships);
      console.log('System Users:', response.systemUsers?.length || 0);
      console.log('Ring Sales:', response.ringSales?.length || 0);
      console.log('Pairing Requests:', response.pairingRequests?.length || 0);
    } catch (e) {
      console.log('Raw Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
