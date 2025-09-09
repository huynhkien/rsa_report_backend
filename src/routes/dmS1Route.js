const dmS1Controllers = require('../controllers/dmS1Controller');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],dmS1Controllers.get_dmS1s)
                 .post([verifyAccessToken, checkUserPermission],dmS1Controllers.create_dmS1);
                 
router.route('/:id').get([verifyAccessToken, checkUserPermission],dmS1Controllers.get_dmS1)
                    .put([verifyAccessToken, checkUserPermission],dmS1Controllers.edit_dmS1)
                    .delete([verifyAccessToken, checkUserPermission],dmS1Controllers.delete_dmS1);
module.exports = router;