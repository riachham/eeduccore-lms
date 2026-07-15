const express = require('express');
const router = express.Router();
const { getMyUnits } = require('../controllers/unitController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my-units', protect, getMyUnits);

module.exports = router;