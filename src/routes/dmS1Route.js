const dmS1Controllers = require('../controllers/dmS1Controller');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],dmS1Controllers.get_dmS1);


module.exports = router;