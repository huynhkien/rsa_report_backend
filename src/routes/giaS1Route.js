const giaS1Controllers = require('../controllers/giaS1Controller');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],giaS1Controllers.get_giaS1);

module.exports = router;