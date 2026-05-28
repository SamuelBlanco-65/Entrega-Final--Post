'use strict';
const { body } = require('express-validator');

// Mismo criterio de teléfono colombiano que en cliente.validator.
function esTelefonoColombianoValido(valor) {
  if (valor == null || String(valor).trim() === '') return true;
  var limpio = String(valor).replace(/[\s\-\(\)\.]/g, '').replace(/^\+?57/, '');
  return /^3\d{9}$/.test(limpio) || /^60\d{8}$/.test(limpio) || /^\d{7}$/.test(limpio);
}
const telefonoValido = () =>
  body('telefono').optional({ nullable: true }).isString().trim().isLength({ max: 20 })
    .custom(esTelefonoColombianoValido)
    .withMessage('El teléfono no es válido para Colombia (celular de 10 dígitos o fijo de 7/10 dígitos).');

exports.createRules = [
  body('nombre').isString().trim().notEmpty().isLength({ max: 150 })
    .withMessage('El nombre del proveedor es obligatorio.'),
  body('nit').optional({ nullable: true }).isString().trim().isLength({ max: 30 }),
  telefonoValido(),
  body('correo').optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('El correo no tiene un formato válido.')
    .isLength({ max: 254 }),
];

exports.updateRules = [
  body('nombre').optional().isString().trim().notEmpty().isLength({ max: 150 }),
  body('nit').optional({ nullable: true }).isString().trim().isLength({ max: 30 }),
  telefonoValido(),
  body('correo').optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('El correo no tiene un formato válido.')
    .isLength({ max: 254 }),
];
