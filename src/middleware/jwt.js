const jwt = require ('jsonwebtoken');
const asyncHandler = require('express-async-handler');
// Hàm tạo accessToken
const generateAccessToken =  (uid, role) => {
    return jwt.sign({_id: uid, role}, process.env.JWT_SECRET, {expiresIn: '7d'});
}

// Hàm tạo refreshToken
const generateRefreshToken = (uid) => {
    return jwt.sign({_id: uid}, process.env.JWT_SECRET, {expiresIn: '7d'});
}
// Xác thực accessToken
const verifyAccessToken = asyncHandler(async(req, res, next) => {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    
    if(authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        // Kiểm tra token có tồn tại không
        if(!token) {
            return res.status(401).json({
                success: false,
                message: 'Token không tồn tại'
            });
        }
        jwt.verify(token, process.env.JWT_SECRET, (error, decode) => {
            if(error) {
                console.log('JWT Error:', error.message); 
                return res.status(401).json({
                    success: false,
                    message: 'AccessToken không hợp lệ',
                    error: error.message
                });
            }
            req.user = decode;
            next();
        });
    } else {
        return res.status(401).json({
            success: false,
            message: 'Yêu cầu xác thực'
        });
    }
});

// Kiểm tra quyền của người dùng
const checkUserPermission = asyncHandler(async(req, res, next) => {
    const {role} = req.user;
    if(+role === 1 || +role === 0){ 
        next();
    } else {
        return res.status(401).json({
            success: false,
            message: 'Bạn không có quyền thao tác'
        });
    }
})

module.exports = {
    generateAccessToken, 
    generateRefreshToken,
    verifyAccessToken,
    checkUserPermission
};