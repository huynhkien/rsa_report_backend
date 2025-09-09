const giaNVLControllers = require('../controllers/giaNVLController');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],giaNVLControllers.get_giaNVL);

module.exports = router;