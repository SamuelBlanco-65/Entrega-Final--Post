'use strict';
const express = require('express');
const ctrl = require('../controllers/venta.controller');
const reembolsoCtrl = require('../controllers/reembolso.controller');
const { createRules, anularRules, corregirRules } = require('../validators/venta.validator');
const { createRules: reembolsoCreateRules } = require('../validators/reembolso.validator');
const handleValidation = require('../middlewares/handleValidationErrors');
const requireRole = require('../middlewares/requireRole');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.show);
router.post('/', createRules, handleValidation, ctrl.create);

// ---------------------------------------------------------------------------
// Hito 3 - Corrección de ventas cerradas (RF-50, RF-51, RF-52, RN-06)
// ---------------------------------------------------------------------------
// Reabrir: solo lee/valida, lo puede hacer cualquier autenticado.
router.get('/:id/reabrir', ctrl.reabrir);
// Corregir: operación crítica -> solo ADMIN (decisión de diseño del hito).
router.put('/:id/corregir', requireRole('ADMIN'), corregirRules, handleValidation, ctrl.corregir);
// Historial de correcciones de una venta: lectura, cualquier autenticado.
router.get('/:id/correcciones', ctrl.historialCorrecciones);

// ---------------------------------------------------------------------------
// Hito 3 - Reembolsos sobre una venta (RF-60 a RF-65)
// ---------------------------------------------------------------------------
// Crear reembolso de una venta concreta: operación crítica -> solo ADMIN.
router.post(
  '/:ventaId/reembolsos',
  requireRole('ADMIN'),
  reembolsoCreateRules,
  handleValidation,
  reembolsoCtrl.create
);
// Listar reembolsos de una venta concreta (lectura).
router.get('/:ventaId/reembolsos', (req, res, next) => {
  // Reutilizamos el list del controller de reembolsos pasando ventaId por query.
  req.query.ventaId = req.params.ventaId;
  return reembolsoCtrl.list(req, res, next);
});

// Anular venta es acción crítica (RF-70): solo ADMIN.
router.delete('/:id', requireRole('ADMIN'), anularRules, handleValidation, ctrl.anular);

module.exports = router;
