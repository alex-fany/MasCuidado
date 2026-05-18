const express = require('express');
const router = express.Router();
const nutricionController = require('../controllers/nutricionController');
const { verifyToken } = require('../middlewares/auth');

// Todas las rutas de nutrición requieren autenticación
router.get('/eventos', verifyToken, nutricionController.getEventosNutricionales);
router.get('/:mascotaId/estado', verifyToken, nutricionController.getEstadoNutricional);
router.put('/:mascotaId/config', verifyToken, nutricionController.updateConfig);
router.post('/:mascotaId/compra', verifyToken, nutricionController.registrarCompra);
router.post('/:mascotaId/agua', verifyToken, nutricionController.registrarAgua);
router.put('/:mascotaId/compartir', verifyToken, nutricionController.actualizarCompartirActual);
router.delete('/:mascotaId/compartir/active', verifyToken, nutricionController.dejarDeCompartir);

module.exports = router;
