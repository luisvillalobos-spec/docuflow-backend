const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'docuflow', // Carpeta en Cloudinary
        resource_type: 'auto', // Detecta automáticamente el tipo
        allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
        public_id: (req, file) => {
            // Nombre único para el archivo
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return uniqueSuffix + path.parse(file.originalname).name;
        }
    }
});

// Configurar Multer con Cloudinary
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        
        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF, Word, Excel y PowerPoint.'));
        }
    }
});

module.exports = { cloudinary, upload };