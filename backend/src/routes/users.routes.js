const express = require('express');
const router = express.Router();

// Basic users routes
router.get('/test', (req, res) => {
    res.json({ message: 'Users routes working' });
});

module.exports = router;