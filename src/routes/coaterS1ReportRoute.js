const coaterS1ReportController = require('../controllers/coaterS1ReportController');
const express = require('express');
const router = express.Router();

router.route('/filter').get(coaterS1ReportController.filterCoaterS1s);
router.route('/column').get(coaterS1ReportController.getColumnCoaterS1s);

module.exports = router;