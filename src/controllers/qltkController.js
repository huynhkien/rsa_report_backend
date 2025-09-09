const database = require('../config/database');
const sql = require('mssql');
const asyncHandler = require('express-async-handler');
const jwt = require ('jsonwebtoken');
const {generateAccessToken, generateRefreshToken} = require('../middleware/jwt');
const get_qltk = asyncHandler(async (req, res) => {
    const pool = await database.getPool();
    const result = await pool.request().query('SELECT * FROM QL_TK');

    return res.json({
        success: true,
        data: result.recordset
    });
});
// Đăng nhập tài khoản 
const login = asyncHandler(async (req, res) => {
    const pool = await database.getPool();
    const {Taikhoan, Matkhau} = req.body;
    if(!Taikhoan || !Matkhau) throw new Error('Thiếu thông tin đăng nhập hoặc mật khẩu!!!');
    console.log(Taikhoan, Matkhau);
    // Tìm thông tin người dùng
    existingLoginName = await pool.request()
        .input('TaiKhoan', sql.NVarChar, decodeURIComponent(Taikhoan.trim()))
        .query(
        `SELECT * 
        FROM QL_TK
        WHERE Taikhoan = @TaiKhoan`
        );
    const user = existingLoginName.recordset[0];
    if(!user) throw new Error('Không tìm thấy thông tin người dùng!!!');
    if(Matkhau != user.Matkhau) throw new Error('Mật khẩu không trùng khớp')
    // Tạo accessToken 
    const accessToken = generateAccessToken(user.Taikhoan, user.Quyen);
    const newRefreshToken = generateRefreshToken(user.Taikhoan);
    res.cookie('refreshToken', newRefreshToken, {httpOnly: true, secure: true,sameSite: 'none', maxAge: 1 * 24 * 60 *60 * 1000});
    res.cookie('accessToken', accessToken, {httpOnly: true, secure: true,sameSite: 'none', maxAge: 15 * 60 * 1000 });
    await await pool.request()
        .input('RefreshToken', sql.NVarChar, newRefreshToken)
        .input('TaiKhoan', sql.NVarChar, decodeURIComponent(Taikhoan.trim()))
        .query(
        `UPDATE QL_TK
        SET RefreshToken = @RefreshToken
        WHERE Taikhoan = @TaiKhoan
        `
    )
    const dataLogin = {
        Taikhoan: user.Taikhoan,
        Quyen: user.Quyen
    }
    return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        accessToken,
        data: dataLogin
    })

})
// Làm mới AccessToken
const refreshAccessToken = asyncHandler(async(req, res) => {
    const cookie = req.cookies;
    if(!cookie || !cookie.refreshToken) throw new Error('Không tìm thấy refreshToken');
    const decode = jwt.verify(cookie.refreshToken, process.env.JWT_SECRET);
    existingLoginName = await pool.request()
        .input('TaiKhoan', sql.NVarChar, decode._id)
        .query(
        `SELECT * 
        FROM QL_TK
        WHERE Taikhoan = @TaiKhoan`
        );
    const user = existingLoginName.recordset[0];
    if(!user) throw new Error('Không tìm thấy thông tin người dùng');
    // tao accessToken moi
    const accessToken = generateAccessToken(user?.Taikhoan, user?.Quyen);
    res.cookie('accessToken', accessToken, {httpOnly: true, secure: true,sameSite: 'none', maxAge: 15 * 60 * 1000 });
    return res.status(200).json({
        success: true,
        message: 'Làm mới AccessToken'
    })        
});
// Đăng xuất
const logout = asyncHandler(async(req, res) => {
    const cookie = req.cookies;
    if(!cookie) throw new Error('Không tìm thấy cookie');
    res.clearCookie('accessToken', {httpOnly: true, secure: true});
    res.clearCookie('refreshToken', {httpOnly: true, secure: true});
    return res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công'
    })
})
// Hiển thị thông tin tài khoản hiện tại
const getQlTkCurrent = asyncHandler(async(req, res) => {
    const {_id} = req.user;
    existingLoginName = await pool.request()
        .input('TaiKhoan', sql.NVarChar, _id)
        .query(
        `SELECT * 
        FROM QL_TK
        WHERE Taikhoan = @TaiKhoan`
        );
    const user = existingLoginName.recordset[0];
    if(!user) throw new Error('Không tìm thấy thông tin người dùng');
    return res.status(200).json({
        success: true,
        data: user
    });
})
module.exports = {
    get_qltk,
    login,
    logout,
    refreshAccessToken,
    getQlTkCurrent
}