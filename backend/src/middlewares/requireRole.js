'use strict';

/**
 * Factory de middleware que restringe acceso según rol(es).
 *
 * Uso:
 *   requireRole('ADMIN')                  → solo ADMIN
 *   requireRole(['ADMIN', 'SUPERVISOR'])  → cualquiera de los dos
 *
 * Devuelve 401 si no hay req.user (debería usarse después de authJwt),
 * 403 si el usuario está autenticado pero no tiene rol suficiente.
 */
module.exports = (rolesPermitidos) => {
  const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acceso prohibido. Se requiere rol: ${roles.join(' o ')}.`,
      });
    }
    next();
  };
};
