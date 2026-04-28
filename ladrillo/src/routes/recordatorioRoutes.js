const express = require('express');
const router = express.Router();
const recordatorioController = require('../controllers/recordatorioController');
const { verifyToken } = require('../middlewares/auth');

router.post('/', verifyToken, recordatorioController.createRecordatorio);
router.get('/', verifyToken, recordatorioController.getRecordatorios);
router.put('/:id', verifyToken, recordatorioController.updateRecordatorio);
router.delete('/:id', verifyToken, recordatorioController.deleteRecordatorio);

module.exports = router;
