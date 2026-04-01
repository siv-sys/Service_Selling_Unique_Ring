const { pool } = require('../../config/database');

// Create new couple profile
const createCouple = async (req, res) => {
  try {
    const { coupleData, ringData } = req.body;
    const userId = req.userId;
    
    const coupleIdentifier = `CPL-${Date.now()}`;
    
    const [coupleResult] = await pool.execute(
      `INSERT INTO relationship_pairs 
       (couple_identifier, partner1_name, partner2_name, email, phone, anniversary_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NOW())`,
      [
        coupleIdentifier,
        coupleData.partner1Name || 'Partner 1',
        coupleData.partner2Name || 'Partner 2',
        coupleData.email || '',
        coupleData.phone || '',
        coupleData.anniversary || new Date().toISOString().split('T')[0]
      ]
    );

    const coupleId = coupleResult.insertId;

    res.status(201).json({
      success: true,
      message: 'Couple profile created successfully',
      data: { coupleId, coupleIdentifier }
    });

  } catch (error) {
    console.error('Error creating couple:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

// Get couple profile by user ID
const getCoupleByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(
      `SELECT cp.*, u.emergency_contact_name, u.emergency_contact_phone
       FROM relationship_pairs cp
       LEFT JOIN pair_members pm ON cp.id = pm.couple_id
       LEFT JOIN users u ON pm.user_id = u.id
       WHERE pm.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Couple profile not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Error fetching couple:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

// Update emergency contact
const updateEmergencyContact = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.userId;

    await pool.execute(
      `UPDATE users 
       SET emergency_contact_name = ?, emergency_contact_phone = ?
       WHERE id = ?`,
      [name, phone, userId]
    );

    res.json({
      success: true,
      message: 'Emergency contact updated successfully'
    });

  } catch (error) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
};

module.exports = {
  createCouple,
  getCoupleByUserId,
  updateEmergencyContact
};