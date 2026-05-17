const express = require('express');
const router = express.Router();
const mascotaController = require('../controllers/mascotaController');
const { verifyToken } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'mascota-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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

// Rutas actualizadas con soporte para archivo 'imagen'
router.post('/', verifyToken, upload.single('imagen'), mascotaController.createMascota);
router.get('/', verifyToken, mascotaController.getMascotas);
router.get('/:id', verifyToken, mascotaController.getMascotaById);
router.put('/:id', verifyToken, multiUpload, mascotaController.updateMascota);
router.delete('/:id', verifyToken, mascotaController.deleteMascota);
router.post('/:id/favorita', verifyToken, mascotaController.saveFavoriteClinic);

module.exports = router;
