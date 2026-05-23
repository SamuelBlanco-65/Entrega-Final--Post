'use strict';
const { body } = require('express-validator');

exports.createRules = [
  body('nombreSolicitado').isString().trim().notEmpty().isLength({ max: 150 })
    .withMessage('El nombre del producto solicitado es obligatorio.'),
  body('tipo').isIn(['agotado', 'no_registrado'])
    .withMessage('El tipo debe ser "agotado" o "no_registrado".'),
  body('cantidadSolicitada').optional({ nullable: true }).isInt({ min: 1 })
    .withMessage('La cantidad debe ser entero positivo si se especifica.'),
  body('observacion').optional({ nullable: true }).isString(),
  body('productoId').optional({ nullable: true }).isInt({ min: 1 }),
];

exports.updateRules = [
  body('nombreSolicitado').optional().isString().trim().notEmpty().isLength({ max: 150 }),
  body('tipo').optional().isIn(['agotado', 'no_registrado']),
  body('cantidadSolicitada').optional({ nullable: true }).isInt({ min: 1 }),
  body('observacion').optional({ nullable: true }).isString(),
  body('estado').optional().isIn(['pendiente', 'resuelto', 'descartado']),
  body('productoId').optional({ nullable: true }).isInt({ min: 1 }),
];
