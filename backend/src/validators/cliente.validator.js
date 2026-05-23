'use strict';
const { body } = require('express-validator');

const reglasComunes = {
  nombre: () => body('nombre').isString().trim().notEmpty().isLength({ max: 150 }),
  telefono: () =>
    body('telefono').optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
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
