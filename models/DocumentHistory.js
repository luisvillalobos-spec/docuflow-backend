const db = require('../config/database');

class DocumentHistory {
    // Obtener historial de un documento
    static async getByDocumentId(documentId) {
        const [rows] = await db.query(`
            SELECT 
                dh.*,
                u.full_name as user_name,
                u.role as user_role
            FROM document_history dh
            LEFT JOIN users u ON dh.user_id = u.id
            WHERE dh.document_id = ?
            ORDER BY dh.created_at DESC
        `, [documentId]);
        return rows;
    }

    // Crear entrada en el historial
    static async create(historyData) {
        const { document_id, version, action, comments, file_path, user_id } = historyData;
        
        // Validar que action no esté vacío
        if (!action || action.trim() === '') {
            throw new Error('El campo "action" es requerido para crear una entrada en el historial');
        }
        
        const [result] = await db.query(
            'INSERT INTO document_history (document_id, version, action, comments, file_path, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [document_id, version, action, comments || '', file_path, user_id]
        );
        
        return result.insertId;
    }

    // Obtener última versión de un documento
    static async getLatestVersion(documentId) {
        const [rows] = await db.query(
            'SELECT version FROM document_history WHERE document_id = ? ORDER BY created_at DESC LIMIT 1',
            [documentId]
        );
        return rows[0];
    }

    // Obtener historial completo con paginación
    static async getAll(limit = 50, offset = 0) {
        const [rows] = await db.query(`
            SELECT 
                dh.*,
                d.title as document_title,
                d.code as document_code,
                u.full_name as user_name
            FROM document_history dh
            LEFT JOIN documents d ON dh.document_id = d.id
            LEFT JOIN users u ON dh.user_id = u.id
            ORDER BY dh.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        return rows;
    }

    // Corregir entradas con action vacío (utilidad para limpiar datos)
    static async fixEmptyActions() {
        const [result] = await db.query(`
            UPDATE document_history 
            SET action = 'Acción no registrada' 
            WHERE action IS NULL OR action = ''
        `);
        return result.affectedRows;
    }
}

module.exports = DocumentHistory;