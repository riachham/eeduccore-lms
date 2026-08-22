const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    cat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CAT',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        selectedIndex: {
          type: Number,
        },
      },
    ],
    score: {
      type: Number,
    },
    totalQuestions: {
      type: Number,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);