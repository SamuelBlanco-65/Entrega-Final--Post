'use strict';
const { body } = require('express-validator');
const { validarPrecioCop } = require('../utils/validacionesCop');

const customPrecioCop = (etiqueta) => (valor) => {
  const error = validarPrecioCop(valor, etiqueta);
  if (error) throw new Error(error);
  return true;
};

/**
 * Payload esperado para registrar una compra:
 * {
 *   proveedorId: number,
 *   metodoPago: "efectivo" | "nequi" | "consignacion",
 *   items: [
 *     // Opción A: producto existente
 *     { productoId, cantidad, costoUnitario }
 *     // Opción B: producto nuevo creado durante la compra
 *     { productoNuevo: { nombre, precio, categoriaId?, controlInventario? }, cantidad, costoUnitario }
 *   ]
 * }
 *
 * RF-94: el sistema debe permitir registrar un producto que no existe en
 * inventario durante la compra.
 */
exports.createRules = [
  body('proveedorId').isInt({ min: 1 })
    .withMessage('Debes indicar el proveedor de la compra.'),
  body('metodoPago').isIn(['efectivo', 'nequi', 'consignacion'])
    .withMessage('El método de pago debe ser "efectivo", "nequi" o "consignacion".'),
  body('items').isArray({ min: 1 })
    .withMessage('Una compra debe tener al menos un ítem.'),
  body('items.*.cantidad').isInt({ min: 1 }),
  body('items.*.costoUnitario').custom(customPrecioCop('El costo unitario')),
  body('observaciones').optional({ nullable: true }).isString(),
  // Cada item debe tener `productoId` O `productoNuevo`, no ambos, no ninguno.
  body('items.*').custom((item) => {
    const tieneId = item.productoId !== undefined && item.productoId !== null;
    const tieneNuevo = item.productoNuevo !== undefined && item.productoNuevo !== null;
    if (tieneId === tieneNuevo) {
      throw new Error('Cada ítem debe tener productoId (existente) o productoNuevo, no ambos.');
    }
    if (tieneNuevo) {
      const pn = item.productoNuevo;
      if (!pn.nombre || typeof pn.nombre !== 'string') {
        throw new Error('El producto nuevo necesita un nombre.');
      }
      const errorPrecio = validarPrecioCop(pn.precio, 'El precio del producto nuevo');
      if (errorPrecio) throw new Error(errorPrecio);
    }
    return true;
  }),
];
