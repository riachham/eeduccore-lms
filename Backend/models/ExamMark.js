const mongoose = require('mongoose');

const examMarkSchema = new mongoose.Schema(
  {
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 70,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// One exam mark per student per unit — re-saving updates the existing record
examMarkSchema.index({ unit: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ExamMark', examMarkSchema);