const http = require('http');

const data = JSON.stringify({
  modelName: "Test Product",
  material: "Silver",
  color: "Silver",
  basePrice: 500,
  stockCount: 10,
  defaultSize: "Size 8"
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/admin/migrations/seed-catalog',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
    try {
      const json = JSON.parse(body);
      console.log('Parsed:', json);
    } catch (e) {
      console.log('Not valid JSON');
    }
  });
});

req.on('error', (err) => console.error('Error:', err.message));
req.write(data);
req.end();
