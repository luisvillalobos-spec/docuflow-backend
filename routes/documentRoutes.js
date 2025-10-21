const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authenticateToken = require('../middleware/auth');
const { isCreatorOrAdmin, isAdmin } = require('../middleware/roleCheck');
const multer = require('multer');
const path = require('path');

// Configurar Multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF, Word, Excel y PowerPoint.'));
        }
    }
});

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas generales
router.get('/', documentController.getAllDocuments);
router.get('/statistics', documentController.getStatistics);
router.get('/search', documentController.searchDocuments);
router.get('/my-documents', documentController.getMyDocuments);
router.get('/status/:status', documentController.getDocumentsByStatus);
router.get('/:id/history', documentController.getDocumentHistory);
router.get('/:id/download', documentController.downloadDocument);
router.get('/:id', documentController.getDocumentById);

// Rutas para creadores
router.post('/', isCreatorOrAdmin, upload.single('file'), documentController.createDocument);
router.put('/:id', isCreatorOrAdmin, upload.single('file'), documentController.updateDocument);
router.delete('/:id', isCreatorOrAdmin, documentController.deleteDocument);
router.post('/:id/new-version', isCreatorOrAdmin, upload.single('file'), documentController.createNewVersion);

// Rutas para cambiar estado
router.patch('/:id/status', documentController.changeDocumentStatus);

// Ruta para revocar aprobación (solo Admin)
router.post('/:id/revoke', isAdmin, documentController.revokeApproval);

module.exports = router;