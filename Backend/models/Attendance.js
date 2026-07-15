const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    liveClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveClass',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    respondedPrompts: [
      {
        type: Number, // prompt index (0, 1, 2, ...)
      },
    ],
    status: {
      type: String,
      enum: ['fully attended', 'partially attended', 'not attended'],
      default: 'not attended',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);