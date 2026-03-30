const database = require('../config/database');
const sql = require('mssql');
const asyncHandler = require('express-async-handler');
const moment = require('moment');

const TIMESTAMP_COL = 'Siemens_System_COAT_100_V1_ACTIVE_PID_SAY_1_TIMESTAMP';
const TABLE_NAME = 'Coater03Resport';

// Helper: tạo request với timeout chuẩn
const createRequest = (pool, timeoutMs = 120000) => {
    const req = pool.request();
    req.timeout = timeoutMs;
    return req;
};
// Lọc theo khoảng thời gian
const filterCoaterS1s = asyncHandler(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(1000, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;
    const { date1, date2, polymerGMin } = req.query;

    if (!date1 || !date2) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập thời gian bắt đầu và kết thúc' });
    }
    const startTime = moment.utc(date1, 'YYYY-MM-DDTHH:mm:ss');
    const endTime   = moment.utc(date2, 'YYYY-MM-DDTHH:mm:ss');

    if (!startTime.isValid() || !endTime.isValid()) {
        return res.status(400).json({ success: false, message: 'Định dạng thời gian không hợp lệ. Dùng: YYYY-MM-DDTHH:mm:ss' });
    }
    if (startTime.isAfter(endTime)) {
        return res.status(400).json({ success: false, message: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc' });
    }
    if (endTime.diff(startTime, 'days') > 31) {
        return res.status(400).json({ success: false, message: 'Khoảng thời gian tối đa là 31 ngày' });
    }

    const pool = await database.getPool2();

    // Thêm điều kiện polymerGMin nếu có
    const polymerClause = polymerGMin !== undefined && polymerGMin !== ''
        ? `AND Siemens_System_COAT_100_V1_PV_POLYMER_G_MIN_VALUE > @polymerGMin`
        : '';

    const whereClause = `
        WHERE [${TIMESTAMP_COL}] BETWEEN @startTime AND @endTime
        ${polymerClause}
    `;

    // Hàm tạo request dùng chung
    const buildRequest = (pool) => {
        const req = createRequest(pool)
            .input('startTime', sql.DateTime, startTime.toDate())
            .input('endTime',   sql.DateTime, endTime.toDate());

        if (polymerGMin !== undefined && polymerGMin !== '') {
            req.input('polymerGMin', sql.Float, parseFloat(polymerGMin));
        }
        return req;
    };

    const [countResult, dataResult] = await Promise.all([
        buildRequest(pool).query(`
            SELECT COUNT(*) as total 
            FROM ${TABLE_NAME} WITH (NOLOCK)
            ${whereClause}
        `),
        buildRequest(pool)
            .input('offset', sql.Int, offset)
            .input('limit',  sql.Int, limit)
            .query(`
                SELECT * FROM ${TABLE_NAME} WITH (NOLOCK)
                ${whereClause}
                ORDER BY [${TIMESTAMP_COL}] ASC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `)
    ]);

    const total = countResult.recordset[0].total;

    return res.json({
        success: true,
        data: dataResult.recordset,
        pagination: {
            totalCount: total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
});

// Lấy danh sách cột
const getColumnCoaterS1s = asyncHandler(async (req, res) => {
    const pool = await database.getPool2();
    const result = await createRequest(pool)
        .query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${TABLE_NAME}'
            ORDER BY ORDINAL_POSITION
        `);

    return res.json({
        success: true,
        data: result.recordset
    });
});

module.exports = {
    filterCoaterS1s,
    getColumnCoaterS1s
};