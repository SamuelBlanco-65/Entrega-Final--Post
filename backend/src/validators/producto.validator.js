'use strict';
const { body } = require('express-validator');
const { validarPrecioCop, validarCantidadEntera } = require('../utils/validacionesCop');

/**
 * Wrapper para usar nuestras reglas COP dentro de express-validator.
 * `validarPrecioCop` devuelve string (error) o null (ok); express-validator
 * usa `throw new Error(...)` para reportar fallo. Adaptamos:
 */
const customPrecioCop = (etiqueta) => (valor) => {
  const error = validarPrecioCop(valor, etiqueta);
  if (error) throw new Error(error);
  return true;
};

const customCantidadEntera = (etiqueta) => (valor) => {
  // El stock puede ser null/0 si el producto no tiene control de inventario
  // o si está agotado, así que aceptamos enteros >= 0 aquí.
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0) {
    throw new Error(`${etiqueta} debe ser un entero igual o mayor a cero.`);
  }
  return true;
};

exports.createRules = [
  body('nombre').isString().trim().notEmpty().isLength({ max: 150 })
    .withMessage('El nombre del producto es obligatorio.'),
  body('categoriaId').optional({ nullable: true }).isInt({ min: 1 }),
  body('unidadVenta').optional().isIn(['unidad', 'medida'])
    .withMessage('La unidad de venta debe ser "unidad" o "medida".'),
  body('costo').custom(customPrecioCop('El costo')),
  body('precio').custom(customPrecioCop('El precio')),
  body('codigoInterno').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('codigoBarras').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('controlInventario').optional().isBoolean(),
  body('stock').optional({ nullable: true }).custom(customCantidadEntera('El stock')),
  body('imagen').optional({ nullable: true }).isString(),
];

exports.updateRules = [
  body('nombre').optional().isString().trim().notEmpty().isLength({ max: 150 }),
  body('categoriaId').optional({ nullable: true }).isInt({ min: 1 }),
  body('unidadVenta').optional().isIn(['unidad', 'medida']),
  body('costo').optional().custom(customPrecioCop('El costo')),
  body('precio').optional().custom(customPrecioCop('El precio')),
  body('codigoInterno').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('codigoBarras').optional({ nullable: true }).isString().isLength({ max: 50 }),
  body('controlInventario').optional().isBoolean(),
  body('stock').optional({ nullable: true }).custom(customCantidadEntera('El stock')),
  body('imagen').optional({ nullable: true }).isString(),
];
