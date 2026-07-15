const express = require('express');
const router = express.Router();
const {
  createCAT,
  getCATsByUnit,
  submitCAT,
  getSubmissionsByCAT,
} = require('../controllers/catController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/create', protect, authorize('lecturer'), upload.single('file'), createCAT);
router.get('/unit/:unitId', protect, getCATsByUnit);
router.post('/:catId/submit', protect, authorize('student'), upload.single('file'), submitCAT);
router.get('/:catId/submissions', protect, authorize('lecturer'), getSubmissionsByCAT);

module.exports = router;