const sql = require('mssql');
const config = require('./index');

let pool;
let pool1;
let pool2;
let pool3;
async function ConnectDatabase() {
    try {
        // Database - Năng lượng điện
        pool = await new sql.ConnectionPool({
            user: config.db_login.key,
            password: config.db_password.key,
            server: config.db_server.key,
            database: config.db_name.key,
            options: {
                encrypt: false,
                trustServerCertificate: true
            },
            requestTimeout: 60000,  
            connectionTimeout: 30000,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        }).connect();
        // Database 1 - Chỉ só tháp 1000KG
        pool1 = await new sql.ConnectionPool({
            user: config.db_login.key,
            password: config.db_password.key,
            server: config.db_server.key,
            database: config.db_name1.key,
            options: {
                encrypt: false,
                trustServerCertificate: true
            },
            requestTimeout: 60000,  
            connectionTimeout: 30000,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        }).connect();
        // Database 2 - Chỉ số tháp 100KG
        pool2 = await new sql.ConnectionPool({
            user: config.db_login.key,
            password: config.db_password.key,
            server: config.db_server.key,
            database: config.db_name2.key,
            options: {
                encrypt: false,
                trustServerCertificate: true
            },
            requestTimeout: 60000,  
            connectionTimeout: 30000,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        }).connect();
        // Database 3 - Đợt sản xuất 
        pool3 = await new sql.ConnectionPool({
            user: config.db_login.key,
            password: config.db_password.key,
            server: config.db_server.key,
            database: config.db_name3.key,
            options: {
                encrypt: false,
                trustServerCertificate: true
            },
            requestTimeout: 60000,  
            connectionTimeout: 30000,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        }).connect();
        console.log("Kết nối tất cả database thành công");

    } catch (error) {
        console.error("Không kết nối được SQL Server:", error);
    }
}
// Lấy dữ liệu 
function getPool() {
    if (!pool) throw new Error("DB Main chưa kết nối");
    return pool;
}

function getPool1() {
    if (!pool1) throw new Error("DB1 chưa kết nối");
    return pool1;
}

function getPool2() {
    if (!pool2) throw new Error("DB2 chưa kết nối");
    return pool2;
}

function getPool3() {
    if(!pool3) throw new Error("DB3 chưa kết nối");
    return pool3;
}
module.exports = {
    ConnectDatabase,
    getPool,
    getPool1,
    getPool2,
    getPool3
};