const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT
  },
  cleanliness: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 }
  },
  accuracy: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 }
  },
  communication: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 }
  },
  location: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 }
  },
  checkIn: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 }
  },
  value: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 }
  }
}, {
  tableName: 'reviews',
  timestamps: true
});

module.exports = Review;