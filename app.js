const express = require('express');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const {notFound, errorHandler} = require('./src/middleware/errHandle');
const cors = require('cors');
require('dotenv').config();
const dmCU2Router = require('./src/routes/dmCU2Route');
const dmS1Router = require('./src/routes/dmS1Route');
const qltkRouter = require('./src/routes/qltkRoute');
const giaCU2Router = require('./src/routes/giaCU2Route');
const giaS1Router = require('./src/routes/giaS1Route');   
const giaNVLRouter = require('./src/routes/giaNVLRoute');   
const giaVTDGRouter = require('./src/routes/giaVTDGRoute');   
const dmSanNVLRouter = require('./src/routes/dmSanNVLRoute');
const dmDGRouter = require('./src/routes/dmDGRoute');   
const dmRouter = require('./src/routes/dmRoute');   
const cpptRouter = require('./src/routes/cpptRoute');   
const dmKHRouter = require('./src/routes/dmKHRoute');    
const khCsThangRouter = require('./src/routes/khCsThangRoute');    
const priceVNDRouter = require('./src/routes/priceVNDRoute');    
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
app.use('/api/dmCU2',dmCU2Router);
app.use('/api/dmS1',dmS1Router);
app.use('/api/giaCU2', giaCU2Router);
app.use('/api/giaS1', giaS1Router);
app.use('/api/qltk',qltkRouter);
app.use('/api/giaNVL',giaNVLRouter);
app.use('/api/giaVTDG',giaVTDGRouter);
app.use('/api/dmSanNVL',dmSanNVLRouter);
app.use('/api/dmDG',dmDGRouter);
app.use('/api/dm',dmRouter);
app.use('/api/cppt',cpptRouter);
app.use('/api/dmKH', dmKHRouter);
app.use('/api/khCsThang', khCsThangRouter);
app.use('/api/priceVND', priceVNDRouter);
// Bắt các route không khớp, trả về lỗi 404
app.use(notFound)
// Xử lý lỗi
app.use(errorHandler)
module.exports = app