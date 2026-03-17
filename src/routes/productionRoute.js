const productionController = require('../controllers/productionController');
const express = require('express');
const router = express.Router();

router.route('/').post(productionController.addProduction)
                .get(productionController.getProductions);

router.route('/:id').get(productionController.getProduction)
                    .put(productionController.updateProduction)
                    .delete(productionController.deleteProduction)

module.exports = router;