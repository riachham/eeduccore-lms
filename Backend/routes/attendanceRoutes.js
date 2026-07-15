const express = require('express');
const router = express.Router();
const {
  respondToPrompt,
  incrementPrompt,
  finalizeAttendance,
  getAttendanceReport,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/respond', protect, authorize('student'), respondToPrompt);
router.post('/increment-prompt/:liveClassId', protect, authorize('lecturer'), incrementPrompt);
router.post('/finalize/:liveClassId', protect, authorize('lecturer'), finalizeAttendance);
router.get('/report/:liveClassId', protect, authorize('lecturer'), getAttendanceReport);

module.exports = router;