const express = require('express');
const router = express.Router();
const mascotaController = require('../controllers/mascotaController');
const { verifyToken } = require('../middlewares/auth');
const { receiveBackupFile } = require('../middlewares/backupFile');
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento en memoria para Multer (subida directa a Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

// Configurar para recibir varios campos de archivos
const multiUpload = upload.fields([
  { name: 'imagen', maxCount: 1 },
  { name: 'fotosCartilla', maxCount: 5 }
]);

// Rutas base de mascotas
router.post('/', verifyToken, upload.single('imagen'), mascotaController.createMascota);
router.get('/', verifyToken, mascotaController.getMascotas);

// Rutas de copia de seguridad (importar antes de :id para evitar colisiones)
router.post('/import-backup', verifyToken, receiveBackupFile, mascotaController.importBackup);
router.get('/:id/backup', verifyToken, mascotaController.exportBackup);

// Rutas por ID
router.get('/:id', verifyToken, mascotaController.getMascotaById);
router.put('/:id', verifyToken, multiUpload, mascotaController.updateMascota);
router.delete('/:id', verifyToken, mascotaController.deleteMascota);
router.post('/:id/favorita', verifyToken, mascotaController.saveFavoriteClinic);

module.exports = router;
