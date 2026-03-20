const express = require('express');
const router = express.Router();

// Basic auth routes
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes working' });
});

module.exports = router;