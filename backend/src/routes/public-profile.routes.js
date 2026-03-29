const express = require('express');
const { loadPublicProfileByHandle } = require('../services/profile.service');

const router = express.Router();

router.get('/:handle', async (req, res, next) => {
  try {
    const data = await loadPublicProfileByHandle(req.params.handle);
    if (!data) {
      return res.status(404).json({ message: 'Public profile not found.' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
