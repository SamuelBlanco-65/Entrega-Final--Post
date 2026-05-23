'use strict';
const { Descuento } = require('../../models');

exports.list = async (req, res, next) => {
  try {
    // ?soloActivos=true filtra los inactivos (útil para el selector de cobro)
    const where = {};
    if (req.query.soloActivos === 'true') where.activo = true;

    const descuentos = await Descuento.findAll({
      where,
      order: [['nombre', 'ASC']],
    });
    res.json(descuentos);
  } catch (err) { next(err); }
};

exports.show = async (req, res, next) => {
  try {
    const descuento = await Descuento.findByPk(req.params.id);
    if (!descuento) return res.status(404).json({ error: 'Descuento no encontrado.' });
    res.json(descuento);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const descuento = await Descuento.create({
      nombre: req.body.nombre,
      tipo: req.body.tipo,
      valor: Number(req.body.valor),
      activo: req.body.activo !== false,
    });
    res.status(201).json(descuento);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const descuento = await Descuento.findByPk(req.params.id);
    if (!descuento) return res.status(404).json({ error: 'Descuento no encontrado.' });
    await descuento.update(req.body);
    res.json(descuento);
  } catch (err) { next(err); }
};

exports.destroy = async (req, res, next) => {
  try {
    const descuento = await Descuento.findByPk(req.params.id);
    if (!descuento) return res.status(404).json({ error: 'Descuento no encontrado.' });
    await descuento.destroy();
    res.json({ mensaje: 'Descuento eliminado.' });
  } catch (err) { next(err); }
};
