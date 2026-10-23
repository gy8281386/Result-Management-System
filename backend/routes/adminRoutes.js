const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const emailController = require('../controllers/emailController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/add-user', verifyToken, isAdmin, adminController.addUser);
router.get('/users', verifyToken, isAdmin, adminController.getUsers);
router.post('/publish-result', verifyToken, isAdmin, emailController.publishResult);

module.exports = router;