const Notification = require('../models/Notification');

// Crear notificación cuando se envía documento a revisión
const notifyDocumentSentToReview = async (documentId, documentTitle, creatorId) => {
    try {
        const User = require('../models/User');
        
        // Obtener todos los revisores y aprobadores
        const reviewers = await User.getByRole('Revisor');
        const approvers = await User.getByRole('Aprobador');
        const admins = await User.getByRole('Admin');
        
        const usersToNotify = [...reviewers, ...approvers, ...admins];
        
        // Crear notificación para cada usuario (excepto el creador)
        for (const user of usersToNotify) {
            if (user.id !== creatorId && user.is_active) {
                await Notification.create({
                    user_id: user.id,
                    document_id: documentId,
                    type: 'documento_asignado',
                    title: 'Documento enviado a revisión',
                    message: `El documento "${documentTitle}" ha sido enviado a revisión y está pendiente de tu aprobación.`
                });
            }
        }
        
        console.log(`Notificaciones enviadas para documento: ${documentTitle}`);
    } catch (error) {
        console.error('Error creando notificaciones de revisión:', error);
    }
};

// Crear notificación cuando se aprueba documento
const notifyDocumentApproved = async (documentId, documentTitle, creatorId, approverName) => {
    try {
        await Notification.create({
            user_id: creatorId,
            document_id: documentId,
            type: 'documento_aprobado',
            title: '✅ Documento aprobado',
            message: `Tu documento "${documentTitle}" ha sido aprobado por ${approverName}.`
        });
        
        console.log(`Notificación de aprobación enviada al creador del documento: ${documentTitle}`);
    } catch (error) {
        console.error('Error creando notificación de aprobación:', error);
    }
};

// Crear notificación cuando se rechaza documento
const notifyDocumentRejected = async (documentId, documentTitle, creatorId, reviewerName, comments) => {
    try {
        await Notification.create({
            user_id: creatorId,
            document_id: documentId,
            type: 'documento_rechazado',
            title: '❌ Documento rechazado',
            message: `Tu documento "${documentTitle}" ha sido rechazado por ${reviewerName}. Comentarios: ${comments || 'Sin comentarios'}`
        });
        
        console.log(`Notificación de rechazo enviada al creador del documento: ${documentTitle}`);
    } catch (error) {
        console.error('Error creando notificación de rechazo:', error);
    }
};

// Crear notificación cuando se revoca aprobación
const notifyApprovalRevoked = async (documentId, documentTitle, creatorId, adminName, reason) => {
    try {
        await Notification.create({
            user_id: creatorId,
            document_id: documentId,
            type: 'aprobacion_revocada',
            title: '⚠️ Aprobacion Revocada',
            message: `La aprobación de tu documento "${documentTitle}" ha sido revocada por ${adminName}. Razón: ${reason}`
        });
        
        console.log(`Notificación de revocación enviada al creador del documento: ${documentTitle}`);
    } catch (error) {
        console.error('Error creando notificación de revocación:', error);
    }
};

module.exports = {
    notifyDocumentSentToReview,
    notifyDocumentApproved,
    notifyDocumentRejected,
    notifyApprovalRevoked
};