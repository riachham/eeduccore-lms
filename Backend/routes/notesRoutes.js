const express = require('express');
const router = express.Router();
const { uploadNote, getNotesByUnit } = require('../controllers/noteController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, authorize('lecturer'), upload.single('file'), uploadNote);
router.get('/unit/:unitId', protect, getNotesByUnit);

module.exports = router;