const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// Todas las rutas requieren autenticación y rol Admin
router.use(authenticateToken);
router.use(isAdmin);

router.get('/', userController.getAllUsers);
router.get('/role/:role', userController.getUsersByRole);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;