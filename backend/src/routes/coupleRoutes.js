const express = require('express');
const router = express.Router();
const coupleController = require('../controllers/coupleController');
const { authenticate } = require('../middleware/auth');

// Protected routes (require authentication)
router.post('/', authenticate, coupleController.createCouple);
router.get('/user/:userId', authenticate, coupleController.getCoupleByUserId);
router.put('/:id/emergency-contact', authenticate, coupleController.updateEmergencyContact);

module.exports = router;
