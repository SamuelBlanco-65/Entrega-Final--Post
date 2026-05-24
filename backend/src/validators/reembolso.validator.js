'use strict';
const { body } = require('express-validator');

/**
 * Validador para crear un reembolso (RF-60 a RF-65).
 *
 * Payload:
 * {
 *   tipo: "total" | "parcial",
 *   fuente?: "caja" | "nequi" | "ajuste_deuda",
 *   observaciones?: string,
 *   items?: [{ ventaItemId, cantidad, retornaInventario }]
 * }
 *
 * Nota: para tipo "total" los items pueden omitirse (el controller los infiere
 * reembolsando todo lo restante), por eso items es opcional aquí. La coherencia
 * de cantidades vs lo vendido se valida en el controller (necesita la BD).
 */
exports.createRules = [
  body('tipo').isIn(['total', 'parcial'])
    .withMessage('El tipo de reembolso debe ser "total" o "parcial".'),
  body('fuente').optional({ nullable: true }).isIn(['caja', 'nequi', 'ajuste_deuda'])
    .withMessage('La fuente debe ser "caja", "nequi" o "ajuste_deuda".'),
  body('observaciones').optional({ nullable: true }).isString().isLength({ max: 500 }),
  body('items').optional({ nullable: true }).isArray()
    .withMessage('items debe ser un arreglo.'),
  body('items.*.ventaItemId').optional().isInt({ min: 1 })
    .withMessage('Cada ítem de reembolso debe referenciar un ventaItemId válido.'),
  body('items.*.cantidad').optional().isInt({ min: 1 })
    .withMessage('La cantidad a reembolsar debe ser un entero mayor a cero.'),
  body('items.*.retornaInventario').optional().isBoolean()
    .withMessage('retornaInventario debe ser booleano.'),
];
