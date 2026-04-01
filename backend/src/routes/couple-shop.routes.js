const express = require('express');
const {
  getShopRings,
  getFilterOptions,
  getShopRingById,
} = require('../controllers/coupleShopController');

const router = express.Router();

router.get('/filters', getFilterOptions);
router.get('/', getShopRings);
router.get('/:id', getShopRingById);

module.exports = router;
