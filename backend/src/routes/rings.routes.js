const express = require('express');
const router = express.Router();

// Basic rings routes
router.get('/test', (req, res) => {
    res.json({ message: 'Rings routes working' });
});

module.exports = router;