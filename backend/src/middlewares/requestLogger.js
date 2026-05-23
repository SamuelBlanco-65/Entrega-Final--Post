'use strict';
const { RequestLog } = require('../../models');

/**
 * Pre-procesamiento: registra cada petición HTTP en la tabla RequestLogs.
 * No bloquea la petición si falla el log (mejor perder un log que tumbar el
 * servidor).
 *
 * Capturamos también el statusCode al final usando res.on('finish'), un hook
 * de Express que dispara cuando la respuesta ya fue enviada.
 */
module.exports = (req, res, next) => {
  const inicio = Date.now();

  res.on('finish', async () => {
    try {
      await RequestLog.create({
        method: req.method,
        path: req.originalUrl.substring(0, 255),
        ip: req.ip || req.connection?.remoteAddress || null,
        statusCode: res.statusCode,
      });
    } catch (err) {
      // Si la tabla aún no existe (primer arranque) o falla la BD, no
      // queremos romper el servidor. Solo lo escribimos a consola.
      console.error('[requestLogger]', err.message);
    }
    // Útil para ver en consola sin necesidad de morgan
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - inicio}ms)`);
  });

  next();
};
