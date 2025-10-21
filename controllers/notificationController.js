const Notification = require('../models/Notification');

// Obtener notificaciones del usuario
exports.getMyNotifications = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const notifications = await Notification.getByUserId(req.user.id, limit);
        
        res.json({
            success: true,
            count: notifications.length,
            notifications
        });
        
    } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Obtener notificaciones no leídas
exports.getUnreadNotifications = async (req, res) => {
    try {
        const notifications = await Notification.getUnreadByUserId(req.user.id);
        
        res.json({
            success: true,
            count: notifications.length,
            notifications
        });
        
    } catch (error) {
        console.error('Error obteniendo notificaciones no leídas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Contar notificaciones no leídas
exports.countUnread = async (req, res) => {
    try {
        const count = await Notification.countUnread(req.user.id);
        
        res.json({
            success: true,
            count
        });
        
    } catch (error) {
        console.error('Error contando notificaciones:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Marcar notificación como leída
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        const updated = await Notification.markAsRead(id, req.user.id);
        
        if (!updated) {
            return res.status(404).json({ 
                success: false, 
                message: 'Notificación no encontrada.' 
            });
        }
        
        res.json({
            success: true,
            message: 'Notificación marcada como leída.'
        });
        
    } catch (error) {
        console.error('Error marcando notificación:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Marcar todas como leídas
exports.markAllAsRead = async (req, res) => {
    try {
        const count = await Notification.markAllAsRead(req.user.id);
        
        res.json({
            success: true,
            message: `${count} notificaciones marcadas como leídas.`,
            count
        });
        
    } catch (error) {
        console.error('Error marcando todas como leídas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Eliminar notificación
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deleted = await Notification.delete(id, req.user.id);
        
        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                message: 'Notificación no encontrada.' 
            });
        }
        
        res.json({
            success: true,
            message: 'Notificación eliminada.'
        });
        
    } catch (error) {
        console.error('Error eliminando notificación:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};