const database = require('../config/database');
const sql = require('mssql');
const asyncHandler = require('express-async-handler');
const moment = require('moment');

const TIMESTAMP_COL = 'Siemens_System_COAT2_DB101_COATING_RATE_COATING_RATE_01_TIMESTAMP';
const FAN_COL = 'Siemens_System_COAT2_DB20_ATV212_CONTROL_MODBUS_FAN_WIND_PV_FREQ_VALUE';
const TABLE_NAME = 'Coater02_Resport';

// Tạo request với timeout chuẩn
const createRequest = (pool, timeoutMs = 120000) => {
    const req = pool.request();
    req.timeout = timeoutMs;
    return req;
};

// Log
const logSqlError = (context, err, meta = {}) => {
    console.error(`\n===== [SQL ERROR] ${context} =====`);
    console.error('Message :', err.message);
    console.error('Code    :', err.code);
    console.error('Number  :', err.number);
    console.error('LineNum :', err.lineNumber);
    console.error('State   :', err.state);
    console.error('Meta    :', JSON.stringify(meta, null, 2));
    console.error('Stack   :', err.stack);
    console.error('=====================================\n');
};

// chạy 1 query gộp (SELECT * + COUNT(*) OVER()), tách kết quả thành {rows, total}
const runCombinedQuery = async (request, query) => {
    const result = await request.query(query);
    const rows = result.recordset;
    const total = rows.length > 0 ? rows[0].__total_count : 0;
    rows.forEach(r => delete r.__total_count);
    return { rows, total };
};
// Lọc theo khoảng thời gian
const filterCoater02s = asyncHandler(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100000, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;
    const { date1, date2, fanWind, desc, sampleInterval } = req.query;
    const sample = parseInt(sampleInterval) || 0; // giây, 0 = không lấy mẫu

    console.log('[filterCoater02s] Query params:', { page, limit, date1, date2, fanWind, desc, sampleInterval });

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

    let pool;
    try {
        pool = await database.getPool1();
    } catch (err) {
        logSqlError('getPool1()', err);
        return res.status(500).json({ success: false, message: 'Lỗi kết nối cơ sở dữ liệu', detail: err.message });
    }

    const buildRequest = (pool) =>
        createRequest(pool)
            .input('startTime', sql.DateTime, startTime.toDate())
            .input('endTime',   sql.DateTime, endTime.toDate());

    const orderDir = desc ? 'DESC' : 'ASC';
    let totalCount, rows;

    try {
        // ===== Nếu quạt hút ghi nhận thông số =====
        if (fanWind !== undefined && fanWind !== '') {
            const fanCTE = `
                WITH FanCTE AS (
                    SELECT
                        id,
                        [${TIMESTAMP_COL}] AS ts,
                        ${FAN_COL} AS fan_value,
                        LAG(${FAN_COL}, 1, 0) OVER (ORDER BY [${TIMESTAMP_COL}]) AS prev_fan_value
                    FROM ${TABLE_NAME} WITH (NOLOCK)
                    WHERE [${TIMESTAMP_COL}] BETWEEN @startTime AND @endTime
                ),
                FanFiltered AS (
                    SELECT id, ts FROM FanCTE
                    WHERE prev_fan_value = 0 AND fan_value > 0
                )
            `;

            if (sample > 0) {
                const fullCTE = `
                    ${fanCTE},
                    Sampled AS (
                        SELECT id, ts,
                            ROW_NUMBER() OVER (
                                PARTITION BY DATEDIFF(SECOND, @startTime, ts) / @sampleInterval
                                ORDER BY ts
                            ) AS __row_num
                        FROM FanFiltered
                    ),
                    FinalIds AS (SELECT id, ts FROM Sampled WHERE __row_num = 1)
                `;

                const request = buildRequest(pool)
                    .input('sampleInterval', sql.Int, sample)
                    .input('offset', sql.Int, offset)
                    .input('limit',  sql.Int, limit);

                ({ rows, total: totalCount } = await runCombinedQuery(request, `
                    ${fullCTE}
                    SELECT t.*, COUNT(*) OVER() AS __total_count
                    FROM FinalIds f
                    JOIN ${TABLE_NAME} t WITH (NOLOCK) ON t.id = f.id
                    ORDER BY f.ts ${orderDir}
                    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
                `));
            } else {
                const request = buildRequest(pool)
                    .input('offset', sql.Int, offset)
                    .input('limit',  sql.Int, limit);

                ({ rows, total: totalCount } = await runCombinedQuery(request, `
                    ${fanCTE}
                    SELECT t.*, COUNT(*) OVER() AS __total_count
                    FROM FanFiltered f
                    JOIN ${TABLE_NAME} t WITH (NOLOCK) ON t.id = f.id
                    ORDER BY f.ts ${orderDir}
                    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
                `));
            }
        // ===== Nếu quạt hút chưa ghi nhận thông số =====
        } else {
            const whereClause = `WHERE [${TIMESTAMP_COL}] BETWEEN @startTime AND @endTime`;

            if (sample > 0) {
                // Giai đoạn lọc/lấy mẫu chỉ dùng id + timestamp => tận dụng index IX_Coater02_Timestamp,
                const samplingCTE = `
                    WITH Sampled AS (
                        SELECT
                            id,
                            [${TIMESTAMP_COL}] AS ts,
                            ROW_NUMBER() OVER (
                                PARTITION BY DATEDIFF(SECOND, @startTime, [${TIMESTAMP_COL}]) / @sampleInterval
                                ORDER BY [${TIMESTAMP_COL}]
                            ) AS __row_num
                        FROM ${TABLE_NAME} WITH (NOLOCK)
                        ${whereClause}
                    ),
                    FinalIds AS (SELECT id, ts FROM Sampled WHERE __row_num = 1)
                `;

                const request = buildRequest(pool)
                    .input('sampleInterval', sql.Int, sample)
                    .input('offset', sql.Int, offset)
                    .input('limit',  sql.Int, limit);

                ({ rows, total: totalCount } = await runCombinedQuery(request, `
                    ${samplingCTE}
                    SELECT t.*, COUNT(*) OVER() AS __total_count
                    FROM FinalIds f
                    JOIN ${TABLE_NAME} t WITH (NOLOCK) ON t.id = f.id
                    ORDER BY f.ts ${orderDir}
                    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
                `));
            } else {
                const idCTE = `
                    WITH FilteredIds AS (
                        SELECT
                            id,
                            [${TIMESTAMP_COL}] AS ts,
                            COUNT(*) OVER() AS __total_count
                        FROM ${TABLE_NAME} WITH (NOLOCK)
                        ${whereClause}
                    )
                `;

                const request = buildRequest(pool)
                    .input('offset', sql.Int, offset)
                    .input('limit',  sql.Int, limit);

                ({ rows, total: totalCount } = await runCombinedQuery(request, `
                    ${idCTE}
                    SELECT t.*, f.__total_count
                    FROM FilteredIds f
                    JOIN ${TABLE_NAME} t WITH (NOLOCK) ON t.id = f.id
                    ORDER BY f.ts ${orderDir}
                    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
                `));
            }
        }
    } catch (err) {
        logSqlError('filterCoater02s query', err, {
            page, limit, date1, date2, fanWind, desc, sampleInterval,
            startTimeUTC: startTime.format(), endTimeUTC: endTime.format(),
        });
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi truy vấn dữ liệu',
            // detail: err.message, 
        });
    }

    console.log(`[filterCoater02s] OK - total=${totalCount}, rows=${rows.length}`);

    return res.json({
        success: true,
        data: rows,
        pagination: {
            totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    });
});

// Lấy danh sách cột
const getColumnCoater02s = asyncHandler(async (req, res) => {
    try {
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
    } catch (err) {
        logSqlError('getColumnCoater02s', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách cột', detail: err.message });
    }
});

module.exports = {
    filterCoater02s,
    getColumnCoater02s
};