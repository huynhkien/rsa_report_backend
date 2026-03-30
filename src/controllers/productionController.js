const database = require('../config/database');
const sql = require('mssql');
const asyncHandler = require('express-async-handler');
const moment = require('moment');

// Thêm thông tin đợt sản xuất
const addProduction = asyncHandler(async(req, res) => {
    // Thông tin của đợt sản phẩm
    const {DOT_SX, ME_THU, MA_TB, TG_BD, TG_KT, TRUONG_CA, 
        NV_VH, LOAI_SP, KL_NL, KL_TP, KL_DONG, SO_LOT, TT_THAPTRANG, GHI_CHU_TT_THAPTRANG,
        TT_CHILLER, GHI_CHU_TT_CHILLER, TT_PRESSURE_MACHINE, GHI_CHU_TT_PRESSURE_MACHINE, TT_BOILER, 
        GHI_CHU_TT_BOILER, GHI_CHU, VT_PALLET, VT_PALLET_KL_DONG, VT_PALLET_BTP} = req.body;
    // Kiểm tra thông tin của đợt sản xuất
    if(!DOT_SX || !ME_THU || !MA_TB || !TG_BD || !TG_KT || !TRUONG_CA || !NV_VH || !LOAI_SP
        || !SO_LOT 
    ) throw new Error('Vui lòng nhập đầy đủ các thông tin cần thiết');
    const pool = database.getPool3();
    // Nhập dữ liệu 
    const result = await pool.request()
        .input('DOT_SX', sql.NVarChar, DOT_SX)
        .input('ME_THU', sql.NVarChar, ME_THU)
        .input('MA_TB', sql.NVarChar, MA_TB)
        .input('TG_BD', sql.DateTime, moment(TG_BD, 'YYYY-MM-DDTHH:mm:ss').toDate())
        .input('TG_KT', sql.DateTime, moment(TG_KT, 'YYYY-MM-DDTHH:mm:ss').toDate())
        .input('TRUONG_CA', sql.NVarChar, TRUONG_CA)
        .input('NV_VH', sql.NVarChar, NV_VH)
        .input('LOAI_SP', sql.NVarChar, LOAI_SP)
        .input('KL_NL', sql.NVarChar, KL_NL)
        .input('KL_TP', sql.NVarChar, KL_TP)
        .input('KL_DONG', sql.NVarChar, KL_DONG)
        .input('SO_LOT', sql.NVarChar(50), SO_LOT)
        .input('TT_THAPTRANG', sql.NVarChar, TT_THAPTRANG)
        .input('GHI_CHU_TT_THAPTRANG', sql.NVarChar, GHI_CHU_TT_THAPTRANG)
        .input('TT_CHILLER', sql.NVarChar, TT_CHILLER)
        .input('GHI_CHU_TT_CHILLER', sql.NVarChar, GHI_CHU_TT_CHILLER)
        .input('TT_PRESSURE_MACHINE', sql.NVarChar, TT_PRESSURE_MACHINE)
        .input('GHI_CHU_TT_PRESSURE_MACHINE', sql.NVarChar, GHI_CHU_TT_PRESSURE_MACHINE)
        .input('TT_BOILER', sql.NVarChar, TT_BOILER)
        .input('GHI_CHU_TT_BOILER', sql.NVarChar, GHI_CHU_TT_BOILER)
        .input('GHI_CHU', sql.NVarChar, GHI_CHU)
        .input('VT_PALLET', sql.NVarChar, VT_PALLET)
        .input('VT_PALLET_KL_DONG', sql.NVarChar, VT_PALLET_KL_DONG)
        .input('VT_PALLET_BTP', sql.NVarChar, VT_PALLET_BTP)
        .query(`
            INSERT INTO DataSX_RSF 
                (DOT_SX, ME_THU, MA_TB, TG_BD, TG_KT, TRUONG_CA, 
                    NV_VH, LOAI_SP, KL_NL, KL_TP, KL_DONG, SO_LOT, TT_THAPTRANG,
                    TT_CHILLER, TT_PRESSURE_MACHINE, TT_BOILER, GHI_CHU, VT_PALLET, 
                    VT_PALLET_KL_DONG, VT_PALLET_BTP, GHI_CHU_TT_THAPTRANG, GHI_CHU_TT_CHILLER, GHI_CHU_TT_PRESSURE_MACHINE, GHI_CHU_TT_BOILER)
            VALUES
                (@DOT_SX, @ME_THU, @MA_TB, @TG_BD, @TG_KT, @TRUONG_CA, 
                    @NV_VH, @LOAI_SP, @KL_NL, @KL_TP, @KL_DONG, @SO_LOT, @TT_THAPTRANG,
                    @TT_CHILLER, @TT_PRESSURE_MACHINE, @TT_BOILER, @GHI_CHU, @VT_PALLET, @VT_PALLET_KL_DONG, @VT_PALLET_BTP,
                     @GHI_CHU_TT_THAPTRANG, @GHI_CHU_TT_CHILLER, @GHI_CHU_TT_PRESSURE_MACHINE, @GHI_CHU_TT_BOILER)
            `);
    return res.status(200).json({
        success: true,
        message: 'Thêm thông tin đợt sản xuất thành công',
        rowsAffected: result.rowsAffected[0]
    });
});
// Cập nhật thông tin đơn sản xuất 
const updateProduction = asyncHandler(async(req, res) => {
    const {id} = req.params;
    // Thông tin của đợt sản phẩm
    const {DOT_SX, ME_THU, MA_TB, TG_BD, TG_KT, TRUONG_CA, 
        NV_VH, LOAI_SP, KL_NL, KL_TP, KL_DONG, SO_LOT, TT_THAPTRANG, GHI_CHU_TT_THAPTRANG,
        TT_CHILLER, GHI_CHU_TT_CHILLER, TT_PRESSURE_MACHINE, GHI_CHU_TT_PRESSURE_MACHINE, TT_BOILER, 
        GHI_CHU_TT_BOILER, GHI_CHU, VT_PALLET, VT_PALLET_KL_DONG, VT_PALLET_BTP} = req.body;
    if(!id) throw new Error('Không tìm thấy thông tin đợt sản xuất');
    // Kiểm tra thông tin của đợt sản xuất
    if(!DOT_SX || !ME_THU || !MA_TB || !TG_BD || !TG_KT || !TRUONG_CA || !NV_VH || !LOAI_SP
        || !SO_LOT 
    ) throw new Error('Vui lòng nhập đầy đủ các thông tin cần thiết');
    const pool = database.getPool3();
    // Nhập dữ liệu 
    const result = await pool.request()
        .input('DOT_SX', sql.NVarChar, DOT_SX)
        .input('ME_THU', sql.NVarChar, ME_THU)
        .input('MA_TB', sql.NVarChar, MA_TB)
        .input('TG_BD', sql.DateTime, moment(TG_BD, 'YYYY-MM-DDTHH:mm:ss').toDate())
        .input('TG_KT', sql.DateTime, moment(TG_KT, 'YYYY-MM-DDTHH:mm:ss').toDate())
        .input('TRUONG_CA', sql.NVarChar, TRUONG_CA)
        .input('NV_VH', sql.NVarChar, NV_VH)
        .input('LOAI_SP', sql.NVarChar, LOAI_SP)
        .input('KL_NL', sql.NVarChar, KL_NL)
        .input('KL_TP', sql.NVarChar, KL_TP)
        .input('KL_DONG', sql.NVarChar, KL_DONG)
        .input('SO_LOT', sql.NVarChar(50), SO_LOT)
        .input('TT_THAPTRANG', sql.NVarChar, TT_THAPTRANG)
        .input('GHI_CHU_TT_THAPTRANG', sql.NVarChar, GHI_CHU_TT_THAPTRANG)
        .input('TT_CHILLER', sql.NVarChar, TT_CHILLER)
        .input('GHI_CHU_TT_CHILLER', sql.NVarChar, GHI_CHU_TT_CHILLER)
        .input('TT_PRESSURE_MACHINE', sql.NVarChar, TT_PRESSURE_MACHINE)
        .input('GHI_CHU_TT_PRESSURE_MACHINE', sql.NVarChar, GHI_CHU_TT_PRESSURE_MACHINE)
        .input('TT_BOILER', sql.NVarChar, TT_BOILER)
        .input('GHI_CHU_TT_BOILER', sql.NVarChar, GHI_CHU_TT_BOILER)
        .input('GHI_CHU', sql.NVarChar, GHI_CHU)
        .input('VT_PALLET', sql.NVarChar, VT_PALLET)
        .input('VT_PALLET_KL_DONG', sql.NVarChar, VT_PALLET_KL_DONG)
        .input('VT_PALLET_BTP', sql.NVarChar, VT_PALLET_BTP)
        .query(`
            UPDATE DataSX_RSF 
            SET  
                DOT_SX = @DOT_SX, 
                ME_THU = @ME_THU,
                MA_TB = @MA_TB,
                TG_BD = @TG_BD,
                TG_KT = @TG_KT,
                TRUONG_CA = @TRUONG_CA,
                NV_VH = @NV_VH,
                LOAI_SP = @LOAI_SP,
                KL_NL = @KL_NL,
                KL_TP = @KL_TP,
                KL_DONG = @KL_DONG,
                TT_THAPTRANG = @TT_THAPTRANG,
                GHI_CHU_TT_THAPTRANG = @GHI_CHU_TT_THAPTRANG,
                TT_CHILLER = @TT_CHILLER,
                GHI_CHU_TT_CHILLER = @GHI_CHU_TT_CHILLER,
                TT_PRESSURE_MACHINE = @TT_PRESSURE_MACHINE,
                GHI_CHU_TT_PRESSURE_MACHINE = @GHI_CHU_TT_PRESSURE_MACHINE,
                TT_BOILER = @TT_BOILER,
                GHI_CHU_TT_BOILER = @GHI_CHU_TT_BOILER,
                GHI_CHU = @GHI_CHU,
                VT_PALLET = @VT_PALLET
                VT_PALLET_KL_DONG = @VT_PALLET_KL_DONG
                VT_PALLET_BTP = @VT_PALLET_BTP
            WHERE SO_LOT = @SO_LOT
            `);
    return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin đợt sản xuất thành công',
        rowsAffected: result.rowsAffected[0]
    })
})
// Hiển thị chi tiết thông tin đợt sản xuất 
const getProduction = asyncHandler(async(req, res) => {
    const {id} = req.params;
    if(!id) throw new Error('Không tìm thấy thông tin Id');
    const pool = await database.getPool3();
    // Lấy thông tin chi tiết
    const result = await pool.request()
                    .input('SO_LOT', sql.NVarChar(50), id)
                    .query(`
                        SELECT * 
                        FROM DataSX_RSF WHERE SO_LOT = @SO_LOT
                        `)
    if(result.recordset.length === 0) throw new Error('Không tìm thấy thông tin đợt sản xuất');
    return res.status(200).json({
        success: true,
        data: result.recordset[0]
    })
})
// Hiển thị thông tin đợt sản xuất
const getProductions = asyncHandler(async (req, res) => { 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    const { dotSX, meThu, maBTP, soLot, nvVH, truongCa, tuNgay, denNgay } = req.query;
    const pool = await database.getPool3();
    const buildWhere = (request) => {
        const conditions = [];
        if (dotSX) { conditions.push(`DOT_SX LIKE @dotSX`); request.input('dotSX', sql.NVarChar, `%${dotSX}%`); }
        if (meThu) { conditions.push(`ME_THU LIKE @meThu`); request.input('meThu', sql.NVarChar, `%${meThu}%`); }
        if (maBTP) { conditions.push(`MA_TP LIKE @maBTP`); request.input('maBTP', sql.NVarChar, `%${maBTP}%`); }
        if (soLot) { conditions.push(`SO_LOT LIKE @soLot`); request.input('soLot', sql.NVarChar, `%${soLot}%`); }
        if (nvVH) { conditions.push(`NV_VH LIKE @nvVH`); request.input('nvVH', sql.NVarChar, `%${nvVH}%`); }
        if (truongCa) { conditions.push(`TRUONG_CA LIKE @truongCa`);  request.input('truongCa', sql.NVarChar, `%${truongCa}%`); }
        if (tuNgay) { 
            conditions.push(`TG_BD >= @tuNgay`); 
            request.input('tuNgay', sql.DateTime, moment(tuNgay, 'YYYY-MM-DDTHH:mm:ss').toDate()); 
        }
        if (denNgay) { 
            conditions.push(`TG_BD <= @denNgay`); 
            request.input('denNgay', sql.DateTime, moment(denNgay, 'YYYY-MM-DDTHH:mm:ss').toDate()); 
        }
        return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    };

    // Request riêng cho COUNT
    const countReq = pool.request();
    const whereForCount = buildWhere(countReq);
    const countResult = await countReq.query(
        `SELECT COUNT(*) as total FROM DataSX_RSF ${whereForCount}`
    );

    // Request riêng cho SELECT
    const dataReq = pool.request()
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit);
    const whereForData = buildWhere(dataReq);
    const result = await dataReq.query(`
        SELECT * FROM DataSX_RSF
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
// Xóa thông tin đợt sản phẩm 
const deleteProduction = asyncHandler(async(req, res) => {
    const { id } = req.params;
    console.log(id)
    if(!id) throw new Error('Không tìm thấy thông tin đợt sản xuất');
    const pool = await database.getPool3();
    const result = await pool.request()
                    .input('SO_LOT', sql.NVarChar(50), id)
                    .query(`
                        DELETE FROM DataSX_RSF
                        WHERE SO_LOT = @SO_LOT
                        `);
    return res.status(200).json({
        success: true,
        message: 'Xóa thông tin đợt sản xuất thành công',
        rowsAffected: result.rowsAffected[0]
    })
})
module.exports = {
    addProduction,
    updateProduction,
    getProduction,
    getProductions,
    deleteProduction
}