const CAT = require('../models/CAT');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Unit = require('../models/Unit');

// @desc   Create a new CAT (lecturer only)
// @route  POST /api/cats/create
const createCAT = async (req, res) => {
  try {
    const { title, description, unit, deadline, timeLimitMinutes } = req.body;

    const unitDoc = await Unit.findById(unit);
    if (!unitDoc) {
      return res.status(400).json({ message: 'Invalid unit' });
    }

    if (String(unitDoc.department) !== String(req.user.department)) {
      return res.status(403).json({ message: 'You can only create CATs for units in your department' });
    }

    const cat = await CAT.create({
      title,
      description,
      unit,
      createdBy: req.user._id,
      deadline,
      timeLimitMinutes: timeLimitMinutes || 50,
    });

    res.status(201).json(cat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Add a question to a CAT (lecturer only)
// @route  POST /api/cats/:catId/questions
const addQuestion = async (req, res) => {
  try {
    const { questionText, options, correctAnswerIndex } = req.body;

    const cat = await CAT.findById(req.params.catId);
    if (!cat) {
      return res.status(404).json({ message: 'CAT not found' });
    }

    if (String(cat.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only add questions to your own CATs' });
    }

    if (!options || options.length !== 4) {
      return res.status(400).json({ message: 'Exactly 4 options are required' });
    }

    const question = await Question.create({
      cat: cat._id,
      questionText,
      options,
      correctAnswerIndex,
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all CATs for a unit
const getCATsByUnit = async (req, res) => {
  try {
    const cats = await CAT.find({ unit: req.params.unitId }).populate('createdBy', 'name');

    const catsWithCounts = await Promise.all(
      cats.map(async (cat) => {
        const questionCount = await Question.countDocuments({ cat: cat._id });
        let hasSubmitted = false;
        if (req.user.role === 'student') {
          const submission = await Submission.findOne({
            cat: cat._id,
            student: req.user._id,
            submittedAt: { $exists: true },
          });
          hasSubmitted = !!submission;
        }
        return { ...cat.toObject(), questionCount, hasSubmitted };
      })
    );

    res.status(200).json(catsWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc   Get questions for a CAT (student, when starting - answers hidden)
// @route  GET /api/cats/:catId/questions
const getQuestionsForAttempt = async (req, res) => {
  try {
    const cat = await CAT.findById(req.params.catId);
    if (!cat) {
      return res.status(404).json({ message: 'CAT not found' });
    }

    // Check if already submitted
    const existing = await Submission.findOne({ cat: cat._id, student: req.user._id });
    if (existing && existing.submittedAt) {
      return res.status(400).json({ message: 'You have already submitted this CAT' });
    }

    const questions = await Question.find({ cat: cat._id }).select('-correctAnswerIndex');

    if (questions.length === 0) {
      return res.status(400).json({ message: 'This CAT has no questions yet' });
    }

    // Record start time if not already started
    let submission = existing;
    if (!submission) {
      submission = await Submission.create({
        cat: cat._id,
        student: req.user._id,
        startedAt: new Date(),
        answers: [],
      });
    }

    res.status(200).json({
      cat: {
        _id: cat._id,
        title: cat.title,
        description: cat.description,
        timeLimitMinutes: cat.timeLimitMinutes,
      },
      questions,
      startedAt: submission.startedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Submit CAT answers - auto-grades
// @route  POST /api/cats/:catId/submit
const submitCAT = async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionId, selectedIndex }]

    const cat = await CAT.findById(req.params.catId);
    if (!cat) {
      return res.status(404).json({ message: 'CAT not found' });
    }

    const submission = await Submission.findOne({ cat: cat._id, student: req.user._id });
    if (!submission) {
      return res.status(400).json({ message: 'No active attempt found. Please start the CAT first.' });
    }

    if (submission.submittedAt) {
      return res.status(400).json({ message: 'You have already submitted this CAT' });
    }

    const questions = await Question.find({ cat: cat._id });
    let correctCount = 0;

    const gradedAnswers = answers.map((ans) => {
      const question = questions.find((q) => String(q._id) === ans.questionId);
      const isCorrect = question && question.correctAnswerIndex === ans.selectedIndex;
      if (isCorrect) correctCount++;
      return {
        question: ans.questionId,
        selectedIndex: ans.selectedIndex,
      };
    });

    submission.answers = gradedAnswers;
    submission.score = correctCount;
    submission.totalQuestions = questions.length;
    submission.submittedAt = new Date();
    submission.isLate = new Date() > new Date(cat.deadline);
    await submission.save();

    res.status(200).json({
      score: correctCount,
      totalQuestions: questions.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all submissions for a CAT (lecturer only)
// @route  GET /api/cats/:catId/submissions
const getSubmissionsByCAT = async (req, res) => {
  try {
    const submissions = await Submission.find({
      cat: req.params.catId,
      submittedAt: { $exists: true },
    }).populate('student', 'name admissionNumber');
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCAT,
  addQuestion,
  getCATsByUnit,
  getQuestionsForAttempt,
  submitCAT,
  getSubmissionsByCAT,
};