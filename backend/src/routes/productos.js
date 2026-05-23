'use strict';
const express = require('express');
const ctrl = require('../controllers/producto.controller');
const { createRules, updateRules } = require('../validators/producto.validator');
const handleValidation = require('../middlewares/handleValidationErrors');
const requireRole = require('../middlewares/requireRole');

const router = express.Router();

// authJwt se aplica globalmente en app.js antes de montar este router,
// así que aquí req.user ya existe.

router.get('/', ctrl.list);
router.get('/:id', ctrl.show);
router.post('/', createRules, handleValidation, ctrl.create);
router.put('/:id', updateRules, handleValidation, ctrl.update);
// Eliminar producto es acción crítica (RF-83): solo ADMIN.
router.delete('/:id', requireRole('ADMIN'), ctrl.destroy);

module.exports = router;
