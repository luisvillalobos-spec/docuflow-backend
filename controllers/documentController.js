const Document = require('../models/Document');
const DocumentHistory = require('../models/DocumentHistory');
const path = require('path');
const fs = require('fs');
const notificationHelper = require('../utils/notificationHelper');

// Obtener todos los documentos
exports.getAllDocuments = async (req, res) => {
    try {
        const documents = await Document.getAll();
        
        res.json({
            success: true,
            count: documents.length,
            documents
        });

    } catch (error) {
        console.error('Error al obtener documentos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Obtener documento por ID
exports.getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.getById(id);

        if (!document) {
            return res.status(404).json({ 
                success: false, 
                message: 'Documento no encontrado.' 
            });
        }

        // Obtener historial del documento
        const history = await DocumentHistory.getByDocumentId(id);

        res.json({
            success: true,
            document,
            history
        });

    } catch (error) {
        console.error('Error al obtener documento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Obtener documentos por estado
exports.getDocumentsByStatus = async (req, res) => {
    try {
        const { status } = req.params;

        const validStatuses = ['Borrador', 'En Revision', 'Aprobado', 'Rechazado', 'Obsoleto'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Estado inválido.' 
            });
        }

        const documents = await Document.getByStatus(status);

        res.json({
            success: true,
            count: documents.length,
            documents
        });

    } catch (error) {
        console.error('Error al obtener documentos por estado:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Obtener documentos creados por el usuario
exports.getMyDocuments = async (req, res) => {
    try {
        const documents = await Document.getByCreator(req.user.id);

        res.json({
            success: true,
            count: documents.length,
            documents
        });

    } catch (error) {
        console.error('Error al obtener mis documentos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Crear nuevo documento
exports.createDocument = async (req, res) => {
    try {
        const { code, title, description, type } = req.body;

        // LOG 1: Ver qué llega
        console.log('📝 Crear documento - Body:', req.body);
        console.log('📎 Archivo recibido:', req.file);

        // Validar campos
        if (!code || !title || !type) {
            return res.status(400).json({ 
                success: false, 
                message: 'Código, título y tipo son requeridos.' 
            });
        }

        // Validar tipo de documento
        const validTypes = ['Manual', 'Procedimiento', 'Instructivo', 'Politica', 'Formato', 'Otro'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tipo de documento inválido.' 
            });
        }

        // Verificar si hay archivo
        let filePath = null;
        if (req.file) {
            // Cloudinary devuelve la URL en req.file.path
            filePath = req.file.path;
            console.log('📎 Archivo subido a Cloudinary:', filePath);
            console.log('🔍 Objeto completo req.file:', JSON.stringify(req.file, null, 2));
        }

        // Crear documento
        console.log('💾 Guardando en base de datos...');
        const documentId = await Document.create({
            code,
            title,
            description,
            type,
            version: '1.0',
            status: 'Borrador',
            file_path: filePath,
            created_by: req.user.id
        });

        console.log('✅ Documento creado con ID:', documentId);

        // Registrar en historial
        await DocumentHistory.create({
            document_id: documentId,
            version: '1.0',
            action: 'Creado',
            comments: 'Documento creado',
            file_path: filePath,
            user_id: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Documento creado exitosamente.',
            documentId
        });

    } catch (error) {
        console.error('❌ Error al crear documento:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.',
            error: error.message // Agregar mensaje de error
        });
    }
};

// Actualizar documento
exports.updateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, type } = req.body;

        // Verificar que el documento existe
        const document = await Document.getById(id);
        if (!document) {
            return res.status(404).json({ 
                success: false, 
                message: 'Documento no encontrado.' 
            });
        }

        // Solo el creador o admin puede editar
        if (document.created_by !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para editar este documento.' 
            });
        }

        // Solo se pueden editar documentos en estado Borrador o Rechazado
        if (document.status !== 'Borrador' && document.status !== 'Rechazado') {
            return res.status(400).json({ 
                success: false, 
                message: 'Solo se pueden editar documentos en estado Borrador o Rechazado.' 
            });
        }

        // Verificar si hay nuevo archivo
        let filePath = document.file_path;
        if (req.file) {
            // Eliminar archivo anterior si existe
            if (document.file_path && fs.existsSync(document.file_path)) {
                fs.unlinkSync(document.file_path);
            }
            filePath = req.file.path;
        }

        // Actualizar documento
        const updated = await Document.update(id, {
            title: title || document.title,
            description: description || document.description,
            type: type || document.type,
            file_path: filePath
        });

        if (!updated) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al actualizar documento.' 
            });
        }

        // Registrar en historial
        await DocumentHistory.create({
            document_id: id,
            version: document.version,
            action: 'Modificado',
            comments: 'Documento actualizado',
            file_path: filePath,
            user_id: req.user.id
        });

        res.json({
            success: true,
            message: 'Documento actualizado exitosamente.'
        });

    } catch (error) {
        console.error('Error al actualizar documento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Cambiar estado del documento (enviar a revisión, aprobar, rechazar)
exports.changeDocumentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments } = req.body;

        // Validar estado
        const validStatuses = ['En Revision', 'Aprobado', 'Rechazado'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Estado inválido.' 
            });
        }

        // Obtener documento
        const document = await Document.getById(id);
        if (!document) {
            return res.status(404).json({ 
                success: false, 
                message: 'Documento no encontrado.' 
            });
        }

        // Validar permisos según el estado
        if (status === 'En Revision') {
            // Solo el creador puede enviar a revisión
            if (document.created_by !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Solo el creador puede enviar el documento a revisión.' 
                });
            }
        } else if (status === 'Aprobado' || status === 'Rechazado') {
            // Solo revisor o aprobador pueden aprobar/rechazar
            if (req.user.role !== 'Revisor' && req.user.role !== 'Aprobador' && req.user.role !== 'Admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No tienes permisos para realizar esta acción.' 
                });
            }
        }

        // Actualizar estado
        const updated = await Document.updateStatus(id, status, req.user.id, req.user.role);

        if (!updated) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al cambiar estado del documento.' 
            });
        }

        // Registrar en historial
        let action = '';
        if (status === 'En Revision') action = 'Enviado a Revisión';
        else if (status === 'Aprobado') action = 'Aprobado';
        else if (status === 'Rechazado') action = 'Rechazado';

        await DocumentHistory.create({
            document_id: id,
            version: document.version,
            action: action,
            comments: comments || '',
            file_path: document.file_path,
            user_id: req.user.id
        });

        // Generar notificaciones según el estado
        if (status === 'En Revision') {
            await notificationHelper.notifyDocumentSentToReview(id, document.title, document.created_by);
        } else if (status === 'Aprobado') {
            await notificationHelper.notifyDocumentApproved(id, document.title, document.created_by, req.user.full_name || req.user.username);
        } else if (status === 'Rechazado') {
            await notificationHelper.notifyDocumentRejected(id, document.title, document.created_by, req.user.full_name || req.user.username, comments);
        }

        res.json({
            success: true,
            message: `Documento ${status.toLowerCase()} exitosamente.`
        });

    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Crear nueva versión del documento
