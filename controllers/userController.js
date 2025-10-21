const User = require('../models/User');

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        
        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.getById(id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado.' 
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Crear nuevo usuario (CRUD)
exports.createUser = async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;

        // Validar campos
        if (!username || !email || !password || !full_name || !role) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son requeridos.' 
            });
        }

        // Validar rol
        const validRoles = ['Admin', 'Creador', 'Revisor', 'Aprobador'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rol inválido.' 
            });
        }

        // Verificar si ya existe
        const existingUser = await User.getByUsername(username);
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: 'El nombre de usuario ya existe.' 
            });
        }

        const existingEmail = await User.getByEmail(email);
        if (existingEmail) {
            return res.status(409).json({ 
                success: false, 
                message: 'El email ya está registrado.' 
            });
        }

        // Crear usuario
        const userId = await User.create({ username, email, password, full_name, role });

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente.',
            userId
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, full_name, role, is_active } = req.body;

        // Verificar si el usuario existe
        const user = await User.getById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado.' 
            });
        }

        // Validar rol si se proporciona
        if (role) {
            const validRoles = ['Admin', 'Creador', 'Revisor', 'Aprobador'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Rol inválido.' 
                });
            }
        }

        // Actualizar usuario
        const updated = await User.update(id, { 
            username: username || user.username,
            email: email || user.email,
            full_name: full_name || user.full_name,
            role: role || user.role,
            is_active: is_active !== undefined ? is_active : user.is_active
        });

        if (!updated) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al actualizar usuario.' 
            });
        }

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente.'
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Eliminar usuario (soft delete)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir eliminar al propio usuario
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                message: 'No puedes eliminar tu propio usuario.' 
            });
        }

        // Verificar si el usuario existe
        const user = await User.getById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado.' 
            });
        }

        // Desactivar usuario
        const deleted = await User.delete(id);

        if (!deleted) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al eliminar usuario.' 
            });
        }

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente.'
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Obtener usuarios por rol
exports.getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;

        const validRoles = ['Admin', 'Creador', 'Revisor', 'Aprobador'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rol inválido.' 
            });
        }

        const users = await User.getByRole(role);

        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error('Error al obtener usuarios por rol:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};