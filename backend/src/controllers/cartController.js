const { pool } = require('../../config/database');

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.userId || 1; // Default to user 1 for testing
    
    const [cartItems] = await pool.execute(
      `SELECT c.*, r.ring_name, r.ring_identifier, r.image_url, r.material, r.price 
       FROM cart c
       JOIN rings r ON c.ring_id = r.id
       WHERE c.user_id = ? OR c.session_id = ?`,
      [userId, req.sessionID || 'guest']
    );
    
    res.json({
      success: true,
      data: cartItems
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { ringId, quantity = 1, size, material } = req.body;
    const userId = req.userId || null;
    const sessionId = req.sessionID || `session_${Date.now()}`;
    
    // Check if item already exists in cart
    const [existing] = await pool.execute(
      'SELECT * FROM cart WHERE (user_id = ? OR session_id = ?) AND ring_id = ?',
      [userId, sessionId, ringId]
    );
    
    if (existing.length > 0) {
      // Update quantity
      await pool.execute(
        'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
        [quantity, existing[0].id]
      );
    } else {
      // Insert new item
      await pool.execute(
        `INSERT INTO cart (user_id, session_id, ring_id, quantity, size, material, added_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [userId, sessionId, ringId, quantity, size, material]
      );
    }
    
    // Get updated cart
    const [updatedCart] = await pool.execute(
      `SELECT c.*, r.ring_name, r.ring_identifier, r.image_url, r.material, r.price 
       FROM cart c
       JOIN rings r ON c.ring_id = r.id
       WHERE c.user_id = ? OR c.session_id = ?`,
      [userId, sessionId]
    );
    
    res.json({
      success: true,
      message: 'Item added to cart',
      data: updatedCart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity <= 0) {
      // Remove item if quantity is 0
      await pool.execute('DELETE FROM cart WHERE id = ?', [id]);
    } else {
      await pool.execute(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [quantity, id]
      );
    }
    
    res.json({
      success: true,
      message: 'Cart updated'
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM cart WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.userId || null;
    const sessionId = req.sessionID || 'guest';
    
    await pool.execute(
      'DELETE FROM cart WHERE user_id = ? OR session_id = ?',
      [userId, sessionId]
    );
    
    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};