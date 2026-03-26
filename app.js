const express = require('express');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const {notFound, errorHandler} = require('./src/middleware/errHandle');
const cors = require('cors');
require('dotenv').config();
const PowerSupplyInfoRouter = require('./src/routes/powerSupplyInfoRoute');    
const Coater02ReportRouter = require('./src/routes/coater02ReportRoute');    
const CoaterS1ReportRouter = require('./src/routes/coaterS1ReportRoute');    
const ProductionRouter = require('./src/routes/productionRoute');    
const DataProductionRSARouter = require('./src/routes/dataProductionRSARoute');    
const app = express()

// JSON
app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' }));
// Phân tích url-encoded body
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
// tự động lấy cookie
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));
const corsOptions = {
   origin: [
    'http://localhost:3000',
  ],
   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
   credentials: true,
   optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
// route
app.get('/', (req, res) => {
    return res.json({
        message: 'Server đang chạy'
    });
});
// API 
app.use('/api/PowerSupplyInfo', PowerSupplyInfoRouter);
app.use('/api/Coater02', Coater02ReportRouter);
app.use('/api/CoaterS1', CoaterS1ReportRouter);
app.use('/api/Production', ProductionRouter);
app.use('/api/DataProductionRSA', DataProductionRSARouter);
// Bắt các route không khớp, trả về lỗi 404
app.use(notFound)
// Xử lý lỗi
app.use(errorHandler)
module.exports = app