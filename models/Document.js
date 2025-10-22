const db = require('../config/database');

class Document {
    // Obtener todos los documentos con información de usuarios
    static async getAll() {
        const [rows] = await db.query(`
            SELECT 
                d.*,
                creator.full_name as creator_name,
                reviewer.full_name as reviewer_name,
                approver.full_name as approver_name
            FROM documents d
            LEFT JOIN users creator ON d.created_by = creator.id
            LEFT JOIN users reviewer ON d.reviewed_by = reviewer.id
            LEFT JOIN users approver ON d.approved_by = approver.id
            ORDER BY d.updated_at DESC
        `);
        return rows;
    }

    // Obtener documento por ID
    static async getById(id) {
        const [rows] = await db.query(`
            SELECT 
                d.*,
                creator.full_name as creator_name,
                creator.email as creator_email,
                reviewer.full_name as reviewer_name,
                approver.full_name as approver_name
            FROM documents d
            LEFT JOIN users creator ON d.created_by = creator.id
            LEFT JOIN users reviewer ON d.reviewed_by = reviewer.id
            LEFT JOIN users approver ON d.approved_by = approver.id
            WHERE d.id = ?
        `, [id]);
        return rows[0];
    }

    // Obtener documentos por estado
    static async getByStatus(status) {
        const [rows] = await db.query(`
            SELECT 
                d.*,
                creator.full_name as creator_name,
                reviewer.full_name as reviewer_name
            FROM documents d
            LEFT JOIN users creator ON d.created_by = creator.id
            LEFT JOIN users reviewer ON d.reviewed_by = reviewer.id
            WHERE d.status = ?
            ORDER BY d.updated_at DESC
        `, [status]);
        return rows;
    }

    // Obtener documentos creados por un usuario
    static async getByCreator(userId) {
        const [rows] = await db.query(`
            SELECT d.*, reviewer.full_name as reviewer_name
            FROM documents d
            LEFT JOIN users reviewer ON d.reviewed_by = reviewer.id
            WHERE d.created_by = ?
            ORDER BY d.updated_at DESC
        `, [userId]);
        return rows;
    }

    // Crear nuevo documento
    static async create(documentData) {
        const { code, title, description, type, version, status, file_path, created_by } = documentData;
        
        const [result] = await db.query(
            'INSERT INTO documents (code, title, description, type, version, status, file_path, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [code, title, description, type, version || '1.0', status || 'Borrador', file_path, created_by]
        );
        
        return result.insertId;
    }

    // Actualizar documento
    static async update(id, documentData) {
        const { title, description, type, file_path } = documentData;
        
        const [result] = await db.query(
            'UPDATE documents SET title = ?, description = ?, type = ?, file_path = ?, updated_at = NOW() WHERE id = ?',
            [title, description, type, file_path, id]
        );
        
        return result.affectedRows > 0;
    }

    // Actualizar estado del documento
    static async updateStatus(id, status, userId, userRole) {
        let query = 'UPDATE documents SET status = ?, updated_at = NOW()';
        let params = [status];
        
        // Asignar revisor o aprobador según el rol
        if (userRole === 'Revisor' || userRole === 'Aprobador') {
            if (status === 'Aprobado' || status === 'Rechazado') {
                query += ', reviewed_by = ?';
                params.push(userId);
            }
        }
        
        // Si es Admin revocando, limpiar aprobador
        if (userRole === 'Admin' && status === 'Borrador') {
            query += ', reviewed_by = NULL, approved_by = NULL';
        }
        
        query += ' WHERE id = ?';
        params.push(id);
        
        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    }

    // Actualizar versión del documento
    static async updateVersion(id, newVersion, filePath) {
        const [result] = await db.query(
            'UPDATE documents SET version = ?, file_path = ?, updated_at = NOW() WHERE id = ?',
            [newVersion, filePath, id]
        );
        
        return result.affectedRows > 0;
    }

    // Eliminar documento
    static async delete(id) {
        const [result] = await db.query('DELETE FROM documents WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    // Obtener estadísticas de documentos
    static async getStatistics() {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Borrador' THEN 1 ELSE 0 END) as borradores,
                SUM(CASE WHEN status = 'En Revision' THEN 1 ELSE 0 END) as en_revision,
                SUM(CASE WHEN status = 'Aprobado' THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN status = 'Rechazado' THEN 1 ELSE 0 END) as rechazados
            FROM documents
        `);
        return stats[0];
    }

    // Buscar documentos
    static async search(searchTerm) {
        const [rows] = await db.query(`
            SELECT 
                d.*,
                creator.full_name as creator_name
            FROM documents d
            LEFT JOIN users creator ON d.created_by = creator.id
            WHERE d.title LIKE ? OR d.code LIKE ? OR d.description LIKE ?
            ORDER BY d.updated_at DESC
        `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
        return rows;
    }
}

module.exports = Document;