'use strict';
const express = require('express');
const ctrl = require('../controllers/descuento.controller');
const { createRules, updateRules } = require('../validators/descuento.validator');
const handleValidation = require('../middlewares/handleValidationErrors');
const authJwt = require('../middlewares/authJwt');
const requireRole = require('../middlewares/requireRole');

const router = express.Router();

// Todo requiere autenticación
router.use(authJwt);

// Lectura: cualquier usuario autenticado (el cajero necesita ver descuentos
// para aplicarlos al cobrar).
router.get('/', ctrl.list);
router.get('/:id', ctrl.show);

// Gestión: solo ADMIN.
router.post('/', requireRole('ADMIN'), createRules, handleValidation, ctrl.create);
router.put('/:id', requireRole('ADMIN'), updateRules, handleValidation, ctrl.update);
router.delete('/:id', requireRole('ADMIN'), ctrl.destroy);

module.exports = router;
