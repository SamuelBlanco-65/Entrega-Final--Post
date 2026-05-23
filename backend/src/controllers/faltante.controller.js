'use strict';
const { sequelize, Faltante, Producto } = require('../../models');
const { normalizar } = require('../utils/normalizarTexto');

/**
 * GET /api/faltantes
 * Filtros: ?estado, ?tipo, ?desde, ?hasta
 */
exports.list = async (req, res, next) => {
  try {
    const { estado, tipo, desde, hasta } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[sequelize.Sequelize.Op.gte] = new Date(desde);
      if (hasta) where.createdAt[sequelize.Sequelize.Op.lte] = new Date(hasta);
    }

    const faltantes = await Faltante.findAll({
      where,
      include: [{ model: Producto, attributes: ['id', 'nombre'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(faltantes);
  } catch (err) { next(err); }
};

exports.show = async (req, res, next) => {
  try {
    const faltante = await Faltante.findByPk(req.params.id, {
      include: [{ model: Producto }],
    });
    if (!faltante) return res.status(404).json({ error: 'Faltante no encontrado.' });
    res.json(faltante);
  } catch (err) { next(err); }
};

/**
 * POST /api/faltantes
 * Registra un producto solicitado y no disponible. Calcula automáticamente
 * el nombreNormalizado para poder agrupar en el reporte (RN-10).
 */
exports.create = async (req, res, next) => {
  try {
    const { nombreSolicitado, tipo, cantidadSolicitada, observacion, productoId } = req.body;

    const faltante = await Faltante.create({
      nombreSolicitado,
      nombreNormalizado: normalizar(nombreSolicitado),
      tipo,
      cantidadSolicitada: cantidadSolicitada || null,
      observacion: observacion || null,
      estado: 'pendiente',
      productoId: productoId || null,
    });
    res.status(201).json(faltante);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const faltante = await Faltante.findByPk(req.params.id);
    if (!faltante) return res.status(404).json({ error: 'Faltante no encontrado.' });

    const updates = { ...req.body };
    // Si cambian el nombre, recalcular el normalizado
    if (updates.nombreSolicitado) {
      updates.nombreNormalizado = normalizar(updates.nombreSolicitado);
    }

    await faltante.update(updates);
    res.json(faltante);
  } catch (err) { next(err); }
};

/**
 * PATCH /api/faltantes/:id/resolver
 * Marca el faltante como resuelto. Opcionalmente asocia el productoId que
 * ya quedó disponible en catálogo (RF-154).
 */
exports.resolver = async (req, res, next) => {
  try {
    const faltante = await Faltante.findByPk(req.params.id);
    if (!faltante) return res.status(404).json({ error: 'Faltante no encontrado.' });

    await faltante.update({
      estado: 'resuelto',
      productoId: req.body.productoId || faltante.productoId,
    });
    res.json({ mensaje: 'Faltante marcado como resuelto.', faltante });
  } catch (err) { next(err); }
};

exports.destroy = async (req, res, next) => {
  try {
    const faltante = await Faltante.findByPk(req.params.id);
    if (!faltante) return res.status(404).json({ error: 'Faltante no encontrado.' });
    await faltante.destroy();
    res.json({ mensaje: 'Faltante eliminado.' });
  } catch (err) { next(err); }
};

/**
 * GET /api/faltantes/reporte/frecuentes
 * Agrupa por nombreNormalizado y cuenta cuántas veces se ha solicitado cada
 * producto, con la última fecha. Apoya las decisiones de compra (RF-155).
 */
exports.reporteFrecuentes = async (req, res, next) => {
  try {
    const { fn, col, literal } = sequelize.Sequelize;

    const filas = await Faltante.findAll({
      attributes: [
        'nombreNormalizado',
        [fn('COUNT', col('id')), 'vecesSolicitado'],
        [fn('MAX', col('createdAt')), 'ultimaFecha'],
        // Tomamos un nombre representativo (el MIN alfabético) para mostrar
        [fn('MIN', col('nombreSolicitado')), 'nombreEjemplo'],
      ],
      group: ['nombreNormalizado'],
      order: [[literal('vecesSolicitado'), 'DESC']],
    });

    res.json(filas);
  } catch (err) { next(err); }
};
