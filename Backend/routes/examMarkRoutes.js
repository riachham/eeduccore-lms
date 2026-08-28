const express = require('express');
const router = express.Router();
const { getExamMarksForUnit, setExamMark } = require('../controllers/examMarkController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/unit/:unitId', protect, authorize('lecturer'), getExamMarksForUnit);
router.post('/set', protect, authorize('lecturer'), setExamMark);

module.exports = router;