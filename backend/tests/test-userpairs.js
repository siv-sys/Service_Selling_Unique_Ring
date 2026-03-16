const http = require('http');

const API_BASE = 'localhost';
const API_PORT = 4000;

function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      port: API_PORT,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('Testing UserPairs API...\n');

  // Test 1: Get my pairs (should work even without auth for now)
  console.log('1. GET /api/user-pairs/my-pairs');
  const pairs = await makeRequest('/user-pairs/my-pairs?userId=1');
  console.log('   Status:', pairs.status);
  console.log('   Data:', JSON.stringify(pairs.data, null, 2).substring(0, 200));

  // Test 2: Create a pair
  console.log('\n2. POST /api/user-pairs (Create pair)');
  const create = await makeRequest('/user-pairs', 'POST', {
    userId: 1,
    pairCode: 'TESTPAIR001'
  });
  console.log('   Status:', create.status);
  console.log('   Data:', JSON.stringify(create.data, null, 2));

  // Test 3: Get my pairs again
  console.log('\n3. GET /api/user-pairs/my-pairs (after create)');
  const pairs2 = await makeRequest('/user-pairs/my-pairs?userId=1');
  console.log('   Status:', pairs2.status);
  console.log('   Pairs count:', pairs2.data.pairs?.length || 0);

  console.log('\nTests completed!');
}

test().catch(console.error);
