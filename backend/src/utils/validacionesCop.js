'use strict';

/**
 * Reglas de validación de pesos colombianos, equivalentes a las que ya tiene
 * el frontend en datos.js. Las extraemos al backend para validar también del
 * lado del servidor (defensa en profundidad: no podemos confiar solo en lo
 * que validó el navegador).
 */

/**
 * Valida que un valor sea un precio válido en COP:
 *  - sin decimales (en Colombia no hay centavos)
 *  - múltiplo de 50 (denominación mínima)
 *  - mayor a cero
 *
 * @returns {string|null} mensaje de error o null si es válido
 */
function validarPrecioCop(valor, etiqueta = 'El valor') {
  if (valor === null || valor === undefined || valor === '') {
    return `${etiqueta} es obligatorio.`;
  }

  // Solo aceptamos enteros. Strings con decimales o letras se rechazan.
  if (typeof valor === 'string' && (valor.includes('.') || valor.includes(','))) {
    return `${etiqueta} no puede tener decimales.`;
  }

  const numero = Number(valor);
  if (!Number.isFinite(numero) || !Number.isInteger(numero)) {
    return `${etiqueta} debe ser un número entero.`;
  }
  if (numero < 0) return `${etiqueta} no puede ser negativo.`;
  if (numero === 0) return `${etiqueta} debe ser mayor a cero.`;
  if (numero % 50 !== 0) return `${etiqueta} debe ser múltiplo de 50.`;

  return null;
}

/**
 * Valida una cantidad entera positiva.
 */
function validarCantidadEntera(valor, etiqueta = 'La cantidad') {
  if (valor === null || valor === undefined || valor === '') {
    return `${etiqueta} es obligatoria.`;
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    return `${etiqueta} debe ser un entero mayor a cero.`;
  }
  return null;
}

module.exports = {
  validarPrecioCop,
  validarCantidadEntera,
};
