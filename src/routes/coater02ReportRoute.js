const coater02ReportController = require('../controllers/coater02ReportController');
const express = require('express');
const router = express.Router();
router.route('/filter').get(coater02ReportController.filterCoater02s);
router.route('/column').get(coater02ReportController.getColumnCoater02s);

module.exports = router;