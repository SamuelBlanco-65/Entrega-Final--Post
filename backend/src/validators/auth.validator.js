'use strict';
const { body } = require('express-validator');

exports.loginRules = [
  body('username').isString().trim().notEmpty()
    .withMessage('El username es obligatorio.'),
  body('password').isString().notEmpty()
    .withMessage('La contraseña es obligatoria.'),
];

exports.createUsuarioRules = [
  body('username').isString().trim().notEmpty().isLength({ min: 3, max: 50 })
    .withMessage('El username debe tener entre 3 y 50 caracteres.'),
  body('nombre').isString().trim().notEmpty().isLength({ max: 150 })
    .withMessage('El nombre es obligatorio.'),
  body('password').isString().isLength({ min: 6, max: 100 })
    .withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('role').optional().isIn(['ADMIN', 'USER'])
    .withMessage('El rol debe ser ADMIN o USER.'),
  body('activo').optional().isBoolean(),
];

exports.updateUsuarioRules = [
  body('username').optional().isString().trim().notEmpty().isLength({ min: 3, max: 50 }),
  body('nombre').optional().isString().trim().notEmpty().isLength({ max: 150 }),
  body('password').optional().isString().isLength({ min: 6, max: 100 }),
  body('role').optional().isIn(['ADMIN', 'USER']),
  body('activo').optional().isBoolean(),
];
