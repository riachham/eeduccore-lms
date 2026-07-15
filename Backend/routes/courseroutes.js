const express = require('express');
const router = express.Router();
const { getCourses } = require('../controllers/coursecontroller');

router.get('/', getCourses);

module.exports = router;