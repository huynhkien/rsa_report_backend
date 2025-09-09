const priceVNDControllers = require('../controllers/priceVNDController');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],priceVNDControllers.get_priceVND)

module.exports = router;