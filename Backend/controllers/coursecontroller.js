const Course = require('../models/Course');
require('../models/Department'); // ensures Department schema is registered

// @desc   Get all courses (with department populated)
// @route  GET /api/courses
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('department', 'name');
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCourses };