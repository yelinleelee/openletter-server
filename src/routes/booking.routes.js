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

router.get('/host/me', authMiddleware, async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: Property, as: 'property', where: { hostId: req.user.id }, required: true },
        { model: User, as: 'guest', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { guestId: req.user.id },
      include: [
        { model: Property, as: 'property' }
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

    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'propertyId, checkIn, checkOut는 필수입니다' });
    }
    if (!(new Date(checkIn) < new Date(checkOut))) {
      return res.status(400).json({ error: '체크아웃은 체크인 이후여야 합니다' });
    }

    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({ error: '숙소를 찾을 수 없습니다' });
    }

    if (property.hostId === req.user.id) {
      return res.status(400).json({ error: '본인 숙소는 예약할 수 없습니다' });
    }

    // Half-open overlap: existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn
    const conflicting = await Booking.findOne({
      where: {
        propertyId,
        status: { [Op.notIn]: ['cancelled'] },
        checkIn: { [Op.lt]: checkOut },
        checkOut: { [Op.gt]: checkIn },
      }
    });

    if (conflicting) {
      return res.status(409).json({ error: '선택한 날짜에 이미 예약이 있습니다' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = Number(property.price) * nights;

    const booking = await Booking.create({
      propertyId,
      guestId: req.user.id,
      checkIn,
      checkOut,
      guests: guests || 1,
      totalPrice,
      specialRequests,
      status: 'pending',
      paymentStatus: 'pending',
    });

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/cancel', authMiddleware, async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다' });
    }

    if (booking.guestId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: '취소 권한이 없습니다' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: '이미 취소된 예약입니다' });
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

router.patch('/:id/approve', authMiddleware, async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Property, as: 'property' }]
    });

    if (!booking) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다' });
    }

    if (!booking.property || booking.property.hostId !== req.user.id) {
      return res.status(403).json({ error: '승인 권한이 없습니다' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: '대기 중인 예약만 승인할 수 있습니다' });
    }

    await booking.update({ status: 'confirmed' });

    res.json(booking);
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