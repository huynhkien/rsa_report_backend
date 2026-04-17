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
    const limit = Math.min(100000, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;
    const { date1, date2, polymerGMin, desc, sampleInterval } = req.query;
    const sample = parseInt(sampleInterval) || 0;

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

    const pool = await database.getPool2();

    const buildRequest = (pool) => {
        return createRequest(pool)
            .input('startTime', sql.DateTime, startTime.toDate())
            .input('endTime',   sql.DateTime, endTime.toDate());
    };

    const orderDir = desc ? 'DESC' : 'ASC';
    let countResult, dataResult;
    // Ghi nhận chỉ số lưu lượng bơm 
    if (polymerGMin !== undefined && polymerGMin !== '') {
        const polCTE = `
            WITH PolCTE AS (
                SELECT *,
                    LAG(Siemens_System_COAT_100_V1_PV_POLYMER_G_MIN_VALUE, 1, 0)
                    OVER (ORDER BY [${TIMESTAMP_COL}]) AS prev_pol_value
                FROM ${TABLE_NAME} WITH (NOLOCK)
                WHERE [${TIMESTAMP_COL}] BETWEEN @startTime AND @endTime
            ),
            FanFiltered AS (
                SELECT * FROM PolCTE
                WHERE prev_pol_value = 0
                  AND Siemens_System_COAT_100_V1_PV_POLYMER_G_MIN_VALUE > 0
            )
        `;

        if (sample > 0) {
            // fanWind + sampling
            const fullCTE = `
                ${polCTE},
                Sampled AS (
                    SELECT *,
                        ROW_NUMBER() OVER (
                            PARTITION BY DATEDIFF(SECOND, @startTime, [${TIMESTAMP_COL}]) / @sampleInterval
                            ORDER BY [${TIMESTAMP_COL}]
                        ) AS rn
                    FROM FanFiltered
                ),
                Final AS (SELECT * FROM Sampled WHERE rn = 1)
            `;

            [countResult, dataResult] = await Promise.all([
                buildRequest(pool)
                    .input('sampleInterval', sql.Int, sample)
                    .query(`${fullCTE} SELECT COUNT(*) as total FROM Final`),

                buildRequest(pool)
                    .input('sampleInterval', sql.Int, sample)
                    .input('offset', sql.Int, offset)
                    .input('limit',  sql.Int, limit)
                    .query(`
                        ${fullCTE}
                        SELECT * FROM Final
                        ORDER BY [${TIMESTAMP_COL}] ${orderDir}
                        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
                    `)
            ]);
        } else {
            [countResult, dataResult] = await Promise.all([
                buildRequest(pool)
                    .query(`${polCTE} SELECT COUNT(*) as total FROM FanFiltered`),

                buildRequest(pool)
                    .input('offset', sql.Int, offset)
                    .input('limit',  sql.Int, limit)
                    .query(`
                        ${polCTE}
                        SELECT * FROM FanFiltered
                        ORDER BY [${TIMESTAMP_COL}] ${orderDir}
                        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
                    `)
            ]);
        }
    // Nếu quạt hút chưa ghi nhận thông số
    } else {
        const whereClause = `WHERE [${TIMESTAMP_COL}] BETWEEN @startTime AND @endTime`;

        if (sample > 0) {
            // Sampling không fanWind
            const samplingCTE = `
                WITH Sampled AS (
                    SELECT *,
                        ROW_NUMBER() OVER (
                            PARTITION BY DATEDIFF(SECOND, @startTime, [${TIMESTAMP_COL}]) / @sampleInterval
                            ORDER BY [${TIMESTAMP_COL}]
                        ) AS rn
                    FROM ${TABLE_NAME} WITH (NOLOCK)
                    ${whereClause}
                ),
                Final AS (SELECT * FROM Sampled WHERE rn = 1)
            `;

            [countResult, dataResult] = await Promise.all([
                buildRequest(pool)
                    .input('sampleInterval', sql.Int, sample)
                    .query(`${samplingCTE} SELECT COUNT(*) as total FROM Final`),

                buildRequest(pool)
                    .input('sampleInterval', sql.Int, sample)
                    .input('offset', sql.Int, offset)
                    .input('limit',  sql.Int, limit)
                    .query(`
                        ${samplingCTE}
                        SELECT * FROM Final
                        ORDER BY [${TIMESTAMP_COL}] ${orderDir}
                        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
                    `)
            ]);
        } else {
            // Không sampling, không fanWind 
            [countResult, dataResult] = await Promise.all([
                buildRequest(pool)
                    .query(`
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
                        ORDER BY [${TIMESTAMP_COL}] ${orderDir}
                        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
                    `)
            ]);
        }
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