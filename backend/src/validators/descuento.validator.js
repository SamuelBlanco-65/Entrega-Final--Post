'use strict';
const { body } = require('express-validator');

/**
 * Validación combinada: dependiendo del tipo, el valor tiene restricciones
 * distintas. Si tipo='porcentaje', valor 1-100. Si tipo='valor_fijo', valor
 * mayor a cero (entero COP, no exigimos múltiplo de 50 porque podría ser
 * un descuento como "-$1500" generado por sistema).
 */
const validarValorPorTipo = (valor, { req }) => {
  const tipo = req.body.tipo;
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error('El valor debe ser un entero mayor a cero.');
  }
  if (tipo === 'porcentaje' && numero > 100) {
    throw new Error('Un descuento porcentual no puede ser mayor a 100.');
  }
  return true;
};

exports.createRules = [
  body('nombre').isString().trim().notEmpty().isLength({ max: 100 })
    .withMessage('El nombre es obligatorio (máx. 100 caracteres).'),
  body('tipo').isIn(['porcentaje', 'valor_fijo'])
    .withMessage('El tipo debe ser "porcentaje" o "valor_fijo".'),
  body('valor').custom(validarValorPorTipo),
  body('activo').optional().isBoolean(),
];

exports.updateRules = [
  body('nombre').optional().isString().trim().notEmpty().isLength({ max: 100 }),
  body('tipo').optional().isIn(['porcentaje', 'valor_fijo']),
  body('valor').optional().custom(validarValorPorTipo),
  body('activo').optional().isBoolean(),
];
