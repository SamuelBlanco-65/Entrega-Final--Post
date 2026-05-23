'use strict';
const express = require('express');
const ctrl = require('../controllers/proveedor.controller');
const { createRules, updateRules } = require('../validators/proveedor.validator');
const handleValidation = require('../middlewares/handleValidationErrors');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.show);
router.post('/', createRules, handleValidation, ctrl.create);
router.put('/:id', updateRules, handleValidation, ctrl.update);
router.delete('/:id', ctrl.destroy);

module.exports = router;
