const mongoose = require('mongoose');

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
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
