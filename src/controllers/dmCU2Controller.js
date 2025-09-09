const database = require('../config/database');
const sql = require('mssql');
const asyncHandler = require('express-async-handler');

// HIển thị thông tin
const get_dmCU2s = asyncHandler(async (req, res) => {
    const pool = await database.getPool();
    const result = await pool.request().query('SELECT * FROM DM_CU2_COPY');

    return res.status(200).json({
        success: true,
        data: result.recordset
    });
});
// Thêm thông tin
const create_dmCU2 = asyncHandler(async (req, res) => {
    const data = req.body; 

    const pool = database.getPool();
    const query = `
        INSERT INTO DM_CU2_COPY (
            Ten_btp, Ure, Dap, Kali_belarus, Kali_Sulfate, NHumate,
            Npk161616, Npk190919, Npk180818, Ca, Mg, N1, N2, N3, Black,
            Violet, Yellow, Red, Blue, Mautrang, Citric, Naoh, Solubor,
            Mn_edta, Zn_edta, Fe_edta, Cu_edta, Nh4, Prev, Supergap,
            Iaa, Iba, Pvas, Pva, Gut, Nbpt, Thancam, Dien, Ro, Thuycuc,
            Thoigian, Csthang, Hieusuat, Tong, Pvas20, Pva20
        ) VALUES (
            @Ten_btp, @Ure, @Dap, @Kali_belarus, @Kali_Sulfate, @NHumate,
            @Npk161616, @Npk190919, @Npk180818, @Ca, @Mg, @N1, @N2, @N3, @Black,
            @Violet, @Yellow, @Red, @Blue, @Mautrang, @Citric, @Naoh, @Solubor,
            @Mn_edta, @Zn_edta, @Fe_edta, @Cu_edta, @Nh4, @Prev, @Supergap,
            @Iaa, @Iba, @Pvas, @Pva, @Gut, @Nbpt, @Thancam, @Dien, @Ro, @Thuycuc,
            @Thoigian, @Csthang, @Hieusuat, @Tong, @Pvas20, @Pva20
        )
    `;

    const request = pool.request();

    // Gán dữ liệu JSON vào các parameter
    for (let key in data) {
        request.input(key, data[key]); 
    }

    await request.query(query);

    return res.status(200).json({
        success: true,
        message: 'Thêm thành công'
    })
});
// Hiển thị thông tin chi tiết
const get_dmCU2 = asyncHandler(async(req, res) => {
    const {id} = req.params;
    if(!id) throw new Error('Không tìm thất ID');
    const pool = database.getPool();
    const result = await pool.request()
                            .input('Id', sql.NVarChar, id)
                            .query(
                                `SELECT * 
                                FROM DM_CU2_COPY
                                WHERE Id = @Id `
                            );
    if(!result){
        return res.status(400).json({
            success: false,
            message: 'Không tìm thấy thông tin'
        })
    }
    return res.status(200).json({
        success: true,
        data: result.recordset[0]
    })
    
})
// Edit thông tin
const edit_dmCU2 = asyncHandler(async(req, res) => {
    const {id} = req.params;
    const {Id, ...data} = req.body;
    if(!id) throw new Error('Không tìm thấy ID!!!');
    const pool = database.getPool();
    // Tạo query tự động từ JSON
    let setQuery = [];
    for (let key in data) {
        setQuery.push(`${key} = @${key}`)
    }
    
    const query = `
        UPDATE DM_CU2_COPY
        SET ${setQuery.join(', ')}
        WHERE Id = @Id
    `;
    const request = pool.request();
    for (let key in data) {
        request.input(key, data[key]);
    }
    const result = await request.query(query);
    
    // Kiểm tra số rows được affected
    if(result.rowsAffected[0] === 0){
        return res.status(404).json({
            success: false,
            message: `Không tìm thấy bản ghi với ID: ${id}`
        })
    }

    return res.status(200).json({
        success: true,
        message: `Cập nhật thành công `,
        rowsAffected: result.rowsAffected[0],
        updatedColumns: Object.keys(data)
    });
});
// Xóa thông tin
const delete_dmCU2 = asyncHandler(async(req, res) => {
    const {id}= req.params;
    if(!id) throw new Error('Không tìm thấy ID!!!');
    const pool = database.getPool();
    const result = await pool.request()
                            .input('Id', sql.VarChar, id)
                            .query(`
                                DELETE *
                                FROM DM_CU2_COPY
                                WHERE Id = @Id
                                `);
    if(!result){
        return res.status(400).json({
            success: false,
            message: 'Xóa không thành công'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Xóa thành công'
    });
})
module.exports = {
    get_dmCU2s,
    get_dmCU2,
    create_dmCU2,
    edit_dmCU2,
    delete_dmCU2
}