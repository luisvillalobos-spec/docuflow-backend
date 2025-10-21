// Middleware para verificar roles específicos
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no autenticado.' 
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para realizar esta acción.' 
            });
        }

        next();
    };
};

// Verificar si es Admin
const isAdmin = checkRole('Admin');

// Verificar si es Creador o Admin
const isCreatorOrAdmin = checkRole('Admin', 'Creador');

// Verificar si es Revisor o Admin
const isReviewerOrAdmin = checkRole('Admin', 'Revisor');

// Verificar si es Aprobador o Admin
const isApproverOrAdmin = checkRole('Admin', 'Aprobador');

module.exports = {
    checkRole,
    isAdmin,
    isCreatorOrAdmin,
    isReviewerOrAdmin,
    isApproverOrAdmin
};