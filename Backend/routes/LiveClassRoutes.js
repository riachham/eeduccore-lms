const express = require('express');
const router = express.Router();
const {
  startLiveClass,
  getLiveClassStatus,
  endLiveClass,
  getLiveClassHistory,
} = require('../controllers/liveClassController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/start', protect, authorize('lecturer'), startLiveClass);
router.get('/status/:unitId', protect, getLiveClassStatus);
router.post('/end/:unitId', protect, authorize('lecturer'), endLiveClass);
router.get('/history/:unitId', protect, getLiveClassHistory);

module.exports = router;