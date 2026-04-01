const mysql = require('mysql2/promise');
const env = require('./src/config/env');

async function checkInvitationStatus() {
  try {
    const connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
    });

    console.log('\n🔍 Checking Invitation Status\n');
    console.log('='.repeat(70));

    // Check users exist
    console.log('\n📋 Step 1: Verifying Users...');
    const [users] = await connection.execute(
      'SELECT id, email, full_name, account_status FROM users WHERE email IN (?, ?) ORDER BY id',
      ['siv@gmail.com', 'reach@gmail.com']
    );

    if (users.length === 0) {
      console.log('❌ ERROR: Users not found in database!');
      await connection.end();
      return;
    }

    users.forEach(user => {
      console.log(`✅ User ID ${user.id}: ${user.email} (${user.full_name}) - ${user.account_status}`);
    });

    const sivUser = users.find(u => u.email === 'siv@gmail.com');
    const reachUser = users.find(u => u.email === 'reach@gmail.com');

    if (!sivUser || !reachUser) {
      console.log('❌ ERROR: One or both users missing!');
      await connection.end();
      return;
    }

    // Check invitations
    console.log('\n📨 Step 2: Checking Invitations...');
    const [invitations] = await connection.execute(`
      SELECT 
        pi.id,
        pi.status,
        pi.invitee_handle,
        pi.inviter_user_id,
        pi.invitee_user_id,
        pi.invitation_token,
        pi.expires_at,
        pi.created_at,
        pi.responded_at,
        CASE 
          WHEN pi.status = 'PENDING' THEN '⏳ Waiting for response'
          WHEN pi.status = 'ACCEPTED' THEN '✅ Accepted'
          WHEN pi.status = 'DECLINED' THEN '❌ Declined'
          WHEN pi.status = 'EXPIRED' THEN '⌛ Expired'
          ELSE '❓ Unknown'
        END AS status_text
      FROM pair_invitations pi
      WHERE (pi.inviter_user_id = ? AND pi.invitee_user_id = ?)
         OR (pi.inviter_user_id = ? AND pi.invitee_user_id = ?)
      ORDER BY pi.created_at DESC
    `, [sivUser.id, reachUser.id, reachUser.id, sivUser.id]);

    if (invitations.length === 0) {
      console.log('⚠️  No invitations found between these users.');
      console.log('\n💡 Possible reasons:');
      console.log('   1. Invitation was never sent');
      console.log('   2. Backend server was not running when you tried to send');
      console.log('   3. API route "/pair-invitations/send" is not registered');
    } else {
      console.log(`\n📊 Found ${invitations.length} invitation(s):\n`);
      
      invitations.forEach((inv, index) => {
        const isFromSiv = inv.inviter_user_id === sivUser.id;
        const direction = isFromSiv ? 'siv → reach' : 'reach → siv';
        
        console.log(`${index + 1}. Invitation #${inv.id} [${direction}]`);
        console.log(`   ${inv.status_text}`);
        console.log(`   Status: ${inv.status}`);
        console.log(`   Created: ${new Date(inv.created_at).toLocaleString()}`);
        
        if (inv.expires_at) {
          const expiresAt = new Date(inv.expires_at);
          const now = new Date();
          const isExpired = expiresAt < now;
          console.log(`   Expires: ${expiresAt.toLocaleString()} ${isExpired ? '(EXPIRED)' : ''}`);
        }
        
        if (inv.responded_at) {
          console.log(`   Responded: ${new Date(inv.responded_at).toLocaleString()}`);
        }
        
        console.log('');
      });
    }

    // Check notifications
    console.log('🔔 Step 3: Checking Notifications...');
    const [notifications] = await connection.execute(`
      SELECT 
        n.id,
        n.user_id,
        u.email AS recipient_email,
        n.type,
        n.action_key,
        n.title,
        n.message,
        n.unread,
        n.metadata,
        n.created_at
      FROM notifications n
      JOIN users u ON u.id = n.user_id
      WHERE n.type LIKE '%pair_invitation%'
        AND (n.user_id = ? OR n.user_id = ?)
      ORDER BY n.created_at DESC
    `, [sivUser.id, reachUser.id]);

    if (notifications.length === 0) {
      console.log('⚠️  No pair invitation notifications found.');
      console.log('\n💡 This means:');
      console.log('   - Either invitation was never created');
      console.log('   - Or notification creation failed');
      console.log('   - Or notifications were already deleted');
    } else {
      console.log(`\n📬 Found ${notifications.length} notification(s):\n`);
      
      notifications.forEach((notif, index) => {
        const isForReach = notif.user_id === reachUser.id;
        console.log(`${index + 1}. Notification #${notif.id}`);
        console.log(`   For: ${notif.recipient_email}`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Action Key: ${notif.action_key}`);
        console.log(`   Unread: ${notif.unread ? 'Yes 🔴' : 'No'}`);
        console.log(`   Created: ${new Date(notif.created_at).toLocaleString()}`);
        
        if (notif.metadata) {
          try {
            const meta = typeof notif.metadata === 'string' ? JSON.parse(notif.metadata) : notif.metadata;
            if (meta.invitationId) {
              console.log(`   Invitation ID: ${meta.invitationId}`);
            }
          } catch (e) {
            // Ignore metadata parse error
          }
        }
        console.log('');
      });
    }

    // Check relationship pairs
    console.log('💑 Step 4: Checking Relationship Pairs...');
    const [pairs] = await connection.execute(`
      SELECT 
        rp.id,
        rp.pair_code,
        rp.status,
        rp.access_level,
        rp.established_at,
        u1.email AS partner_a_email,
        u2.email AS partner_b_email,
        pm1.member_role,
        pm2.member_role
      FROM relationship_pairs rp
      INNER JOIN pair_members pm1 ON pm1.pair_id = rp.id AND pm1.member_role = 'PARTNER_A'
      INNER JOIN pair_members pm2 ON pm2.pair_id = rp.id AND pm2.member_role = 'PARTNER_B'
      INNER JOIN users u1 ON u1.id = pm1.user_id
      INNER JOIN users u2 ON u2.id = pm2.user_id
      WHERE (pm1.user_id = ? AND pm2.user_id = ?)
         OR (pm1.user_id = ? AND pm2.user_id = ?)
    `, [sivUser.id, reachUser.id, reachUser.id, sivUser.id]);

    if (pairs.length === 0) {
      console.log('⚠️  No relationship pair found yet.');
      console.log('\n💡 This is normal if:');
      console.log('   - Invitation is still pending (not accepted yet)');
      console.log('   - Invitation was declined');
      console.log('   - Accept action failed');
    } else {
      console.log(`\n❤️ Found ${pairs.length} relationship pair(s):\n`);
      
      pairs.forEach((pair, index) => {
        console.log(`${index + 1}. Pair #${pair.id}`);
        console.log(`   Code: ${pair.pair_code}`);
        console.log(`   Status: ${pair.status}`);
        console.log(`   Access Level: ${pair.access_level}`);
        console.log(`   Established: ${pair.established_at ? new Date(pair.established_at).toLocaleString() : 'Not set'}`);
        console.log(`   Partners: ${pair.partner_a_email} & ${pair.partner_b_email}`);
        console.log('');
      });
    }

    // Check backend routes
    console.log('\n🔧 Step 5: Checking Backend Routes...');
    const fs = require('fs');
    const path = require('path');
    
    const appJsPath = path.join(__dirname, 'src', 'app.js');
    if (fs.existsSync(appJsPath)) {
      const appContent = fs.readFileSync(appJsPath, 'utf8');
      const hasPairInvitationsRoute = appContent.includes('/pair-invitations');
      const importsPairInvitations = appContent.includes('pair-invitations.routes');
      
      if (hasPairInvitationsRoute && importsPairInvitations) {
        console.log('✅ Pair invitations route is registered in app.js');
      } else {
        console.log('❌ Pair invitations route NOT registered in app.js!');
        console.log('   You need to add:');
        console.log('   const pairInvitationsRoutes = require(\'./routes/pair-invitations.routes\');');
        console.log('   app.use(\'/api/pair-invitations\', requireAuth, pairInvitationsRoutes);');
      }
    } else {
      console.log('⚠️  Could not find app.js');
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY:\n');
    
    if (invitations.length === 0) {
      console.log('❌ INVITATION FAILED - No invitation exists in database');
      console.log('\nMost likely causes:');
      console.log('1. Backend server was not running when you clicked [Invite]');
      console.log('2. API route not registered properly');
      console.log('3. Network error prevented request from reaching server');
      console.log('\nNext steps:');
      console.log('1. Make sure backend is running on port 4001');
      console.log('2. Check browser console for errors');
      console.log('3. Try sending invitation again through UI');
    } else {
      const latestInvite = invitations[0];
      if (latestInvite.status === 'PENDING') {
        console.log('✅ Invitation SENT successfully!');
        console.log('⏳ Status: PENDING (waiting for reach@gmail.com to accept)');
        console.log('\nNext steps:');
        console.log('1. Logout from siv@gmail.com');
        console.log('2. Login as reach@gmail.com');
        console.log('3. Check notifications');
        console.log('4. Click [Accept Connection]');
      } else if (latestInvite.status === 'ACCEPTED') {
        console.log('✅ Invitation ACCEPTED!');
        console.log('❤️ Relationship pair should be created');
        if (pairs.length > 0) {
          console.log('✅ Confirmed: Relationship exists');
        } else {
          console.log('⚠️ Warning: Invitation accepted but no relationship pair found');
        }
      } else if (latestInvite.status === 'DECLINED') {
        console.log('❌ Invitation DECLINED by reach@gmail.com');
      }
    }
    
    console.log('\n' + '='.repeat(70) + '\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
    process.exit(1);
  }
}

checkInvitationStatus();
