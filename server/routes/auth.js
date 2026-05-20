const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe, getUsers } = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me',  authenticate, getMe);
router.put('/me',  authenticate, updateMe);
router.get('/users', authenticate, getUsers);

module.exports = router;
