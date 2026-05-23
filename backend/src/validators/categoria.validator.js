'use strict';
const { body } = require('express-validator');

exports.createRules = [
  body('nombre').isString().trim().notEmpty().isLength({ max: 80 })
    .withMessage('El nombre es obligatorio (máx. 80 caracteres).'),
  body('color').optional({ nullable: true }).isString().isLength({ max: 20 }),
  body('icono').optional({ nullable: true }).isString().isLength({ max: 50 }),
];

exports.updateRules = [
  body('nombre').optional().isString().trim().notEmpty().isLength({ max: 80 }),
  body('color').optional({ nullable: true }).isString().isLength({ max: 20 }),
  body('icono').optional({ nullable: true }).isString().isLength({ max: 50 }),
];
