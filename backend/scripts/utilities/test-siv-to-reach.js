// Test invitation from siv@gmail.com to reach@gmail.com
const http = require('http');

const API_BASE = 'http://localhost:4001/api';

async function testInvitation() {
  console.log('\n🎯 Testing Invitation Flow');
  console.log('='.repeat(60));
  console.log('From: siv@gmail.com (ID: 1)');
  console.log('To:   reach@gmail.com (ID: 3)');
  console.log('='.repeat(60));

  // Step 1: Send invitation as siv@gmail.com
  console.log('\n📤 Step 1: Sending invitation...');
  
  const sendOptions = {
    hostname: 'localhost',
    port: 4001,
    path: '/pair-invitations/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-user-id': '1' // siv@gmail.com
    }
  };

  const sendReq = http.request(sendOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (result.success) {
          console.log('✅ Invitation sent successfully!');
          console.log(`   Message: ${result.message}`);
          console.log(`   Invitation ID: ${result.invitationId}`);
          
          // Step 2: Check notifications for reach@gmail.com
          checkNotifications();
        } else {
          console.log('❌ Failed to send invitation:', result.message);
        }
      } catch (e) {
        console.error('❌ Error parsing response:', e.message);
      }
    });
  });

  sendReq.on('error', (e) => {
    console.error('❌ Request error:', e.message);
  });

  sendReq.write(JSON.stringify({
    inviteeEmail: 'reach@gmail.com'
  }));
  sendReq.end();

  // Step 2: Check notifications
  function checkNotifications() {
    console.log('\n🔔 Step 2: Checking notifications for reach@gmail.com...');
    
    const notifOptions = {
      hostname: 'localhost',
      port: 4001,
      path: '/notifications/me',
      method: 'GET',
      headers: {
        'x-auth-user-id': '3' // reach@gmail.com
      }
    };

    const notifReq = http.request(notifOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const notifications = JSON.parse(data);
          
          console.log(`✅ Found ${notifications.length} notification(s)`);
          
          const pairInviteNotif = notifications.find(n => n.actionKey === 'pair_invitation_accept_reject');
          
          if (pairInviteNotif) {
            console.log('\n💑 Pair Invitation Notification Found!');
            console.log('─'.repeat(60));
            console.log(`Title: ${pairInviteNotif.title}`);
            console.log(`Message: ${pairInviteNotif.message}`);
            console.log(`Unread: ${pairInviteNotif.unread ? 'Yes 🔴' : 'No'}`);
            console.log(`Created: ${new Date(pairInviteNotif.createdAt).toLocaleString()}`);
            console.log(`Action Key: ${pairInviteNotif.actionKey}`);
            console.log('─'.repeat(60));
            
            console.log('\n✨ SUCCESS! reach@gmail.com can now:');
            console.log('   1. See the notification with red badge');
            console.log('   2. Click on it to see details');
            console.log('   3. Click [Accept Connection] or [Decline]');
            
            // Step 3: Show accept endpoint
            console.log('\n📋 To accept the invitation, reach@gmail.com would call:');
            console.log(`   POST ${API_BASE}/pair-invitations/${pairInviteNotif.metadata?.invitationId}/accept`);
            
          } else {
            console.log('⚠️  No pair invitation notification found');
            console.log('Notifications:', notifications.map(n => n.title).join(', '));
          }
        } catch (e) {
          console.error('❌ Error parsing notifications:', e.message);
        }
      });
    });

    notifReq.on('error', (e) => {
      console.error('❌ Request error:', e.message);
    });

    notifReq.end();
  }
}

testInvitation();
