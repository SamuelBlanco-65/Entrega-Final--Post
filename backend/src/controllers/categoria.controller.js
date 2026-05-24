'use strict';
const { Categoria, Producto } = require('../../models');

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

    // Integridad referencial: no permitir borrar una categoría que tiene
    // productos asociados, porque dejaría esos productos con un categoriaId
    // huérfano (apuntando a algo que ya no existe).
    const productosAsociados = await Producto.count({ where: { categoriaId: categoria.id } });
    if (productosAsociados > 0) {
      return res.status(409).json({
        error: `No se puede eliminar la categoría porque tiene ${productosAsociados} producto(s) asociado(s). Reasigna o elimina esos productos primero.`,
      });
    }

    await categoria.destroy();
    res.json({ mensaje: 'Categoría eliminada.' });
  } catch (err) { next(err); }
};
