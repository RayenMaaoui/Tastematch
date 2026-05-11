const mongoose = require('mongoose');

const loyaltySchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  completedOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  availableFreeOrders: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required() {
      return this.authProvider === 'local'
    }
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  firebaseUid: {
    type: String,
    default: '',
    index: true
  },
  role: {
    type: String,
    enum: ['client', 'restaurant', 'admin'],
    default: 'client'
  },
  avatar: {
    type: String,
    default: ''
  },
  preferences: {
    type: [String],
    default: []
  },
  loyalty: {
    type: [loyaltySchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
