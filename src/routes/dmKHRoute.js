const dmKHControllers = require('../controllers/dmKHController');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],dmKHControllers.get_dmKH);


module.exports = router;