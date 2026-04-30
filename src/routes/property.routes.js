const express = require('express');
const router = express.Router();
const { Property, User, Review } = require('../models');
const authMiddleware = require('../middlewares/auth');
const { Op } = require('sequelize');

router.get('/', async (req, res, next) => {
  try {
    const { city, checkIn, checkOut, guests, minPrice, maxPrice, propertyType } = req.query;
    
    const where = { isAvailable: true };
    
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (propertyType) where.propertyType = propertyType;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }
    if (guests) where.maxGuests = { [Op.gte]: guests };
    
    const properties = await Property.findAll({
      where,
      include: [{ model: User, as: 'host', attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(properties);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id, {
      include: [
        { model: User, as: 'host', attributes: ['id', 'name', 'avatar', 'phone'] },
        { model: Review, as: 'reviews' }
      ]
    });
    
    if (!property) {
      return res.status(404).json({ error: '숙소를 찾을 수 없습니다' });
    }
    
    res.json(property);
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const property = await Property.create({
      ...req.body,
      hostId: req.user.id
    });
    res.status(201).json(property);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: '숙소를 찾을 수 없습니다' });
    }
    
    if (property.hostId !== req.user.id) {
      return res.status(403).json({ error: '수정 권한이 없습니다' });
    }
    
    await property.update(req.body);
    res.json(property);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id);
    
    if (!property) {
      return res.status(404).json({ error: '숙소를 찾을 수 없습니다' });
    }
    
    if (property.hostId !== req.user.id) {
      return res.status(403).json({ error: '삭제 권한이 없습니다' });
    }
    
    await property.destroy();
    res.json({ message: '숙소가 삭제되었습니다' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;