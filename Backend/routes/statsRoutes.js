const express = require('express');
const router = express.Router();
const { getStudentStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/student', protect, authorize('student'), getStudentStats);

module.exports = router;