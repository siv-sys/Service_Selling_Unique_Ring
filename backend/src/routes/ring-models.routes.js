const express = require('express');
const router = express.Router();

// Basic ring-models routes
router.get('/test', (req, res) => {
    res.json({ message: 'Ring models routes working' });
});

module.exports = router;