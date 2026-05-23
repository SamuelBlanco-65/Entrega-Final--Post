'use strict';
const { Cliente } = require('../../models');

exports.list = async (req, res, next) => {
  try {
    const clientes = await Cliente.findAll({ order: [['nombre', 'ASC']] });
    res.json(clientes);
  } catch (err) { next(err); }
};

exports.show = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json(cliente);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const cliente = await Cliente.create({
      nombre: req.body.nombre,
      telefono: req.body.telefono || null,
      correo: req.body.correo || null,
    });
    res.status(201).json(cliente);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
    await cliente.update(req.body);
    res.json(cliente);
  } catch (err) { next(err); }
};

exports.destroy = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
    await cliente.destroy();
    res.json({ mensaje: 'Cliente eliminado.' });
  } catch (err) { next(err); }
};
