const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema(
  {
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    totalPrompts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LiveClass', liveClassSchema);