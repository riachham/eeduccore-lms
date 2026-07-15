const Department = require('../models/Department');
require('../models/Faculty'); // ensures Faculty schema is registered

// @desc   Get all departments (with faculty populated)
// @route  GET /api/departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('faculty', 'name code');
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDepartments };