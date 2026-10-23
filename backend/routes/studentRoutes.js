const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/my-results', verifyToken, studentController.getMyResults);

module.exports = router;