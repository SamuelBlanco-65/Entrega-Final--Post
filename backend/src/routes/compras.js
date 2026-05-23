'use strict';
const express = require('express');
const ctrl = require('../controllers/compra.controller');
const { createRules } = require('../validators/compra.validator');
const handleValidation = require('../middlewares/handleValidationErrors');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.show);
router.post('/', createRules, handleValidation, ctrl.create);

module.exports = router;
