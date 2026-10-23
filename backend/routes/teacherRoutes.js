const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const upload = require('../middleware/uploadMiddleware');
const { verifyToken, isTeacher } = require('../middleware/authMiddleware');

router.post('/add-marks', verifyToken, isTeacher, teacherController.addMarks);
router.post('/bulk-upload', verifyToken, isTeacher, upload.single('file'), teacherController.uploadCSV);

module.exports = router;