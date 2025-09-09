const cpptControllers = require('../controllers/cpptController');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/02').get([verifyAccessToken, checkUserPermission], cpptControllers.get_cppt02);
router.route('/s1').get([verifyAccessToken, checkUserPermission], cpptControllers.get_cpptS1);


module.exports = router;