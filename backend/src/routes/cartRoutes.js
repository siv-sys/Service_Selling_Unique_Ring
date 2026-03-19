const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Simple in-memory cart store
const carts = {};

// Helper to get session ID
const getSessionId = (req) => {
  let sessionId = req.headers['x-session-id'];
  if (!sessionId) {
    sessionId = `session_${Date.now()}`;
    console.log('Generated new session ID:', sessionId);
  }
  return sessionId;
};

// GET /api/cart - Get cart items with ring details
router.get('/', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    console.log('📦 GET cart for session:', sessionId);
    
    const cart = carts[sessionId] || [];
    console.log(`Cart has ${cart.length} items`);
    
    if (cart.length === 0) {
      console.log('Cart is empty');
      return res.json({ 
        success: true, 
        data: [] 
      });
    }
    
    // Fetch ring details for each item in cart
    const cartWithDetails = await Promise.all(cart.map(async (item) => {
      try {
        console.log('Fetching details for ring ID:', item.ringId);
        const [rows] = await pool.execute(
          'SELECT id, ring_name, ring_identifier, price, image_url, material FROM rings WHERE id = ?',
          [item.ringId]
        );
        
        if (rows.length > 0) {
          const ring = rows[0];
          return {
            ...item,
            ring_name: ring.ring_name,
            ring_identifier: ring.ring_identifier,
            price: parseFloat(ring.price),
            image_url: ring.image_url,
            material: ring.material || item.material
          };
        }
        return item;
      } catch (err) {
        console.error('Error fetching ring details:', err);
        return item;
      }
    }));
    
    console.log('Sending cart with details:', cartWithDetails.length, 'items');
    res.json({ 
      success: true, 
      data: cartWithDetails 
    });
  } catch (error) {
    console.error('❌ Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/cart/add - Add item to cart
router.post('/add', async (req, res) => {
  try {
    const { ringId, quantity = 1, size, material } = req.body;
    let sessionId = req.headers['x-session-id'];
    
    console.log('🛒 POST add to cart:', { ringId, quantity, size, material, sessionId });
    
    if (!ringId) {
      return res.status(400).json({
        success: false,
        message: 'ringId is required'
      });
    }
    
    // If no session ID provided, create one
    if (!sessionId) {
      sessionId = `session_${Date.now()}`;
      console.log('Created new session ID:', sessionId);
    }
    
    // Verify ring exists and get its details
    console.log('Verifying ring ID:', ringId);
    const [rows] = await pool.execute(
      'SELECT id, ring_name, ring_identifier, price, image_url, material FROM rings WHERE id = ?',
      [ringId]
    );
    
    if (rows.length === 0) {
      console.log('Ring not found for ID:', ringId);
      return res.status(404).json({
        success: false,
        message: 'Ring not found'
      });
    }
    
    const ring = rows[0];
    console.log('Found ring:', ring.ring_name);
    
    if (!carts[sessionId]) {
      carts[sessionId] = [];
      console.log('Created new cart for session:', sessionId);
    }
    
    // Check if item exists
    const existingItemIndex = carts[sessionId].findIndex(item => item.ringId === ringId);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      carts[sessionId][existingItemIndex].quantity += quantity;
      console.log('Updated existing item:', carts[sessionId][existingItemIndex]);
    } else {
      // Add new item with ring details
      const newItem = {
        id: Date.now(),
        ringId,
        quantity,
        size: size || '7',
        material: material || ring.material,
        ring_name: ring.ring_name,
        ring_identifier: ring.ring_identifier,
        price: parseFloat(ring.price),
        image_url: ring.image_url,
        addedAt: new Date().toISOString()
      };
      carts[sessionId].push(newItem);
      console.log('Added new item:', newItem);
    }
    
    console.log('Current cart for session has', carts[sessionId].length, 'items');
    
    // Return the session ID in the response so frontend can save it
    res.json({ 
      success: true, 
      message: 'Item added to cart',
      sessionId: sessionId,
      data: carts[sessionId]
    });
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/cart/:id - Update quantity
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const sessionId = getSessionId(req);
    
    console.log('PUT update item:', { id, quantity, sessionId });
    
    const cart = carts[sessionId] || [];
    const itemIndex = cart.findIndex(item => item.id == id);
    
    if (itemIndex >= 0) {
      cart[itemIndex].quantity = quantity;
      console.log('Updated item:', cart[itemIndex]);
      res.json({ 
        success: true, 
        message: 'Cart updated',
        data: cart
      });
    } else {
      console.log('Item not found:', id);
      res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/cart/:id - Remove item
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const sessionId = getSessionId(req);
    
    console.log('DELETE remove item:', { id, sessionId });
    
    if (carts[sessionId]) {
      const beforeCount = carts[sessionId].length;
      carts[sessionId] = carts[sessionId].filter(item => item.id != id);
      console.log(`Removed item. Before: ${beforeCount}, After: ${carts[sessionId].length}`);
    }
    
    res.json({ 
      success: true, 
      message: 'Item removed',
      data: carts[sessionId] || []
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/cart - Clear cart
router.delete('/', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    
    console.log('DELETE clear cart for session:', sessionId);
    
    carts[sessionId] = [];
    
    res.json({ 
      success: true, 
      message: 'Cart cleared',
      data: []
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
