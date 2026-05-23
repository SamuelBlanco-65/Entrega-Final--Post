'use strict';
const express = require('express');
const ctrl = require('../controllers/usuario.controller');
const { createUsuarioRules, updateUsuarioRules } = require('../validators/auth.validator');
const handleValidation = require('../middlewares/handleValidationErrors');
const authJwt = require('../middlewares/authJwt');
const requireRole = require('../middlewares/requireRole');

const router = express.Router();

// Todas las rutas de usuarios requieren estar autenticado Y ser ADMIN.
// Aplicamos ambos middlewares a nivel de router para no repetir en cada línea.
router.use(authJwt, requireRole('ADMIN'));

router.get('/', ctrl.list);
router.get('/:id', ctrl.show);
router.post('/', createUsuarioRules, handleValidation, ctrl.create);
router.put('/:id', updateUsuarioRules, handleValidation, ctrl.update);
router.delete('/:id', ctrl.destroy);

module.exports = router;
