const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Acceso denegado. Token no proporcionado.' 
        });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Token inválido o expirado.' 
            });
        }

        // Agregar información del usuario a la request
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;