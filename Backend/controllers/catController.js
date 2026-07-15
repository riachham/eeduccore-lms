const CAT = require('../models/CAT');
const Submission = require('../models/Submission');
const Unit = require('../models/Unit');

// @desc   Create a new CAT (lecturer only, must belong to unit's department)
// @route  POST /api/cats/create
const createCAT = async (req, res) => {
  try {
    const { title, description, unit, deadline } = req.body;

    const unitDoc = await Unit.findById(unit);
    if (!unitDoc) {
      return res.status(400).json({ message: 'Invalid unit' });
    }

    if (String(unitDoc.department) !== String(req.user.department)) {
      return res.status(403).json({ message: 'You can only create CATs for units in your department' });
    }

    const catData = {
      title,
      description,
      unit,
      createdBy: req.user._id,
      deadline,
    };

    if (req.file) {
      catData.fileName = req.file.originalname;
      catData.filePath = req.file.filename;
    }

    const cat = await CAT.create(catData);
    res.status(201).json(cat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all CATs for a specific unit
// @route  GET /api/cats/unit/:unitId
const getCATsByUnit = async (req, res) => {
  try {
    const cats = await CAT.find({ unit: req.params.unitId }).populate('createdBy', 'name');
    res.status(200).json(cats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Student submits a CAT
// @route  POST /api/cats/:catId/submit
const submitCAT = async (req, res) => {
  try {
    const { textAnswer } = req.body;
    const cat = await CAT.findById(req.params.catId);

    if (!cat) {
      return res.status(404).json({ message: 'CAT not found' });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      cat: cat._id,
      student: req.user._id,
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this CAT' });
    }

    const isLate = new Date() > new Date(cat.deadline);

    const submissionData = {
      cat: cat._id,
      student: req.user._id,
      textAnswer,
      isLate,
    };

    if (req.file) {
      submissionData.fileName = req.file.originalname;
      submissionData.filePath = req.file.filename;
    }

    const submission = await Submission.create(submissionData);
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all submissions for a specific CAT (lecturer only)
// @route  GET /api/cats/:catId/submissions
const getSubmissionsByCAT = async (req, res) => {
  try {
    const submissions = await Submission.find({ cat: req.params.catId }).populate('student', 'name admissionNumber');
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCAT, getCATsByUnit, submitCAT, getSubmissionsByCAT };