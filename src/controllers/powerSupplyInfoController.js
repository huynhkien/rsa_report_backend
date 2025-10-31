const database = require('../config/database');
const sql = require('mssql');
const asyncHandler = require('express-async-handler');

// Hiển thị thông tin cppt02
const getPowerSupplyInfo = asyncHandler(async (req, res) => { 
    const page = req.query.page || 1;
    const limit = req.query.limit || 100;
    const offset = (page - 1) * limit;
    
    const pool = await database.getPool(); 
    
    const countResult = await pool.request().query(
        `SELECT COUNT(*) as total FROM PowerSupplyIn4  
        WHERE (YEAR(TIME) = 2025 AND MONTH(TIME) >= 10) OR YEAR(TIME) > 2025`
    );
    
    const result = await pool.request()
        .input('offset', sql.Int, offset)      
        .input('limit', sql.Int, limit)        
        .query(
            `SELECT * FROM PowerSupplyIn4  
            WHERE (YEAR(TIME) = 2025 AND MONTH(TIME) >= 10) OR YEAR(TIME) > 2025  
            ORDER BY TIME DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY`
        );
    
    return res.json({ 
        success: true,
        data: result.recordset,
        pagination: {
            totalCount: countResult.recordset[0].total,
            page: page,            
            limit: limit,           
            totalPages: Math.ceil(countResult.recordset[0].total / limit)
        }
    }); 
});
// Hiển thị chỉ số Cosphi < 0.9
const getPowerSupplyLt09Info = asyncHandler(async (req, res) => { 
    const page = req.query.page || 1;
    const limit = req.query.limit || 100;
    const offset = (page - 1) * limit;
    
    const pool = await database.getPool(); 
    
    const countResult = await pool.request().query(
        `SELECT COUNT(*) as total FROM PowerSupplyIn4  
        WHERE ((YEAR(TIME) = 2025 AND MONTH(TIME) >= 10) OR YEAR(TIME) > 2025) AND POWER_STATION_ABB_GLOBAL_RSF_MSB1_3_TRANS_cosphi_VALUE < 0.9`
    );
    
    const result = await pool.request()
        .input('offset', sql.Int, offset)      
        .input('limit', sql.Int, limit)        
        .query(
            `SELECT * FROM PowerSupplyIn4  
            WHERE ((YEAR(TIME) = 2025 AND MONTH(TIME) >= 10) OR YEAR(TIME) > 2025) AND POWER_STATION_ABB_GLOBAL_RSF_MSB1_3_TRANS_cosphi_VALUE < 0.9  
            ORDER BY TIME DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY`
        );
    
    return res.json({ 
        success: true,
        data: result.recordset,
        pagination: {
            totalCount: countResult.recordset[0].total,
            page: page,            
            limit: limit,           
            totalPages: Math.ceil(countResult.recordset[0].total / limit)
        }
    }); 
});
// Hiển thị chỉ số Cosphi >= 1.0
const getPowerSupplyGte1Info = asyncHandler(async (req, res) => { 
    const page = req.query.page || 1;
    const limit = req.query.limit || 100;
    const offset = (page - 1) * limit;
    
    const pool = await database.getPool(); 
    
    const countResult = await pool.request().query(
        `SELECT COUNT(*) as total FROM PowerSupplyIn4  
        WHERE ((YEAR(TIME) = 2025 AND MONTH(TIME) >= 10) OR YEAR(TIME) > 2025) AND POWER_STATION_ABB_GLOBAL_RSF_MSB1_3_TRANS_cosphi_VALUE >= 1`
    );
    
    const result = await pool.request()
        .input('offset', sql.Int, offset)      
        .input('limit', sql.Int, limit)        
        .query(
            `SELECT * FROM PowerSupplyIn4  
            WHERE ((YEAR(TIME) = 2025 AND MONTH(TIME) >= 10) OR YEAR(TIME) > 2025) AND POWER_STATION_ABB_GLOBAL_RSF_MSB1_3_TRANS_cosphi_VALUE >= 1  
            ORDER BY TIME DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY`
        );
    
    return res.json({ 
        success: true,
        data: result.recordset,
        pagination: {
            totalCount: countResult.recordset[0].total,
            page: page,            
            limit: limit,           
            totalPages: Math.ceil(countResult.recordset[0].total / limit)
        }
    }); 
});
module.exports = {
    getPowerSupplyInfo,
    getPowerSupplyLt09Info,
    getPowerSupplyGte1Info
}