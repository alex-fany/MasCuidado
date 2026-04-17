const express = require('express');
const router = express.Router();
const { getMyProfile } = require('../controllers/userController');
const { verifyToken } = require('../middlewares/auth');


router.get('/me', verifyToken, getMyProfile);


module.exports = router;