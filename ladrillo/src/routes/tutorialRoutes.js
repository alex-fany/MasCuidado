const router = require('express').Router();
const { verifyToken } = require('../middlewares/auth');
const { createTutorialController } = require('../controllers/tutorialController');
const controller = createTutorialController(require('../config/prisma'));

router.use(verifyToken);
router.get('/', controller.get);
router.put('/:tourId', controller.complete);
router.delete('/', controller.reset);

module.exports = router;
