const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
