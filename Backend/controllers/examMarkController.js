const ExamMark = require('../models/ExamMark');
const Unit = require('../models/Unit');
const Course = require('../models/Course');
const User = require('../models/User');

// Helper: all students eligible for a unit (same department, any course in it)
async function getEligibleStudents(unit) {
  const courses = await Course.find({ department: unit.department }).select('_id');
  const courseIds = courses.map((c) => c._id);
  return User.find({ role: 'student', course: { $in: courseIds } })
    .select('name admissionNumber course')
    .sort({ name: 1 });
}

// @desc   Get all students for a unit with their existing exam marks (lecturer)
// @route  GET /api/exammarks/unit/:unitId
const getExamMarksForUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    if (String(unit.department) !== String(req.user.department)) {
      return res.status(403).json({ message: 'You can only view marks for units in your department' });
    }

    const students = await getEligibleStudents(unit);
    const existingMarks = await ExamMark.find({ unit: unit._id });

    const marksByStudent = {};
    existingMarks.forEach((m) => {
      marksByStudent[String(m.student)] = m;
    });

    const result = students.map((s) => {
      const existing = marksByStudent[String(s._id)];
      return {
        studentId: s._id,
        name: s.name,
        admissionNumber: s.admissionNumber,
        marks: existing ? existing.marks : null,
        maxMarks: existing ? existing.maxMarks : 70,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Set or update a student's exam mark for a unit (lecturer)
// @route  POST /api/exammarks/set
const setExamMark = async (req, res) => {
  try {
    const { unit, student, marks, maxMarks } = req.body;

    const unitDoc = await Unit.findById(unit);
    if (!unitDoc) {
      return res.status(400).json({ message: 'Invalid unit' });
    }

    if (String(unitDoc.department) !== String(req.user.department)) {
      return res.status(403).json({ message: 'You can only enter marks for units in your department' });
    }

    const cappedMax = maxMarks || 70;

    if (marks === undefined || marks === null || isNaN(marks) || marks < 0 || marks > cappedMax) {
      return res.status(400).json({ message: `Marks must be a number between 0 and ${cappedMax}` });
    }

    const examMark = await ExamMark.findOneAndUpdate(
      { unit, student },
      { unit, student, marks, maxMarks: cappedMax, enteredBy: req.user._id },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json(examMark);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExamMarksForUnit, setExamMark };