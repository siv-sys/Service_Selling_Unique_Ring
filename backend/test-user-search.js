// Test script to demonstrate user search functionality
const http = require('http');

const API_BASE = 'http://localhost:4001/api';

// Simulate search requests
async function testSearch(query, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 TEST: ${description}`);
    console.log(`📝 Search query: "${query}"`);
    console.log('='.repeat(60));

    const options = {
      hostname: 'localhost',
      port: 4001,
      path: `/pair-invitations/search-users?q=${encodeURIComponent(query)}`,
      method: 'GET',
      headers: {
        'x-auth-user-id': '1' // Using user ID 1 (alex_admin) as requester
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.success && result.users) {
            console.log(`✅ Found ${result.users.length} user(s):\n`);
            
            if (result.users.length === 0) {
              console.log('   No users found for this search.\n');
            } else {
              result.users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.displayName}`);
                console.log(`      Email: ${user.email}`);
                console.log(`      ID: ${user.id}`);
                console.log(`      Status: ${user.accountStatus}`);
                console.log('');
              });
            }
          } else {
            console.log('❌ Search failed:', result.message);
          }
          
          resolve(result);
        } catch (e) {
          console.error('❌ Error parsing response:', e.message);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
      reject(e);
    });

    req.end();
  });
}

// Main test runner
async function runTests() {
  console.log('\n' + '🎯 '.repeat(30));
  console.log('🚀 USER SEARCH FEATURE - LIVE DEMONSTRATION');
  console.log('🎯 '.repeat(30) + '\n');

  console.log('📋 Your Database Users:');
  console.log('   1. Alex Rivera (alex@smartring.com) - ADMIN');
  console.log('   2. Jordan Smith (jordan@smartring.com) - SELLER');
  console.log('   3. Sam Johnson (sam@smartring.com) - USER');
  console.log('   4. Casey Brown (casey@smartring.com) - USER');
  console.log('   5. Taylor Davis (taylor@smartring.com) - USER');
  console.log('   6. Morgan Wilson (morgan@smartring.com) - USER\n');

  // Test 1: Search by email domain
  await testSearch('@smartring', 'Search by email domain (@smartring)');

  // Test 2: Search by first name
  await testSearch('Alex', 'Search by first name "Alex"');

  // Test 3: Search by last name
  await testSearch('Smith', 'Search by last name "Smith"');

  // Test 4: Partial email search
  await testSearch('jordan@', 'Partial email search "jordan@"');

  // Test 5: Search with 2 characters (minimum)
  await testSearch('Sa', 'Minimum character search "Sa"');

  // Test 6: Search that should find multiple users
  await testSearch('user', 'Generic search "user" (should find usernames)');

  // Test 7: Non-existent user
  await testSearch('nonexistent', 'Non-existent user search');

  // Test 8: Single character (should return empty)
  await testSearch('A', 'Single character search (too short)');

  console.log('\n' + '✨ '.repeat(30));
  console.log('✅ All tests completed!');
  console.log('✨ '.repeat(30) + '\n');

  console.log('💡 HOW TO USE IN THE UI:');
  console.log('   1. Go to Relationship page');
  console.log('   2. Type in "Search Platform Users" box');
  console.log('   3. Results appear after 300ms');
  console.log('   4. Click [Invite] button next to any user');
  console.log('   5. Or click on user row to auto-fill email\n');
}

// Run the tests
runTests().catch(console.error);
