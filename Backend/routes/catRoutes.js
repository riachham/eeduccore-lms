const express = require('express');
const router = express.Router();
const {
  createCAT,
  addQuestion,
  getCATsByUnit,
  getQuestionsForAttempt,
  submitCAT,
  getSubmissionsByCAT,
} = require('../controllers/catController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/create', protect, authorize('lecturer'), createCAT);
router.post('/:catId/questions', protect, authorize('lecturer'), addQuestion);
router.get('/unit/:unitId', protect, getCATsByUnit);
router.get('/:catId/questions', protect, authorize('student'), getQuestionsForAttempt);
router.post('/:catId/submit', protect, authorize('student'), submitCAT);
router.get('/:catId/submissions', protect, authorize('lecturer'), getSubmissionsByCAT);

module.exports = router;