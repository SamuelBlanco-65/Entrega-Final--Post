'use strict';
const { body } = require('express-validator');

/**
 * Validador para crear una venta. El payload esperado:
 * {
 *   clienteId?: number|null,
 *   metodoPago: "efectivo" | "nequi" | "debe",
 *   efectivoRecibido?: number,    // solo si metodoPago = "efectivo"
 *   items: [{ productoId, cantidad }, ...],
 *   observaciones?: string,
 * }
 *
 * El cálculo del total y el snapshot del precio se hace en el controller
 * (es lógica de servidor, no de validación).
 */
exports.createRules = [
  body('clienteId').optional({ nullable: true }).isInt({ min: 1 }),
  body('metodoPago').isIn(['efectivo', 'nequi', 'debe'])
    .withMessage('El método de pago debe ser "efectivo", "nequi" o "debe".'),
  body('efectivoRecibido')
    .if(body('metodoPago').equals('efectivo'))
    .isInt({ min: 0 })
    .withMessage('Si pagan en efectivo, debes indicar el efectivo recibido.'),
  body('items').isArray({ min: 1 })
    .withMessage('Una venta debe tener al menos un ítem.'),
  body('items.*.productoId').isInt({ min: 1 })
    .withMessage('Cada ítem debe tener un productoId válido.'),
  body('items.*.cantidad').isInt({ min: 1 })
    .withMessage('La cantidad de cada ítem debe ser un entero mayor a cero.'),
  body('descuentoId').optional({ nullable: true }).isInt({ min: 1 })
    .withMessage('descuentoId debe ser un entero positivo si se especifica.'),
  body('observaciones').optional({ nullable: true }).isString(),
];

/**
 * Para PATCH /ventas/:id/anular o similar. Aquí solo aceptamos un campo
 * de observación opcional. La actualización completa de ventas (corrección)
 * vendrá en el Hito 3.
 */
exports.anularRules = [
  body('observaciones').optional({ nullable: true }).isString().isLength({ max: 500 }),
];
