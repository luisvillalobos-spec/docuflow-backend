const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generar JWT
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validar campos
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Usuario y contraseña son requeridos.' 
            });
        }

        // Buscar usuario (puede ser username o email)
        let user = await User.getByUsername(username);
        
        if (!user) {
            user = await User.getByEmail(username);
        }

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales inválidas.' 
            });
        }

        // Verificar si el usuario está activo
        if (!user.is_active) {
            return res.status(403).json({ 
                success: false, 
                message: 'Usuario desactivado. Contacte al administrador.' 
            });
        }

        // Verificar contraseña
        const isValidPassword = await User.verifyPassword(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales inválidas.' 
            });
        }

        // Generar token
        const token = generateToken(user);

        // Responder con token y datos del usuario (sin contraseña)
        res.json({
            success: true,
            message: 'Login exitoso.',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Registro (solo Admin puede crear usuarios)
exports.register = async (req, res) => {
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

        // Verificar si el usuario ya existe
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
        console.error('Error en registro:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Obtener perfil del usuario autenticado
exports.getProfile = async (req, res) => {
    try {
        const user = await User.getById(req.user.id);

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
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Ambas contraseñas son requeridas.' 
            });
        }

        // Obtener usuario con contraseña
        const user = await User.getByUsername(req.user.username);

        // Verificar contraseña actual
        const isValidPassword = await User.verifyPassword(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Contraseña actual incorrecta.' 
            });
        }

        // Actualizar contraseña
        await User.updatePassword(req.user.id, newPassword);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente.'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};