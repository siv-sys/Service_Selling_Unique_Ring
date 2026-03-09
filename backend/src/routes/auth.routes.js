const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

async function tableExists(tableName) {
  const rows = await query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?
      LIMIT 1
    `,
    [tableName]
  );

  return rows.length > 0;
}

router.post('/logout', async (req, res) => {
  try {
    const sessionToken = req.header('x-session-token');
    const userId = Number(req.header('x-auth-user-id'));

    if (await tableExists('user_sessions')) {
      if (sessionToken) {
        await query(
          `
            UPDATE user_sessions
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE session_token = ? AND revoked_at IS NULL
          `,
          [sessionToken]
        );
      } else if (Number.isFinite(userId) && userId > 0) {
        await query(
          `
            UPDATE user_sessions
            SET revoked_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND revoked_at IS NULL
          `,
          [userId]
        );
      }
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
