'use strict';
const express = require('express');
const ctrl = require('../controllers/faltante.controller');
const { createRules, updateRules } = require('../validators/faltante.validator');
const handleValidation = require('../middlewares/handleValidationErrors');
const authJwt = require('../middlewares/authJwt');

const router = express.Router();

// Todo requiere autenticación. Los faltantes los registra el cajero en el
// día a día, así que no exigimos ADMIN aquí.
router.use(authJwt);

// El reporte va ANTES de /:id para que "reporte" no se confunda con un id.
router.get('/reporte/frecuentes', ctrl.reporteFrecuentes);

router.get('/', ctrl.list);
router.get('/:id', ctrl.show);
router.post('/', createRules, handleValidation, ctrl.create);
router.put('/:id', updateRules, handleValidation, ctrl.update);
router.patch('/:id/resolver', ctrl.resolver);
router.delete('/:id', ctrl.destroy);

module.exports = router;
