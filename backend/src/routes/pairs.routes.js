const express = require('express');
const router = express.Router();

// Basic pairs routes
router.get('/test', (req, res) => {
    res.json({ message: 'Pairs routes working' });
});

module.exports = router;