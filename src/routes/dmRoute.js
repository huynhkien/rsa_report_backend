const dmControllers = require('../controllers/dmController');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/nvl').get([verifyAccessToken, checkUserPermission],dmControllers.get_dsNVL);
router.route('/vtdg').get([verifyAccessToken, checkUserPermission],dmControllers.get_dsVTDG);
router.route('/ct').get([verifyAccessToken, checkUserPermission],dmControllers.get_dsCONGTHUC);

router.route('/detail-ct').get([verifyAccessToken, checkUserPermission],dmControllers.get_dsCTDetail);


module.exports = router;