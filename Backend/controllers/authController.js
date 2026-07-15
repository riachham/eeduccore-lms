const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc   Register a new user (always as student)
// @route  POST /api/auth/register
// @desc   Register a new user (always as student)
// @route  POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, admissionNumber, course } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate admission number matches selected course
    if (course) {
      const Course = require('../models/Course');
      const selectedCourse = await Course.findById(course);

      if (!selectedCourse) {
        return res.status(400).json({ message: 'Invalid course selected' });
      }

      const expectedPrefix = selectedCourse.code + '-';
      if (!admissionNumber || !admissionNumber.toUpperCase().startsWith(expectedPrefix)) {
        return res.status(400).json({
          message: `Admission number must start with "${expectedPrefix}" for the selected course`,
        });
      }
    }

    // Force role to student - no one can self-register as admin/lecturer
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      admissionNumber,
      course,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc   Login user
// @route  POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc   Get logged-in user's profile
// @route  GET /api/auth/profile
const getProfile = async (req, res) => {
  res.status(200).json(req.user);
};
// @desc   Admin creates a new user (lecturer, admin, or student)
// @route  POST /api/auth/admin/create-user
const adminCreateUser = async (req, res) => {
  try {
    const { name, email, password, role, department, admissionNumber } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role, // admin can set any role: admin, lecturer, or student
      department,
      admissionNumber,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getProfile, adminCreateUser };