const express = require('express');
const router = express.Router();
const { User } = require('../models');
const authMiddleware = require('../middlewares/auth');

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.update(
      { name, phone, avatar },
      { where: { id: req.user.id }, returning: true }
    );
    res.json(user[1][0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;