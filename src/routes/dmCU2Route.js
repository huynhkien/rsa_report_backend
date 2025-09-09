const dmCU2Controllers = require('../controllers/dmCU2Controller');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

router.route('/').get([verifyAccessToken, checkUserPermission],dmCU2Controllers.get_dmCU2s)
                 .post([verifyAccessToken, checkUserPermission],dmCU2Controllers.create_dmCU2);
router.route('/delete-dmCu2s').delete([verifyAccessToken, checkUserPermission], dmCU2Controllers.delete_dmCU2s);

router.route('/:id').get([verifyAccessToken, checkUserPermission],dmCU2Controllers.get_dmCU2)
                    .put([verifyAccessToken, checkUserPermission],dmCU2Controllers.edit_dmCU2)
                    .delete([verifyAccessToken, checkUserPermission],dmCU2Controllers.delete_dmCU2);


module.exports = router;