const express = require('express');
const router = express.Router();

const { getMyProfile } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/auth');
const { updateMyProfile } = require('../controllers/userController');

router.get('/me', verifyToken, getMyProfile);
router.put('/me', verifyToken, updateMyProfile);
router.delete('/me', verifyToken, require('../controllers/userController').deleteAccount);

module.exports = router;