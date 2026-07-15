const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, adminCreateUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.post('/admin/create-user', protect, authorize('admin'), adminCreateUser);

module.exports = router;