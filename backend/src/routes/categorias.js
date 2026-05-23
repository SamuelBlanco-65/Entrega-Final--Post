'use strict';
const express = require('express');
const ctrl = require('../controllers/categoria.controller');
const { createRules, updateRules } = require('../validators/categoria.validator');
const handleValidation = require('../middlewares/handleValidationErrors');
const requireRole = require('../middlewares/requireRole');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.show);
router.post('/', createRules, handleValidation, ctrl.create);
router.put('/:id', updateRules, handleValidation, ctrl.update);
router.delete('/:id', requireRole('ADMIN'), ctrl.destroy);

module.exports = router;
