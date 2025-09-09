const dmDGControllers = require('../controllers/dmDGController');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/hu').get([verifyAccessToken, checkUserPermission],dmDGControllers.get_dmDGHu);
router.route('/bich').get([verifyAccessToken, checkUserPermission],dmDGControllers.get_dmDGBich);
router.route('/tui').get([verifyAccessToken, checkUserPermission],dmDGControllers.get_dmDGTui);
router.route('/bao').get([verifyAccessToken, checkUserPermission],dmDGControllers.get_dmDGBao);
router.route('/bigbag').get([verifyAccessToken, checkUserPermission],dmDGControllers.get_dmDGBigBag);


module.exports = router;