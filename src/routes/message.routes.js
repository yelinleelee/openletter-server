const express = require('express');
const router = express.Router();
const { Message, User } = require('../models');
const authMiddleware = require('../middlewares/auth');
const { Op } = require('sequelize');

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

router.get('/conversation/:userId', authMiddleware, async (req, res, next) => {
  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id, receiverId: req.params.userId },
          { senderId: req.params.userId, receiverId: req.user.id }
        ]
      },
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    
    const message = await Message.create({
      conversationId: [req.user.id, receiverId].sort().join('-'),
      senderId: req.user.id,
      receiverId,
      content
    });
    
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    await Message.update(
      { isRead: true },
      { where: { id: req.params.id, receiverId: req.user.id } }
    );
    res.json({ message: '읽음 처리되었습니다' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;