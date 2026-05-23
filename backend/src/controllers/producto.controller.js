'use strict';
const { Producto, Categoria } = require('../../models');

/**
 * Lista todos los productos. Incluye la categoría para que el frontend pueda
 * mostrar el nombre/color sin tener que hacer una segunda consulta.
 */
exports.list = async (req, res, next) => {
  try {
    const productos = await Producto.findAll({
      include: [{ model: Categoria, attributes: ['id', 'nombre', 'color', 'icono'] }],
      order: [['nombre', 'ASC']],
    });
    res.json(productos);
  } catch (err) { next(err); }
};

exports.show = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Categoria }],
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(producto);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const datos = construirDatos(req.body);
    const producto = await Producto.create(datos);
    res.status(201).json(producto);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
    await producto.update(req.body);
    res.json(producto);
  } catch (err) { next(err); }
};

exports.destroy = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
    await producto.destroy();
    res.json({ mensaje: 'Producto eliminado.' });
  } catch (err) { next(err); }
};

/**
 * Helper: normaliza el cuerpo de un create. Si controlInventario es false,
 * forzamos stock a null para no guardar un número engañoso.
 */
function construirDatos(body) {
  const controlInventario = !!body.controlInventario;
  return {
    nombre: body.nombre,
    categoriaId: body.categoriaId || null,
    unidadVenta: body.unidadVenta || 'unidad',
    costo: Number(body.costo) || 0,
    precio: Number(body.precio) || 0,
    codigoInterno: body.codigoInterno || null,
    codigoBarras: body.codigoBarras || null,
    controlInventario,
    stock: controlInventario ? Number(body.stock || 0) : null,
    imagen: body.imagen || null,
  };
}
