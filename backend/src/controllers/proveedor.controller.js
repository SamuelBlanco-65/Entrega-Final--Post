'use strict';
const { Proveedor } = require('../../models');

exports.list = async (req, res, next) => {
  try {
    const proveedores = await Proveedor.findAll({ order: [['nombre', 'ASC']] });
    res.json(proveedores);
  } catch (err) { next(err); }
};

exports.show = async (req, res, next) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });
    res.json(proveedor);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const proveedor = await Proveedor.create({
      nombre: req.body.nombre,
      nit: req.body.nit || null,
      telefono: req.body.telefono || null,
      correo: req.body.correo || null,
    });
    res.status(201).json(proveedor);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });
    await proveedor.update(req.body);
    res.json(proveedor);
  } catch (err) { next(err); }
};

exports.destroy = async (req, res, next) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });
    await proveedor.destroy();
    res.json({ mensaje: 'Proveedor eliminado.' });
  } catch (err) { next(err); }
};
