const http = require('http');

const data = JSON.stringify({
  modelName: "Diamond Ring with Supplier",
  material: "Platinum",
  color: "Silver",
  basePrice: 3500,
  stockCount: 15,
  defaultSize: "Size 7",
  supplier: "Tiffany & Co."
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
  });
});

req.on('error', (err) => console.error('Error:', err.message));
req.write(data);
req.end();
