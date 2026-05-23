'use strict';
const bcrypt = require('bcryptjs');
const { Usuario } = require('../../models');

const SALT_ROUNDS = 10;

exports.list = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({ order: [['username', 'ASC']] });
    res.json(usuarios);
  } catch (err) { next(err); }
};

exports.show = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { username, nombre, password, role, activo } = req.body;

    // Verificar que el username no exista (mejor mensaje que el SQL constraint)
    const existente = await Usuario.findOne({ where: { username } });
    if (existente) {
      return res.status(409).json({ error: 'El username ya está en uso.' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const usuario = await Usuario.create({
      username,
      nombre,
      password: hash,
      role: role || 'USER',
      activo: activo !== false,
    });

    // Sin password en la respuesta (defaultScope ya lo excluye, pero create
    // devuelve el objeto antes de filtrar — re-fetch para mayor seguridad).
    const limpio = await Usuario.findByPk(usuario.id);
    res.status(201).json(limpio);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const updates = { ...req.body };

    // Si viene password, hashearlo. Si no, no tocar el campo.
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    await usuario.update(updates);
    const refrescado = await Usuario.findByPk(usuario.id);
    res.json(refrescado);
  } catch (err) { next(err); }
};

exports.destroy = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // No permitir auto-eliminación (que un admin se borre solo)
    if (req.user && req.user.sub === usuario.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo.' });
    }

    await usuario.destroy();
    res.json({ mensaje: 'Usuario eliminado.' });
  } catch (err) { next(err); }
};
