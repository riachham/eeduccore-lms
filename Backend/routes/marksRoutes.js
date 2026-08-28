const express = require('express');
const router = express.Router();
const { getMyMarks } = require('../controllers/marksController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-marks', protect, authorize('student'), getMyMarks);

module.exports = router;