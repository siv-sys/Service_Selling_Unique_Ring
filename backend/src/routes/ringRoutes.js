const express = require('express');
const router = express.Router();
const ringController = require('../controllers/ringController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes (no authentication needed)
router.get('/filter-options', ringController.getFilterOptions);
router.get('/shop', ringController.getShopRings);
router.get('/identifier/:identifier', ringController.getRingByIdentifier);
router.get('/', ringController.getAllRings);
router.get('/:id', ringController.getRingById);

// Protected routes (require authentication)
router.post('/', authenticate, isAdmin, ringController.createRing);
router.put('/:id', authenticate, isAdmin, ringController.updateRing);
router.delete('/:id', authenticate, isAdmin, ringController.deleteRing);
router.get('/:id/test-connection', authenticate, ringController.testRingConnection);
router.post('/:id/unpair', authenticate, ringController.unpairRing);

module.exports = router;

