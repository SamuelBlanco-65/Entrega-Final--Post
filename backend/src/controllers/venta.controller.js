'use strict';
const { sequelize, Venta, VentaItem, Producto, Cliente } = require('../../models');

/**
 * GET /api/ventas
 * Lista ventas con filtros opcionales: ?desde, ?hasta, ?metodoPago, ?clienteId, ?estado
 * (RF-41 del documento de requerimientos)
 */
exports.list = async (req, res, next) => {
  try {
    const { desde, hasta, metodoPago, clienteId, estado } = req.query;
    const where = {};

    if (estado) where.estado = estado;
    if (metodoPago) where.metodoPago = metodoPago;
    if (clienteId) where.clienteId = Number(clienteId);
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[sequelize.Sequelize.Op.gte] = new Date(desde);
      if (hasta) where.createdAt[sequelize.Sequelize.Op.lte] = new Date(hasta);
    }

    const ventas = await Venta.findAll({
      where,
      include: [
        { model: VentaItem, as: 'items' },
        { model: Cliente, attributes: ['id', 'nombre'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(ventas);
  } catch (err) { next(err); }
};

/**
 * GET /api/ventas/:id
 */
exports.show = async (req, res, next) => {
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [
        { model: VentaItem, as: 'items' },
        { model: Cliente },
      ],
    });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });
    res.json(venta);
  } catch (err) { next(err); }
};

/**
 * POST /api/ventas
 *
 * Crea una venta completa de forma atómica:
 *   1. Bloquea el inicio de transacción.
 *   2. Por cada item del payload:
 *      - busca el producto en la base
 *      - valida stock si tiene controlInventario
 *      - calcula subtotal usando el precio ACTUAL del catálogo (snapshot)
 *      - descuenta stock si aplica (RN-03)
 *   3. Suma el total.
 *   4. Crea la Venta con su total y método de pago.
 *   5. Crea los VentaItem en bulk.
 *   6. Confirma transacción.
 *
 * Si algo falla a mitad de camino (un producto no existe, stock insuficiente,
 * etc.) la transacción se revierte y NINGÚN cambio queda en la base. Esto
 * es lo que hace que no podamos terminar con "stock descontado pero venta
 * no guardada".
 */
exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { clienteId, metodoPago, efectivoRecibido, items, observaciones } = req.body;

    // Validación de cliente si metodoPago es "debe" (RF-23)
    if (metodoPago === 'debe' && !clienteId) {
      await t.rollback();
      return res.status(400).json({ error: 'El método "Debe" requiere un cliente asociado.' });
    }

    // Procesar cada item: buscar producto, validar stock, calcular subtotal
    let total = 0;
    const itemsParaCrear = [];

    for (const item of items) {
      const producto = await Producto.findByPk(item.productoId, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: `Producto id=${item.productoId} no encontrado.` });
      }

      // RN-03: si controla inventario, verificar y descontar stock.
      if (producto.controlInventario) {
        if (producto.stock === null || producto.stock < item.cantidad) {
          await t.rollback();
          return res.status(400).json({
            error: `Stock insuficiente de "${producto.nombre}" (disponible: ${producto.stock ?? 0}, solicitado: ${item.cantidad}).`,
          });
        }
        await producto.update(
          { stock: producto.stock - item.cantidad },
          { transaction: t }
        );
      }

      const subtotal = producto.precio * item.cantidad;
      total += subtotal;

      itemsParaCrear.push({
        productoId: producto.id,
        nombreSnapshot: producto.nombre,
        precioUnitario: producto.precio,
        cantidad: item.cantidad,
        subtotal,
      });
    }

    // Validación de efectivo recibido si paga en efectivo
    let cambio = null;
    if (metodoPago === 'efectivo') {
      if (efectivoRecibido < total) {
        await t.rollback();
        return res.status(400).json({
          error: `Efectivo recibido (${efectivoRecibido}) menor al total (${total}).`,
        });
      }
      cambio = efectivoRecibido - total;
    }

    // Crear la venta
    const venta = await Venta.create(
      {
        estado: 'cerrada',
        metodoPago,
        clienteId: clienteId || null,
        total,
        efectivoRecibido: metodoPago === 'efectivo' ? efectivoRecibido : null,
        cambio,
        observaciones: observaciones || null,
      },
      { transaction: t }
    );

    // Crear los items en bulk, todos con el ventaId recién generado
    await VentaItem.bulkCreate(
      itemsParaCrear.map((it) => ({ ...it, ventaId: venta.id })),
      { transaction: t }
    );

    await t.commit();

    // Recargar con los items incluidos para responder algo completo
    const ventaCompleta = await Venta.findByPk(venta.id, {
      include: [{ model: VentaItem, as: 'items' }, { model: Cliente }],
    });
    res.status(201).json(ventaCompleta);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

/**
 * DELETE /api/ventas/:id
 *
 * "Anula" una venta (RF-70/71/72). Cumple RN-04: si la venta tenía items con
 * controlInventario, se restaura el stock.
 *
 * Decisión: en lugar de borrar la fila, marcamos estado="anulada" para
 * conservar historial. Esto es coherente con RNF-06 (trazabilidad).
 */
exports.anular = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [{ model: VentaItem, as: 'items' }],
      transaction: t,
    });
    if (!venta) {
      await t.rollback();
      return res.status(404).json({ error: 'Venta no encontrada.' });
    }
    if (venta.estado === 'anulada') {
      await t.rollback();
      return res.status(409).json({ error: 'La venta ya estaba anulada.' });
    }

    // Restaurar stock por cada item que apunte a un producto con controlInventario
    for (const item of venta.items) {
      if (!item.productoId) continue; // producto borrado: no hay a qué restaurar
      const producto = await Producto.findByPk(item.productoId, { transaction: t });
      if (producto && producto.controlInventario && producto.stock !== null) {
        await producto.update(
          { stock: producto.stock + item.cantidad },
          { transaction: t }
        );
      }
    }

    await venta.update(
      {
        estado: 'anulada',
        modificadaPor: req.body.modificadaPor || 'sistema',
        modificadaEn: new Date(),
        observaciones: req.body.observaciones || venta.observaciones,
      },
      { transaction: t }
    );

    await t.commit();
    res.json({ mensaje: 'Venta anulada y stock restaurado.', venta });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
