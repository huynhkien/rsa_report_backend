const dataProductionRSAController = require('../controllers/dataProductionRSAController');
const express = require('express');
const router = express.Router();
router.route('/data').get(dataProductionRSAController.getDataProduction);
router.route('/').get(dataProductionRSAController.getDataProductions);

module.exports = router;