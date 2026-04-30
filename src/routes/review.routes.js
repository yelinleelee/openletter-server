const express = require('express');
const router = express.Router();
const { Review, Booking, Property, User } = require('../models');
const authMiddleware = require('../middlewares/auth');

router.get('/property/:propertyId', async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { propertyId: req.params.propertyId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { bookingId, rating, comment, cleanliness, accuracy, communication, location, checkIn, value } = req.body;
    
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다' });
    }
    
    if (booking.guestId !== req.user.id) {
      return res.status(403).json({ error: '리뷰 작성 권한이 없습니다' });
    }
    
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: '완료된 예약에 대해서만 리뷰를 작성할 수 있습니다' });
    }
    
    const existingReview = await Review.findOne({ where: { bookingId } });
    if (existingReview) {
      return res.status(400).json({ error: '이미 리뷰를 작성한 예약입니다' });
    }
    
    const review = await Review.create({
      propertyId: booking.propertyId,
      bookingId,
      userId: req.user.id,
      rating,
      comment,
      cleanliness,
      accuracy,
      communication,
      location,
      checkIn,
      value
    });
    
    // Update property rating
    const reviews = await Review.findAll({ where: { propertyId: booking.propertyId } });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Property.update(
      { rating: avgRating, reviewCount: reviews.length },
      { where: { id: booking.propertyId } }
    );
    
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

module.exports = router;