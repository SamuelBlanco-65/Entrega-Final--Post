'use strict';
const { sequelize, Compra, CompraItem, Producto, Proveedor } = require('../../models');

exports.list = async (req, res, next) => {
  try {
    const { desde, hasta, proveedorId, metodoPago } = req.query;
    const where = {};

    if (metodoPago) where.metodoPago = metodoPago;
    if (proveedorId) where.proveedorId = Number(proveedorId);
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[sequelize.Sequelize.Op.gte] = new Date(desde);
      if (hasta) where.createdAt[sequelize.Sequelize.Op.lte] = new Date(hasta);
    }

    const compras = await Compra.findAll({
      where,
      include: [
        { model: CompraItem, as: 'items' },
        { model: Proveedor, attributes: ['id', 'nombre'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(compras);
  } catch (err) { next(err); }
};

exports.show = async (req, res, next) => {
  try {
    const compra = await Compra.findByPk(req.params.id, {
      include: [{ model: CompraItem, as: 'items' }, { model: Proveedor }],
    });
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada.' });
    res.json(compra);
  } catch (err) { next(err); }
};

/**
 * POST /api/compras
 *
 * Registra una compra. A diferencia de la venta:
 *   - Suma stock al inventario en lugar de descontar (RF-97).
 *   - Permite crear productos nuevos sobre la marcha (RF-94).
 *   - El precio que guarda como snapshot es el COSTO unitario pagado.
 *
 * Cada item puede ser:
 *   { productoId, cantidad, costoUnitario }        → producto existente
 *   { productoNuevo: {...}, cantidad, costoUnitario } → producto creado on-the-fly
 */
exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { proveedorId, metodoPago, items, observaciones } = req.body;

    // Verificar proveedor
    const proveedor = await Proveedor.findByPk(proveedorId, { transaction: t });
    if (!proveedor) {
      await t.rollback();
      return res.status(404).json({ error: `Proveedor id=${proveedorId} no encontrado.` });
    }

    let total = 0;
    const itemsParaCrear = [];

    for (const item of items) {
      let producto;

      // Caso A: producto existente
      if (item.productoId) {
        producto = await Producto.findByPk(item.productoId, { transaction: t });
        if (!producto) {
          await t.rollback();
          return res.status(404).json({ error: `Producto id=${item.productoId} no encontrado.` });
        }
      }
      // Caso B: producto nuevo
      else if (item.productoNuevo) {
        const pn = item.productoNuevo;
        producto = await Producto.create(
          {
            nombre: pn.nombre,
            categoriaId: pn.categoriaId || null,
            unidadVenta: pn.unidadVenta || 'unidad',
            costo: Number(item.costoUnitario), // el costo lo tomamos del item
            precio: Number(pn.precio) || 0,
            codigoInterno: pn.codigoInterno || null,
            codigoBarras: pn.codigoBarras || null,
            controlInventario: pn.controlInventario !== false, // por defecto true
            stock: 0, // arrancamos en 0, la propia compra lo sube abajo
            imagen: pn.imagen || null,
          },
          { transaction: t }
        );
      }

      // Sumar stock si el producto controla inventario
      if (producto.controlInventario) {
        const stockActual = producto.stock || 0;
        await producto.update(
          { stock: stockActual + item.cantidad },
          { transaction: t }
        );
      }

      const subtotal = item.costoUnitario * item.cantidad;
      total += subtotal;

      itemsParaCrear.push({
        productoId: producto.id,
        nombreSnapshot: producto.nombre,
        costoUnitario: item.costoUnitario,
        cantidad: item.cantidad,
        subtotal,
      });
    }

    const compra = await Compra.create(
      {
        proveedorId,
        metodoPago,
        total,
        observaciones: observaciones || null,
      },
      { transaction: t }
    );

    await CompraItem.bulkCreate(
      itemsParaCrear.map((it) => ({ ...it, compraId: compra.id })),
      { transaction: t }
    );

    await t.commit();

    const compraCompleta = await Compra.findByPk(compra.id, {
      include: [{ model: CompraItem, as: 'items' }, { model: Proveedor }],
    });
    res.status(201).json(compraCompleta);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
