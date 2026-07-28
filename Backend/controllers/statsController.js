const Unit = require('../models/Unit');
const Note = require('../models/Note');
const CAT = require('../models/CAT');
const Submission = require('../models/Submission');
const Course = require('../models/Course');

// @desc   Get dashboard stats for a student
// @route  GET /api/stats/student
const getStudentStats = async (req, res) => {
  try {
    const course = await Course.findById(req.user.course);
    if (!course) {
      return res.status(400).json({ message: 'No course assigned' });
    }

    const units = await Unit.find({ department: course.department });
    const unitIds = units.map((u) => u._id);

    const totalNotes = await Note.countDocuments({ unit: { $in: unitIds } });

    const allCats = await CAT.find({ unit: { $in: unitIds } });
    const catIds = allCats.map((c) => c._id);

    const mySubmissions = await Submission.find({
      cat: { $in: catIds },
      student: req.user._id,
    });
    const submittedCatIds = mySubmissions.map((s) => String(s.cat));

    const pendingCats = allCats.filter((cat) => !submittedCatIds.includes(String(cat._id)));

    const now = new Date();
    const upcomingDeadline = pendingCats
      .filter((cat) => new Date(cat.deadline) > now)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

    res.status(200).json({
      totalUnits: units.length,
      totalNotes,
      pendingCats: pendingCats.length,
      nextDeadline: upcomingDeadline ? upcomingDeadline.deadline : null,
      nextDeadlineTitle: upcomingDeadline ? upcomingDeadline.title : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStudentStats };