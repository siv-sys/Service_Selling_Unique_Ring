const express = require('express');
const { loadProfile, saveProfile } = require('../services/profile.service');

const router = express.Router();

router.get('/me/current', async (req, res, next) => {
  try {
    const userId = Number(req.auth?.user?.id);
    const data = await loadProfile(userId);
    if (!data) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.patch('/me/current', async (req, res, next) => {
  try {
    const userId = Number(req.auth?.user?.id);
    const data = await saveProfile(userId, req.body);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
