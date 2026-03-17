const powerSupplyInfoController = require('../controllers/powerSupplyInfoController');
const express = require('express');
const router = express.Router();
router.route('/').get(powerSupplyInfoController.getPowerSupplyInfo);
router.route('/lt-09').get(powerSupplyInfoController.getPowerSupplyLt09Info);
router.route('/gte-1').get(powerSupplyInfoController.getPowerSupplyGte1Info);


module.exports = router;