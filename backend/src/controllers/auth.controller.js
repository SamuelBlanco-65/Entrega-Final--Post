'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../../models');

/**
 * POST /api/login
 * Body: { username, password }
 * Respuesta: { token, user: { id, username, nombre, role } }
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Buscamos con scope 'withPassword' porque el default excluye password.
    const user = await Usuario.scope('withPassword').findOne({ where: { username } });

    if (!user || !user.activo) {
      // Mismo mensaje genérico que cuando la contraseña no coincide,
      // para no revelar si el username existe.
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const valido = await bcrypt.compare(password, user.password);
    if (!valido) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        nombre: user.nombre,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      tipo: 'Bearer',
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        role: user.role,
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/me
 * Devuelve el payload del JWT del usuario actual (requiere authJwt antes).
 * Útil para que el frontend muestre "Bienvenido, X" sin volver a pegar a /usuarios.
 */
exports.me = (req, res) => {
  res.json(req.user);
};
