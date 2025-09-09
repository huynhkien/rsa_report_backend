const giaCU2Controllers = require('../controllers/giaCU2Controller');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],giaCU2Controllers.get_giaCU2);

module.exports = router;