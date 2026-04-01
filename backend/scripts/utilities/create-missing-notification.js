const mysql = require('mysql2/promise');
const env = require('./src/config/env');

async function createMissingNotification() {
  try {
    const connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
    });

    console.log('\n🔧 Creating Missing Notification...\n');

    // Get invitation details
    const [invitations] = await connection.execute(`
      SELECT id, inviter_user_id, invitee_user_id, invitee_handle
      FROM pair_invitations
      WHERE inviter_user_id = 1 AND invitee_user_id = 3 AND status = 'PENDING'
      LIMIT 1
    `);

    if (invitations.length === 0) {
      console.log('❌ No pending invitation found from siv@gmail.com to reach@gmail.com');
      await connection.end();
      return;
    }

    const invitation = invitations[0];
    console.log(`✅ Found invitation #${invitation.id}`);
    console.log(`   From: siv@gmail.com (ID: ${invitation.inviter_user_id})`);
    console.log(`   To: reach@gmail.com (ID: ${invitation.invitee_user_id})`);

    // Check if notification already exists
    const [existingNotifs] = await connection.execute(`
      SELECT id 
      FROM notifications 
      WHERE user_id = ? 
        AND type = 'pair_invitation'
        AND JSON_EXTRACT(metadata, '$.invitationId') = ?
    `, [invitation.invitee_user_id, invitation.id]);

    if (existingNotifs.length > 0) {
      console.log(`\n⚠️  Notification already exists (ID: ${existingNotifs[0].id})`);
      console.log('   Skipping creation...');
      await connection.end();
      return;
    }

    // Create the notification
    const metadata = {
      invitationId: invitation.id,
      inviterUserId: invitation.inviter_user_id,
      inviterEmail: 'siv@gmail.com'
    };

    await connection.execute(`
      INSERT INTO notifications (
        user_id,
        type,
        icon,
        icon_class,
        action_key,
        title,
        message,
        unread,
        metadata,
        created_at
      ) VALUES (
        ?,
        'pair_invitation',
        '\\u{1F491}',
        'pair',
        'pair_invitation_accept_reject',
        'New Connection Request',
        'You have received a connection request from siv@gmail.com. Accept to start your journey together!',
        1,
        ?,
        NOW()
      )
    `, [invitation.invitee_user_id, JSON.stringify(metadata)]);

    console.log('\n✅ Notification created successfully!');
    console.log('\n📋 Notification Details:');
    console.log('─'.repeat(60));
    console.log(`For User: reach@gmail.com (ID: ${invitation.invitee_user_id})`);
    console.log(`Type: pair_invitation`);
    console.log(`Action Key: pair_invitation_accept_reject`);
    console.log(`Title: New Connection Request`);
    console.log(`Message: You have received a connection request...`);
    console.log(`Unread: Yes 🔴`);
    console.log(`Metadata: ${JSON.stringify(metadata, null, 2)}`);
    console.log('─'.repeat(60));

    console.log('\n✨ SUCCESS! Now reach@gmail.com can:');
    console.log('   1. See red notification badge 🔴');
    console.log('   2. Click bell icon to see notification');
    console.log('   3. See [Accept Connection] and [Decline] buttons');
    console.log('   4. Accept to create relationship pair!');

    console.log('\n🎯 Next Steps:');
    console.log('   1. Logout from siv@gmail.com');
    console.log('   2. Login as reach@gmail.com');
    console.log('   3. Check notifications (top-right bell icon)');
    console.log('   4. Click [Accept Connection]');
    console.log('');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createMissingNotification();
