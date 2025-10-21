const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;