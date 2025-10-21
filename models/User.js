const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Obtener todos los usuarios
    static async getAll() {
        const [rows] = await db.query(
            'SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    }

    // Obtener usuario por ID
    static async getById(id) {
        const [rows] = await db.query(
            'SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    // Obtener usuario por email (para login)
    static async getByEmail(email) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    // Obtener usuario por username (para login)
    static async getByUsername(username) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0];
    }

    // Crear nuevo usuario
    static async create(userData) {
        const { username, email, password, full_name, role } = userData;
        
        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, role]
        );
        
        return result.insertId;
    }

    // Actualizar usuario
    static async update(id, userData) {
        const { username, email, full_name, role, is_active } = userData;
        
        const [result] = await db.query(
            'UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, is_active = ? WHERE id = ?',
            [username, email, full_name, role, is_active, id]
        );
        
        return result.affectedRows > 0;
    }

    // Actualizar contraseña
    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const [result] = await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        
        return result.affectedRows > 0;
    }

    // Eliminar usuario (soft delete - desactivar)
    static async delete(id) {
        const [result] = await db.query(
            'UPDATE users SET is_active = FALSE WHERE id = ?',
            [id]
        );
        
        return result.affectedRows > 0;
    }

    // Verificar contraseña
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Obtener usuarios por rol
    static async getByRole(role) {
        const [rows] = await db.query(
            'SELECT id, username, email, full_name, role, is_active FROM users WHERE role = ? AND is_active = TRUE',
            [role]
        );
        return rows;
    }
}

module.exports = User;