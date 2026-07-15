const Unit = require('../models/Unit');
const Course = require('../models/Course');

// @desc   Get units for the logged-in user's department
// @route  GET /api/units/my-units
const getMyUnits = async (req, res) => {
  try {
    let departmentId;

    if (req.user.role === 'lecturer' || req.user.role === 'admin') {
      departmentId = req.user.department;
    } else if (req.user.role === 'student') {
      const course = await Course.findById(req.user.course);
      if (!course) {
        return res.status(400).json({ message: 'Student has no course assigned' });
      }
      departmentId = course.department;
    }

    if (!departmentId) {
      return res.status(400).json({ message: 'No department found for this user' });
    }

    const units = await Unit.find({ department: departmentId });
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMyUnits };