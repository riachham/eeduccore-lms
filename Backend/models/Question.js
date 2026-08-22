const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    cat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CAT',
      required: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (val) {
          return val.length === 4;
        },
        message: 'Each question must have exactly 4 options',
      },
    },
    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);