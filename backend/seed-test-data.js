const http = require('http');

async function seedTestData() {
  const promises = [];
  
  for (let i = 1; i <= 25; i++) {
    const data = JSON.stringify({
      modelName: `Test Ring ${i}`,
      material: 'Gold',
      color: 'Gold',
      basePrice: 1000 + (i * 10),
      stockCount: Math.floor(Math.random() * 45) + 5,
      defaultSize: 'Size 7'
    });

    const promise = new Promise((resolve, reject) => {
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
        res.on('end', () => resolve(body));
      });
      
      req.on('error', reject);
      req.write(data);
      req.end();
    });
    
    promises.push(promise);
  }

  await Promise.all(promises);
  console.log('Added 25 test rings to inventory');
}

seedTestData().catch(console.error);
