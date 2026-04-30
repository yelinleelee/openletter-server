const express = require('express');
const router = express.Router();
const { Booking, Property, User } = require('../models');
const authMiddleware = require('../middlewares/auth');
const { Op } = require('sequelize');

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const where = req.user.role === 'host' 
      ? { '$property.hostId$': req.user.id }
      : { guestId: req.user.id };
    
    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Property, as: 'property' },
        { model: User, as: 'guest', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Property, as: 'property' },
        { model: User, as: 'guest', attributes: ['id', 'name', 'email'] }
      ]
    });
    
    if (!booking) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다' });
    }
    
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { propertyId, checkIn, checkOut, guests, specialRequests } = req.body;
    
    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({ error: '숙소를 찾을 수 없습니다' });
    }
    
    // Check availability
    const conflictingBookings = await Booking.findOne({
      where: {
        propertyId,
        status: { [Op.notIn]: ['cancelled'] },
        [Op.or]: [
          { checkIn: { [Op.between]: [checkIn, checkOut] } },
          { checkOut: { [Op.between]: [checkIn, checkOut] } },
          {
            [Op.and]: [
              { checkIn: { [Op.lte]: checkIn } },
              { checkOut: { [Op.gte]: checkOut } }
            ]
          }
        ]
      }
    });
    
    if (conflictingBookings) {
      return res.status(400).json({ error: '선택한 날짜에 예약할 수 없습니다' });
    }
    
    // Calculate total price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = property.price * nights;
    
    const booking = await Booking.create({
      propertyId,
      guestId: req.user.id,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      specialRequests
    });
    
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다' });
    }
    
    if (booking.guestId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '취소 권한이 없습니다' });
    }
    
    await booking.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: req.body.reason
    });
    
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

module.exports = router;