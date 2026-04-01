const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

function normalizeIdHeader(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getCartOwner(req) {
  const userId = normalizeIdHeader(req.headers['x-auth-user-id']);
  const sessionIdHeader = String(req.headers['x-session-id'] || '').trim();

  if (userId) {
    return {
      userId,
      sessionId: sessionIdHeader || null,
      ownerWhere: 'user_id = ?',
      ownerParams: [userId],
      sessionIdForClient: String(userId),
    };
  }

  let sessionId = sessionIdHeader;
  if (!sessionId) {
    sessionId = `session_${Date.now()}`;
    console.log('Generated new cart session ID:', sessionId);
  }

  return {
    userId: null,
    sessionId,
    ownerWhere: 'session_id = ?',
    ownerParams: [sessionId],
    sessionIdForClient: sessionId,
  };
}

async function mergeGuestCartIntoUserCart(userId, sessionId) {
  if (!userId || !sessionId || sessionId === String(userId)) {
    return;
  }

  const [guestRows] = await pool.execute(
    `
      SELECT id, ring_id, quantity, size, material
      FROM cart
      WHERE session_id = ?
      ORDER BY added_at ASC, id ASC
    `,
    [sessionId],
  );

  if (guestRows.length === 0) {
    return;
  }

  for (const row of guestRows) {
    const [existingRows] = await pool.execute(
      `
        SELECT id, quantity
        FROM cart
        WHERE user_id = ?
          AND ring_id = ?
          AND COALESCE(size, '') = COALESCE(?, '')
          AND COALESCE(material, '') = COALESCE(?, '')
        LIMIT 1
      `,
      [userId, row.ring_id, row.size || null, row.material || null],
    );

    if (existingRows.length > 0) {
      await pool.execute(
        'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
        [row.quantity, existingRows[0].id],
      );
      await pool.execute('DELETE FROM cart WHERE id = ?', [row.id]);
    } else {
      await pool.execute(
        'UPDATE cart SET user_id = ?, session_id = NULL WHERE id = ?',
        [userId, row.id],
      );
    }
  }
}

async function fetchCartItemsByOwner(ownerWhere, ownerParams) {
  const [rows] = await pool.execute(
    `
      SELECT
        c.id,
        c.user_id,
        c.session_id,
        c.ring_id AS ringId,
        c.quantity,
        c.size,
        c.material,
        c.added_at AS addedAt,
        r.ring_name,
        r.ring_identifier,
        r.image_url,
        r.material AS ring_material,
        r.price
      FROM cart c
      JOIN rings r ON r.id = c.ring_id
      WHERE ${ownerWhere}
      ORDER BY c.added_at DESC, c.id DESC
    `,
    ownerParams,
  );

  return rows.map((row) => ({
    ...row,
    material: row.material || row.ring_material || null,
  }));
}

// GET /api/cart - Get cart items with ring details
router.get('/', async (req, res) => {
  try {
    const owner = getCartOwner(req);
    await mergeGuestCartIntoUserCart(owner.userId, owner.sessionId);
    const cartItems = await fetchCartItemsByOwner(owner.ownerWhere, owner.ownerParams);

    res.json({
      success: true,
      sessionId: owner.sessionIdForClient,
      data: cartItems,
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// POST /api/cart/add - Add item to cart
router.post('/add', async (req, res) => {
  try {
    const { ringId, quantity = 1, size, material } = req.body;
    const owner = getCartOwner(req);
    await mergeGuestCartIntoUserCart(owner.userId, owner.sessionId);

    if (!ringId) {
      return res.status(400).json({
        success: false,
        message: 'ringId is required',
      });
    }

    const [ringRows] = await pool.execute(
      'SELECT id, ring_name, ring_identifier, price, image_url, material FROM rings WHERE id = ?',
      [ringId],
    );

    if (ringRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ring not found',
      });
    }

    const ring = ringRows[0];

    const [existingRows] = await pool.execute(
      `
        SELECT id, quantity
        FROM cart
        WHERE ${owner.ownerWhere}
          AND ring_id = ?
          AND COALESCE(size, '') = COALESCE(?, '')
          AND COALESCE(material, '') = COALESCE(?, '')
        LIMIT 1
      `,
      [...owner.ownerParams, ringId, size || null, material || null],
    );

    if (existingRows.length > 0) {
      await pool.execute(
        'UPDATE cart SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [quantity, existingRows[0].id],
      );
    } else {
      await pool.execute(
        `
          INSERT INTO cart (user_id, session_id, ring_id, quantity, size, material, added_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        [
          owner.userId,
          owner.sessionId,
          ringId,
          quantity,
          size || '7',
          material || ring.material,
        ],
      );
    }

    const updatedCart = await fetchCartItemsByOwner(owner.ownerWhere, owner.ownerParams);

    res.json({
      success: true,
      message: 'Item added to cart',
      sessionId: owner.sessionIdForClient,
      data: updatedCart,
      ring: {
        id: ring.id,
        ring_name: ring.ring_name,
        ring_identifier: ring.ring_identifier,
        price: parseFloat(ring.price),
        image_url: ring.image_url,
        material: ring.material,
      },
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// PUT /api/cart/:id - Update quantity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const owner = getCartOwner(req);

    const [rows] = await pool.execute(
      `
        SELECT id
        FROM cart
        WHERE id = ?
          AND ${owner.ownerWhere}
        LIMIT 1
      `,
      [id, ...owner.ownerParams],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    if (quantity <= 0) {
      await pool.execute('DELETE FROM cart WHERE id = ?', [id]);
    } else {
      await pool.execute(
        'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [quantity, id],
      );
    }

    const updatedCart = await fetchCartItemsByOwner(owner.ownerWhere, owner.ownerParams);

    res.json({
      success: true,
      message: 'Cart updated',
      data: updatedCart,
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// DELETE /api/cart/:id - Remove item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const owner = getCartOwner(req);

    const [rows] = await pool.execute(
      `
        SELECT id
        FROM cart
        WHERE id = ?
          AND ${owner.ownerWhere}
        LIMIT 1
      `,
      [id, ...owner.ownerParams],
    );

    if (rows.length > 0) {
      await pool.execute('DELETE FROM cart WHERE id = ?', [id]);
    }

    const updatedCart = await fetchCartItemsByOwner(owner.ownerWhere, owner.ownerParams);

    res.json({
      success: true,
      message: 'Item removed',
      data: updatedCart,
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// DELETE /api/cart - Clear cart
router.delete('/', async (req, res) => {
  try {
    const owner = getCartOwner(req);

    await pool.execute(`DELETE FROM cart WHERE ${owner.ownerWhere}`, owner.ownerParams);

    res.json({
      success: true,
      message: 'Cart cleared',
      data: [],
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;
