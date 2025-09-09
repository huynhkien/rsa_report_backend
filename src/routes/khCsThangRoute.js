const khCsThangControllers = require('../controllers/khCsThangController');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],khCsThangControllers.get_khCsThang)

module.exports = router;