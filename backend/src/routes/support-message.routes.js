const express = require('express');
const { createSupportMessageNotifications } = require('../services/notifications.service');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const result = await createSupportMessageNotifications({
      sender: req.auth?.user,
      ...req.body,
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
