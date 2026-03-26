const database = require('../config/database');
const sql = require('mssql');
const asyncHandler = require('express-async-handler');
const moment = require('moment');
// Hiển thị thông tin sản xuất theo đợt sản xuất và mẻ
const getDataProduction = asyncHandler(async (req, res) => {
    const { dot_sx, me } = req.query;
    if (!dot_sx && !me) {
        throw new Error('Vui lòng cung cấp dot_sx hoặc me');
    }
    const pool = await database.getPool4();
    const request = pool.request();
    let conditions = [];
    if (dot_sx) {
        conditions.push('dot_sx = @dot_sx');
        request.input('dot_sx', sql.NVarChar(50), dot_sx);
    }
    if (me) {
        conditions.push('me = @me');
        request.input('me', sql.NVarChar(50), me);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await request.query(`
        SELECT * 
        FROM RSF_Production_data
        ${whereClause}
    `);
    if (result.recordset.length === 0) {
        throw new Error('Không tìm thấy dữ liệu');
    }
    return res.status(200).json({
        success: true,
        data: result.recordset
    });
});
// Hiển thị thông tin đợt sản xuất
const getDataProductions = asyncHandler(async (req, res) => { 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    const { tuNgay, denNgay } = req.query;
    const pool = await database.getPool4();
    const buildWhere = (request) => {
        const conditions = [];
        if (tuNgay) { 
            conditions.push(`ngay_sx >= @tuNgay`); 
            request.input('tuNgay', sql.DateTime, moment(tuNgay, 'YYYY-MM-DD').toDate()); 
        }
        if (denNgay) { 
            conditions.push(`ngay_sx <= @denNgay`); 
            request.input('denNgay', sql.DateTime, moment(denNgay, 'YYYY-MM-DD').toDate()); 
        }
        return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    };
    // Request riêng cho COUNT
    const countReq = pool.request();
    const whereForCount = buildWhere(countReq);
    const countResult = await countReq.query(
        `SELECT COUNT(*) as total FROM RSF_Production_data ${whereForCount}`
    );
    // Request riêng cho SELECT
    const dataReq = pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit);
    const whereForData = buildWhere(dataReq);
    const result = await dataReq.query(`
        SELECT * FROM RSF_Production_data
        ${whereForData}
        ORDER BY TG_BD DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
    `);
    return res.json({ 
        success: true,
        data: result.recordset,
        pagination: {
            totalCount: countResult.recordset[0].total,
            page, limit,
            totalPages: Math.ceil(countResult.recordset[0].total / limit)
        }
    }); 
});
module.exports = {
    getDataProduction,
    getDataProductions
}