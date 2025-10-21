const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticateToken = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener mis notificaciones
router.get('/', notificationController.getMyNotifications);

// Obtener notificaciones no leídas
router.get('/unread', notificationController.getUnreadNotifications);

// Contar no leídas
router.get('/count', notificationController.countUnread);

// Marcar como leída
router.patch('/:id/read', notificationController.markAsRead);

// Marcar todas como leídas
router.patch('/read-all', notificationController.markAllAsRead);

// Eliminar notificación
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;