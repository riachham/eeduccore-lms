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
    textAnswer: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
    },
    filePath: {
      type: String,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);