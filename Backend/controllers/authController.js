const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../config/email');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc   Register a new user (always as student)
// @route  POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, admissionNumber, course } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

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

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      admissionNumber,
      course,
      verificationToken,
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email.html?token=${verificationToken}`;

    await sendEmail(
      user.email,
      'Verify your Educore account',
      `<h2>Welcome to Educore, ${user.name}!</h2>
       <p>Please verify your email address by clicking the link below:</p>
       <a href="${verifyUrl}" style="background-color:#1a3c6e;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Verify Email</a>
       <p>If the button doesn't work, copy this link into your browser:</p>
       <p>${verifyUrl}</p>`
    );

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account before logging in.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Verify a user's email using the token
// @route  GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    await sendEmail(
      user.email,
      'Welcome to Educore!',
      `<h2>Welcome aboard, ${user.name}!</h2>
       <p>Your email has been verified successfully. You can now log in and start using Educore.</p>`
    );

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
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

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
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
      role,
      department,
      admissionNumber,
      isVerified: true, // admin-created accounts are pre-verified
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

module.exports = { registerUser, loginUser, getProfile, adminCreateUser, verifyEmail };