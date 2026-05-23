'use strict';
const { body } = require('express-validator');

exports.createRules = [
  body('nombre').isString().trim().notEmpty().isLength({ max: 150 })
    .withMessage('El nombre del proveedor es obligatorio.'),
  body('nit').optional({ nullable: true }).isString().trim().isLength({ max: 30 }),
  body('telefono').optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  body('correo').optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('El correo no tiene un formato válido.')
    .isLength({ max: 254 }),
];

exports.updateRules = [
  body('nombre').optional().isString().trim().notEmpty().isLength({ max: 150 }),
  body('nit').optional({ nullable: true }).isString().trim().isLength({ max: 30 }),
  body('telefono').optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  body('correo').optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('El correo no tiene un formato válido.')
    .isLength({ max: 254 }),
];
