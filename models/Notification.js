const db = require('../config/database');

class Notification {
    // Crear notificación
    static async create(notificationData) {
        const { user_id, document_id, type, title, message } = notificationData;
        
        const [result] = await db.query(
            'INSERT INTO notifications (user_id, document_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
            [user_id, document_id, type, title, message]
        );
        
        return result.insertId;
    }

    // Obtener notificaciones de un usuario
    static async getByUserId(userId, limit = 10) {
        const [rows] = await db.query(`
            SELECT 
                n.*,
                d.code as document_code,
                d.title as document_title
            FROM notifications n
            LEFT JOIN documents d ON n.document_id = d.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT ?
        `, [userId, limit]);
        
        return rows;
    }

    // Obtener notificaciones no leídas
    static async getUnreadByUserId(userId) {
        const [rows] = await db.query(`
            SELECT 
                n.*,
                d.code as document_code,
                d.title as document_title
            FROM notifications n
            LEFT JOIN documents d ON n.document_id = d.id
            WHERE n.user_id = ? AND n.is_read = FALSE
            ORDER BY n.created_at DESC
        `, [userId]);
        
        return rows;
    }

    // Contar notificaciones no leídas
    static async countUnread(userId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        
        return rows[0].count;
    }

    // Marcar como leída
    static async markAsRead(id, userId) {
        const [result] = await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        return result.affectedRows > 0;
    }

    // Marcar todas como leídas
    static async markAllAsRead(userId) {
        const [result] = await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );
        
        return result.affectedRows;
    }

    // Eliminar notificación
    static async delete(id, userId) {
        const [result] = await db.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        return result.affectedRows > 0;
    }
}

module.exports = Notification;