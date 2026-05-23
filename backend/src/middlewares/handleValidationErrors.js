'use strict';
const { validationResult } = require('express-validator');

/**
 * Middleware que se coloca al final de cada cadena de reglas de
 * express-validator. Si hay errores, responde 400 con la lista. Si no,
 * pasa al siguiente middleware (típicamente el controller).
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
