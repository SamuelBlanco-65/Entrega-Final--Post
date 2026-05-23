'use strict';
const { Categoria } = require('../../models');

exports.list = async (req, res, next) => {
  try {
    const categorias = await Categoria.findAll({ order: [['nombre', 'ASC']] });
    res.json(categorias);
  } catch (err) { next(err); }
};

exports.show = async (req, res, next) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada.' });
    res.json(categoria);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const categoria = await Categoria.create({
      nombre: req.body.nombre,
      color: req.body.color || null,
      icono: req.body.icono || null,
    });
    res.status(201).json(categoria);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada.' });
    await categoria.update(req.body);
    res.json(categoria);
  } catch (err) { next(err); }
};

exports.destroy = async (req, res, next) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada.' });
    await categoria.destroy();
    res.json({ mensaje: 'Categoría eliminada.' });
  } catch (err) { next(err); }
};
