const database = require('../config/database');
const sql = require('mssql');
const asyncHandler = require('express-async-handler');
const moment = require('moment');

const TIMESTAMP_COL = 'Siemens_System_COAT2_DB101_COATING_RATE_COATING_RATE_01_TIMESTAMP';
const TABLE_NAME = 'Coater02_Resport';

// Helper: tạo request với timeout chuẩn
const createRequest = (pool, timeoutMs = 120000) => {
    const req = pool.request();
    req.timeout = timeoutMs;
    return req;
};
// Lọc theo khoảng thời gian
const filterCoater02s = asyncHandler(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100000, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;
    const { date1, date2, fanWind } = req.query;

    if (!date1 || !date2) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập thời gian bắt đầu và kết thúc' });
    }
    const startTime = moment.utc(date1, 'YYYY-MM-DDTHH:mm:ss');
    const endTime   = moment.utc(date2, 'YYYY-MM-DDTHH:mm:ss');

    if (!startTime.isValid() || !endTime.isValid()) {
        return res.status(400).json({ success: false, message: 'Định dạng thời gian không hợp lệ.' });
    }
    if (startTime.isAfter(endTime)) {
        return res.status(400).json({ success: false, message: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc' });
    }
    if (endTime.diff(startTime, 'days') > 31) {
        return res.status(400).json({ success: false, message: 'Khoảng thời gian tối đa là 31 ngày' });
    }

    const pool = await database.getPool1();

    const buildRequest = (pool) => {
        return createRequest(pool)
            .input('startTime', sql.DateTime, startTime.toDate())
            .input('endTime',   sql.DateTime, endTime.toDate());
    };

    let countResult, dataResult;

    if (fanWind !== undefined && fanWind !== '') {
        const cteQuery = `
            WITH CTE AS (
                SELECT *,
                    LAG(Siemens_System_COAT2_DB20_ATV212_CONTROL_MODBUS_FAN_WIND_PV_FREQ_VALUE, 1, 0)
                    OVER (ORDER BY [${TIMESTAMP_COL}]) AS prev_fan_value
                FROM ${TABLE_NAME} WITH (NOLOCK)
                WHERE [${TIMESTAMP_COL}] BETWEEN @startTime AND @endTime
            )
            SELECT * FROM CTE
            WHERE prev_fan_value = 0
              AND Siemens_System_COAT2_DB20_ATV212_CONTROL_MODBUS_FAN_WIND_PV_FREQ_VALUE > 0
        `;

        [countResult, dataResult] = await Promise.all([
            buildRequest(pool).query(`
                WITH CTE AS (
                    SELECT *,
                        LAG(Siemens_System_COAT2_DB20_ATV212_CONTROL_MODBUS_FAN_WIND_PV_FREQ_VALUE, 1, 0)
                        OVER (ORDER BY [${TIMESTAMP_COL}]) AS prev_fan_value
                    FROM ${TABLE_NAME} WITH (NOLOCK)
                    WHERE [${TIMESTAMP_COL}] BETWEEN @startTime AND @endTime
                )
                SELECT COUNT(*) as total FROM CTE
                WHERE prev_fan_value = 0
                  AND Siemens_System_COAT2_DB20_ATV212_CONTROL_MODBUS_FAN_WIND_PV_FREQ_VALUE > 0
            `),
            buildRequest(pool)
                .input('offset', sql.Int, offset)
                .input('limit',  sql.Int, limit)
                .query(`
                    ${cteQuery}
                    ORDER BY [${TIMESTAMP_COL}] ASC
                    OFFSET @offset ROWS
                    FETCH NEXT @limit ROWS ONLY
                `)
        ]);
    } else {
        // Không có fanWind → lấy tất cả bình thường
        const whereClause = `WHERE [${TIMESTAMP_COL}] BETWEEN @startTime AND @endTime`;

        [countResult, dataResult] = await Promise.all([
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
    }

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
const getColumnCoater02s = asyncHandler(async (req, res) => {
    const pool = await database.getPool1();
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
    filterCoater02s,
    getColumnCoater02s
};