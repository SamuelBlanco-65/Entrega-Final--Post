'use strict';
const { body } = require('express-validator');

// Valida que un teléfono tenga formato colombiano realista:
//   celular 3XXXXXXXXX (10 díg), fijo nacional 60XXXXXXXX (10 díg) o local (7 díg),
//   opcionalmente con prefijo +57 / 57. Vacío/nulo se permite (es opcional).
function esTelefonoColombianoValido(valor) {
  if (valor == null || String(valor).trim() === '') return true; // opcional
  var limpio = String(valor).replace(/[\s\-\(\)\.]/g, '').replace(/^\+?57/, '');
  return /^3\d{9}$/.test(limpio) || /^60\d{8}$/.test(limpio) || /^\d{7}$/.test(limpio);
}

const reglasComunes = {
  nombre: () => body('nombre').isString().trim().notEmpty().isLength({ max: 150 }),
  telefono: () =>
    body('telefono').optional({ nullable: true }).isString().trim().isLength({ max: 20 })
      .custom(esTelefonoColombianoValido)
      .withMessage('El teléfono no es válido para Colombia (celular de 10 dígitos o fijo de 7/10 dígitos).'),
  correo: () =>
    body('correo').optional({ nullable: true, checkFalsy: true })
      .isEmail().withMessage('El correo no tiene un formato válido.')
      .isLength({ max: 254 }),
};

exports.createRules = [
  reglasComunes.nombre().withMessage('El nombre del cliente es obligatorio (máx. 150).'),
  reglasComunes.telefono(),
  reglasComunes.correo(),
];

exports.updateRules = [
  body('nombre').optional().isString().trim().notEmpty().isLength({ max: 150 }),
  reglasComunes.telefono(),
  reglasComunes.correo(),
];
