const database = require('../config/database');
const sql = require('mssql');
const asyncHandler = require('express-async-handler');
const moment = require('moment');

const TIMESTAMP_COL = 'Siemens_System_COAT_100_V1_ACTIVE_PID_SAY_1_TIMESTAMP';
const POLYMER_COL = 'Siemens_System_COAT_100_V1_PV_POLYMER_G_MIN_VALUE';
const TABLE_NAME = 'Coater03Resport';

//Tạo request với timeout chuẩn
const createRequest = (pool, timeoutMs = 120000) => {
    const req = pool.request();
    req.timeout = timeoutMs;
    return req;
};

// Log lỗi SQL chi tiết ra console
const logSqlError = (label, err, meta = {}) => {
    console.error(`\n===== [${label}] SQL ERROR =====`);
    console.error('message:', err.message);
    console.error('code:', err.code);
    console.error('number:', err.number);
    console.error('lineNumber:', err.lineNumber);
    console.error('class:', err.class);
    console.error('state:', err.state);
    console.error('meta:', JSON.stringify(meta, null, 2));
    if (err.originalError) {
        console.error('originalError:', err.originalError.message);
    }
    console.error('================================\n');
};

// Chạy 1 query gộp (SELECT * + COUNT(*) OVER()), tách kết quả thành {rows, total}
const runCombinedQuery = async (request, query) => {
    const result = await request.query(query);
    const rows = result.recordset;
    const total = rows.length > 0 ? rows[0].__total_count : 0;
    rows.forEach(r => delete r.__total_count);
    return { rows, total };
};
// Hiển thị dữ liệu tháp s1
const filterCoaterS1s = asyncHandler(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100000, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;
    const { date1, date2, polymerGMin, desc, sampleInterval } = req.query;
    const sample = parseInt(sampleInterval) || 0;
    console.log('[filterCoaterS1s] Query params:', { page, limit, date1, date2, polymerGMin, desc, sampleInterval });
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
        pool = await database.getPool2();
    } catch (err) {
        logSqlError('GET POOL', err);
        return res.status(500).json({ success: false, message: 'Không kết nối được cơ sở dữ liệu', detail: err.message });
    }

    const buildRequest = (pool) =>
        createRequest(pool)
            .input('startTime', sql.DateTime, startTime.toDate())
            .input('endTime',   sql.DateTime, endTime.toDate());

    const orderDir = desc ? 'DESC' : 'ASC';
    let totalCount, rows;

    try {
        // ===== Nếu lọc theo polymerGMin (cần LAG() trên toàn bộ khoảng thời gian) =====
        if (polymerGMin !== undefined && polymerGMin !== '') {
            // Bước lọc chỉ dùng id + timestamp + giá trị polymer (không SELECT * ở giai đoạn này)
            const polCTE = `
                WITH PolCTE AS (
                    SELECT
                        id,
                        [${TIMESTAMP_COL}] AS ts,
                        LAG(${POLYMER_COL}, 1, 0) OVER (ORDER BY [${TIMESTAMP_COL}]) AS prev_pol_value,
                        ${POLYMER_COL} AS pol_value
                    FROM ${TABLE_NAME} WITH (NOLOCK)
                    WHERE [${TIMESTAMP_COL}] BETWEEN @startTime AND @endTime
                ),
                PolFiltered AS (
                    SELECT id, ts FROM PolCTE
                    WHERE prev_pol_value = 0 AND pol_value > 0
                )
            `;

            if (sample > 0) {
                const fullCTE = `
                    ${polCTE},
                    Sampled AS (
                        SELECT id, ts,
                            ROW_NUMBER() OVER (
                                PARTITION BY DATEDIFF(SECOND, @startTime, ts) / @sampleInterval
                                ORDER BY ts
                            ) AS __row_num
                        FROM PolFiltered
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
                    ${polCTE}
                    SELECT t.*, COUNT(*) OVER() AS __total_count
                    FROM PolFiltered f
                    JOIN ${TABLE_NAME} t WITH (NOLOCK) ON t.id = f.id
                    ORDER BY f.ts ${orderDir}
                    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
                `));
            }
        // ===== Nếu không lọc theo polymerGMin =====
        } else {
            const whereClause = `WHERE [${TIMESTAMP_COL}] BETWEEN @startTime AND @endTime`;

            if (sample > 0) {
                // Giai đoạn lọc/lấy mẫu chỉ dùng id + timestamp để tận dụng index trên timestamp,
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
        logSqlError('FILTER COATER S1', err, {
            page, limit, date1, date2, polymerGMin, desc, sampleInterval,
            startTimeUTC: startTime.format(), endTimeUTC: endTime.format(),
        });
        return res.status(500).json({
            success: false,
            message: 'Lỗi truy vấn dữ liệu',
            // debug: err.message, 
        });
    }

    console.log(`[filterCoaterS1s] OK - total=${totalCount}, rows=${rows.length}`);

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
// Hiển thị thông tin cột
const getColumnCoaterS1s = asyncHandler(async (req, res) => {
    try {
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
    } catch (err) {
        logSqlError('GET COLUMN COATER S1', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách cột', detail: err.message });
    }
});

module.exports = {
    filterCoaterS1s,
    getColumnCoaterS1s
};