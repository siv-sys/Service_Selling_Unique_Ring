const express = require('express');
const router = express.Router();
const ringController = require('../controllers/ringController');

// Public routes
router.get('/filter-options', ringController.getFilterOptions);
router.get('/shop', ringController.getShopRings);
router.get('/identifier/:identifier', ringController.getRingByIdentifier);

// Main CRUD routes
router.get('/', ringController.getAllRings);
router.get('/:id', ringController.getRingById);
router.post('/', ringController.createRing);
router.put('/:id', ringController.updateRing);
router.delete('/:id', ringController.deleteRing);

module.exports = router;