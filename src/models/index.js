const sequelize = require('../config/database');
const User = require('./User');
const Property = require('./Property');
const Booking = require('./Booking');
const Review = require('./Review');
const Message = require('./Message');

// User - Property associations
User.hasMany(Property, { foreignKey: 'hostId', as: 'properties' });
Property.belongsTo(User, { foreignKey: 'hostId', as: 'host' });

// User - Booking associations (as guest)
User.hasMany(Booking, { foreignKey: 'guestId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'guestId', as: 'guest' });

// Property - Booking associations
Property.hasMany(Booking, { foreignKey: 'propertyId', as: 'bookings' });
Booking.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// Booking - Review associations
Booking.hasOne(Review, { foreignKey: 'bookingId', as: 'review' });
Review.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// Property - Review associations
Property.hasMany(Review, { foreignKey: 'propertyId', as: 'reviews' });
Review.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

// User - Review associations
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User - Message associations (sender)
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// User - Message associations (receiver)
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

module.exports = {
  sequelize,
  User,
  Property,
  Booking,
  Review,
  Message
};