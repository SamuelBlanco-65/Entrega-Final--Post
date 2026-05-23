'use strict';

/**
 * Normaliza un texto para poder agrupar variantes que el humano considera
 * "el mismo producto" en el reporte de faltantes (RN-10).
 *
 * Reglas:
 *   - todo a minúsculas
 *   - quitar tildes/diacríticos
 *   - colapsar espacios múltiples
 *   - trim
 *   - quitar una "s" final si la palabra es de más de 3 letras (heurística
 *     simple para fusionar "cofia" y "cofias")
 *
 * No es lingüísticamente perfecto, pero atrapa los casos comunes que pide
 * el documento. Si más tarde quieres algo más robusto, se puede cambiar
 * por una librería como `slugify` o pluralización con `pluralize`.
 *
 * Ejemplos:
 *   "Cofias para gorro"   → "cofia para gorro"
 *   "  cofia  "           → "cofia"
 *   "lápiz #2"            → "lapiz #2"
 */
function normalizar(texto) {
  if (!texto) return '';
  let resultado = texto.toString().toLowerCase().trim();
  // Quita diacríticos: descompone à -> a + ` y luego elimina los marks
  resultado = resultado.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Colapsa espacios múltiples
  resultado = resultado.replace(/\s+/g, ' ');
  // Quita "s" final si la palabra final tiene >3 letras (cofia↔cofias)
  resultado = resultado.replace(/([a-z]{3,})s\b/g, '$1');
  return resultado;
}

module.exports = { normalizar };
