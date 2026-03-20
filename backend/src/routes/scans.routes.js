const express = require('express');
const router = express.Router();

// Basic scans routes
router.get('/test', (req, res) => {
    res.json({ message: 'Scans routes working' });
});

module.exports = router;