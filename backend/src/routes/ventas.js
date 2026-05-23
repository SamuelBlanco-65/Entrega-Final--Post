'use strict';
const express = require('express');
const ctrl = require('../controllers/venta.controller');
const { createRules, anularRules } = require('../validators/venta.validator');
const handleValidation = require('../middlewares/handleValidationErrors');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.show);
router.post('/', createRules, handleValidation, ctrl.create);
// Marcar como anulada en lugar de DELETE físico (conserva historial)
router.delete('/:id', anularRules, handleValidation, ctrl.anular);

module.exports = router;
