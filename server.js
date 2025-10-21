const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Crear app de Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint temporal para crear usuario admin inicial
app.post('/api/setup-admin', async (req, res) => {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    try {
        // Verificar si ya existe admin
        const existingAdmin = await User.getByUsername('admin');
        if (existingAdmin) {
            return res.json({ 
                success: true,
                message: 'Admin ya existe',
                credentials: {
                    username: 'admin',
                    password: 'admin123'
                }
            });
        }

        // Crear admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const db = require('./config/database');
        
        await db.query(
            'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            ['admin', 'admin@docuflow.com', hashedPassword, 'Administrador del Sistema', 'Admin']
        );
        
        res.json({ 
            success: true, 
            message: 'Usuario admin creado exitosamente',
            credentials: {
                username: 'admin',
                password: 'admin123'
            }
        });
    } catch (error) {
        console.error('Error creando admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'API del Sistema de Gestión Documental',
        version: '1.0.0',
        status: 'running'
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Ruta no encontrada.' 
    });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Error en el servidor.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
app.listen(PORT, () => {
    console.log('===========================================');
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log('===========================================');
});