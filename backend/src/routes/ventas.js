'use strict';
const express = require('express');
const ctrl = require('../controllers/venta.controller');
const { createRules, anularRules } = require('../validators/venta.validator');
const handleValidation = require('../middlewares/handleValidationErrors');
const requireRole = require('../middlewares/requireRole');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.show);
router.post('/', createRules, handleValidation, ctrl.create);
// Anular venta es acción crítica (RF-70): solo ADMIN.
router.delete('/:id', requireRole('ADMIN'), anularRules, handleValidation, ctrl.anular);

module.exports = router;
