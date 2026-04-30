const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const propertyRoutes = require('./property.routes');
const bookingRoutes = require('./booking.routes');
const reviewRoutes = require('./review.routes');
const messageRoutes = require('./message.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/properties', propertyRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/messages', messageRoutes);

module.exports = router;