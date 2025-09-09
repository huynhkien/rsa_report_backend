const dmSanNVLControllers = require('../controllers/dmSanNVLController');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],dmSanNVLControllers.get_dmSanNVL);


module.exports = router;