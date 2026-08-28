const Unit = require('../models/Unit');
const Course = require('../models/Course');
const CAT = require('../models/CAT');
const Submission = require('../models/Submission');
const ExamMark = require('../models/ExamMark');

// Standard weighting assumption: CAT counts for 30%, Exam counts for 70%.
// Adjust these two constants if your institution uses a different split.
const CAT_WEIGHT = 30;
const EXAM_WEIGHT = 70;

function getGrade(total) {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 40) return 'D';
  return 'E';
}

// @desc   Get the logged-in student's CAT + Exam marks, total, and grade
//         for every unit in their department (same "my units" scope used elsewhere)
// @route  GET /api/marks/my-marks
const getMyMarks = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view marks this way' });
    }

    const course = await Course.findById(req.user.course);
    if (!course) {
      return res.status(400).json({ message: 'No course assigned to this student' });
    }

    const units = await Unit.find({ department: course.department }).sort({ name: 1 });

    const results = await Promise.all(
      units.map(async (unit) => {
        // CAT mark: average % across every CAT (in this unit) the student has submitted
        const cats = await CAT.find({ unit: unit._id }).select('_id');
        const catIds = cats.map((c) => c._id);

        const submissions = await Submission.find({
          cat: { $in: catIds },
          student: req.user._id,
          submittedAt: { $exists: true },
        });

        let catMark = null;
        if (submissions.length > 0) {
          const avgPercent =
            submissions.reduce((sum, s) => {
              const pct = s.totalQuestions > 0 ? s.score / s.totalQuestions : 0;
              return sum + pct;
            }, 0) / submissions.length;
          catMark = Math.round(avgPercent * CAT_WEIGHT * 10) / 10;
        }

        // Exam mark (entered manually by lecturer, Phase 3)
        const examDoc = await ExamMark.findOne({ unit: unit._id, student: req.user._id });
        let examMark = null;
        if (examDoc) {
          const pct = examDoc.maxMarks > 0 ? examDoc.marks / examDoc.maxMarks : 0;
          examMark = Math.round(pct * EXAM_WEIGHT * 10) / 10;
        }

        const hasBoth = catMark !== null && examMark !== null;
        const total = hasBoth ? Math.round((catMark + examMark) * 10) / 10 : null;
        const grade = total !== null ? getGrade(total) : null;

        return {
          unitId: unit._id,
          unitName: unit.name,
          unitCode: unit.code,
          catMark,
          examMark,
          total,
          grade,
        };
      })
    );

    res.status(200).json({
      catWeight: CAT_WEIGHT,
      examWeight: EXAM_WEIGHT,
      units: results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMyMarks };