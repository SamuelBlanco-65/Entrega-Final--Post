'use strict';
const jwt = require('jsonwebtoken');

/**
 * Verifica el token JWT del header Authorization. Si es válido, inyecta el
 * payload en req.user para que los siguientes middlewares y el controller
 * sepan quién hizo la petición.
 *
 * Payload esperado del token:
 *   { sub: usuarioId, username, nombre, role, iat, exp }
 *
 * Respuestas:
 *   401 si no hay header, formato inválido, firma incorrecta, o token expirado
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado.' });
  }

  const token = authHeader.substring(7); // quita "Bearer "

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    // jwt.verify lanza JsonWebTokenError si la firma no cuadra,
    // o TokenExpiredError si la fecha exp ya pasó.
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};