exports.createNewVersion = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener documento
        const document = await Document.getById(id);
        if (!document) {
            return res.status(404).json({ 
                success: false, 
                message: 'Documento no encontrado.' 
            });
        }

        // Solo se puede crear nueva versión de documentos aprobados
        if (document.status !== 'Aprobado') {
            return res.status(400).json({ 
                success: false, 
                message: 'Solo se puede crear nueva versión de documentos aprobados.' 
            });
        }

        // Verificar que hay archivo
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Debe subir un archivo para la nueva versión.' 
            });
        }

        // Incrementar versión
        const currentVersion = parseFloat(document.version);
        const newVersion = (currentVersion + 0.1).toFixed(1);

        // Actualizar documento
        await Document.updateVersion(id, newVersion, req.file.path);
        await Document.updateStatus(id, 'Borrador', req.user.id, req.user.role);

        // Registrar en historial
        await DocumentHistory.create({
            document_id: id,
            version: newVersion,
            action: 'Creado',
            comments: `Nueva versión ${newVersion} creada`,
            file_path: req.file.path,
            user_id: req.user.id
        });

        res.json({
            success: true,
            message: `Nueva versión ${newVersion} creada exitosamente.`,
            version: newVersion
        });

    } catch (error) {
        console.error('Error al crear nueva versión:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Eliminar documento
exports.deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener documento
        const document = await Document.getById(id);
        if (!document) {
            return res.status(404).json({ 
                success: false, 
                message: 'Documento no encontrado.' 
            });
        }

        // Solo el creador o admin puede eliminar
        if (document.created_by !== req.user.id && req.user.role !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'No tienes permisos para eliminar este documento.' 
            });
        }

        // Solo se pueden eliminar documentos en estado Borrador
        if (document.status !== 'Borrador') {
            return res.status(400).json({ 
                success: false, 
                message: 'Solo se pueden eliminar documentos en estado Borrador.' 
            });
        }

        // Eliminar archivo físico si existe
        if (document.file_path && fs.existsSync(document.file_path)) {
            fs.unlinkSync(document.file_path);
        }

        // Eliminar documento
        const deleted = await Document.delete(id);

        if (!deleted) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al eliminar documento.' 
            });
        }

        res.json({
            success: true,
            message: 'Documento eliminado exitosamente.'
        });

    } catch (error) {
        console.error('Error al eliminar documento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Obtener estadísticas
exports.getStatistics = async (req, res) => {
    try {
        const stats = await Document.getStatistics();

        res.json({
            success: true,
            statistics: stats
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Buscar documentos
exports.searchDocuments = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ 
                success: false, 
                message: 'Término de búsqueda requerido.' 
            });
        }

        const documents = await Document.search(query);

        res.json({
            success: true,
            count: documents.length,
            documents
        });

    } catch (error) {
        console.error('Error al buscar documentos:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Descargar documento
exports.downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.getById(id);
        if (!document) {
            return res.status(404).json({ 
                success: false, 
                message: 'Documento no encontrado.' 
            });
        }

        if (!document.file_path) {
            return res.status(404).json({ 
                success: false, 
                message: 'Archivo no encontrado.' 
            });
        }

        // Redirigir a la URL de Cloudinary
        res.redirect(document.file_path);

    } catch (error) {
        console.error('Error al descargar documento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Revocar aprobación (solo Admin)
exports.revokeApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Verificar que es Admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Solo el administrador puede revocar aprobaciones.' 
            });
        }

        // Validar que se proporcione una razón
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Debe proporcionar una razón para revocar la aprobación.' 
            });
        }

        // Obtener documento
        const document = await Document.getById(id);
        if (!document) {
            return res.status(404).json({ 
                success: false, 
                message: 'Documento no encontrado.' 
            });
        }

        // Verificar que el documento esté aprobado
        if (document.status !== 'Aprobado') {
            return res.status(400).json({ 
                success: false, 
                message: 'Solo se pueden revocar documentos aprobados.' 
            });
        }

        // Cambiar estado a Borrador
        const updated = await Document.updateStatus(id, 'Borrador', req.user.id, req.user.role);

        if (!updated) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al revocar aprobación.' 
            });
        }

        // Registrar en historial
        await DocumentHistory.create({
            document_id: id,
            version: document.version,
            action: 'Aprobacion Revocada',
            comments: `Razón: ${reason}`,
            file_path: document.file_path,
            user_id: req.user.id
        });

        // Notificar al creador del documento
        await notificationHelper.notifyApprovalRevoked(id, document.title, document.created_by, req.user.full_name || req.user.username, reason);

        res.json({
            success: true,
            message: 'Aprobacion Revocada exitosamente. El documento ha vuelto a estado Borrador.'
        });

    } catch (error) {
        console.error('Error al revocar aprobación:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};

// Obtener historial de un documento
exports.getDocumentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const history = await DocumentHistory.getByDocumentId(id);
        
        res.json({
            success: true,
            count: history.length,
            history
        });
        
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor.' 
        });
    }
};