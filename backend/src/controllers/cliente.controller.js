'use strict';
const { Cliente, Venta } = require('../../models');

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

    // Integridad referencial: no borrar un cliente con ventas asociadas, para
    // preservar el historial de ventas (incluidas las ventas a crédito "debe").
    const ventasAsociadas = await Venta.count({ where: { clienteId: cliente.id } });
    if (ventasAsociadas > 0) {
      return res.status(409).json({
        error: `No se puede eliminar el cliente porque tiene ${ventasAsociadas} venta(s) registrada(s) en el historial.`,
      });
    }

    await cliente.destroy();
    res.json({ mensaje: 'Cliente eliminado.' });
  } catch (err) { next(err); }
};
