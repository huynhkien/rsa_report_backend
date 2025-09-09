const giaVTDGControllers = require('../controllers/giaVTDGController');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],giaVTDGControllers.get_giaVTDG);

module.exports = router;