const qltkControllers = require('../controllers/qltkController');
const express = require('express');
const router = express.Router();
const {verifyAccessToken, checkUserPermission} = require('../middleware/jwt')

// Hiển thị thông tin
router.route('/').get(qltkControllers.get_qltk);
// Đăng nhập
router.route('/login').post(qltkControllers.login);
// Đăng xuất
router.route('/logout').get(qltkControllers.logout);
// Tạo mới accessToken
router.route('/newRefreshToken').get([verifyAccessToken, checkUserPermission],qltkControllers.refreshAccessToken);
// Hiển thị thông tin đăng nhập
router.route('/getQltkCurrent').get([verifyAccessToken, checkUserPermission], qltkControllers.getQlTkCurrent)

module.exports = router;