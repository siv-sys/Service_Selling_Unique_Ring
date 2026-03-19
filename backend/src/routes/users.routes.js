const express = require('express');
const { query } = require('../config/db');

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: 'Valid user id is required.' });
    }

    if (req.auth?.user?.role !== 'admin' && req.auth?.user?.id !== userId) {
      return res.status(403).json({ message: 'You can only view your own profile summary.' });
    }

    const rows = await query(
      `
        SELECT
          id,
          COALESCE(NULLIF(full_name, ''), NULLIF(name, ''), NULLIF(username, ''), SUBSTRING_INDEX(email, '@', 1)) AS full_name,
          avatar_url
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [userId],
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      fullName: rows[0].full_name || 'Member',
      avatarUrl: rows[0].avatar_url || null,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
