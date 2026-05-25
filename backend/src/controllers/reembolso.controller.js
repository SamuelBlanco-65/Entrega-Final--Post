'use strict';
const {
  sequelize,
  Venta,
  VentaItem,
  Producto,
  Reembolso,
  ReembolsoItem,
} = require('../../models');

/**
 * GET /api/reembolsos?ventaId=
 * Lista reembolsos, opcionalmente filtrados por venta.
 */
exports.list = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.ventaId) where.ventaId = Number(req.query.ventaId);

    const reembolsos = await Reembolso.findAll({
      where,
      include: [{ model: ReembolsoItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
    });
    res.json(reembolsos);
  } catch (err) { next(err); }
};

/**
 * GET /api/reembolsos/:id
 */
exports.show = async (req, res, next) => {
  try {
    const reembolso = await Reembolso.findByPk(req.params.id, {
      include: [{ model: ReembolsoItem, as: 'items' }],
    });
    if (!reembolso) return res.status(404).json({ error: 'Reembolso no encontrado.' });
    res.json(reembolso);
  } catch (err) { next(err); }
};

/**
 * POST /api/ventas/:ventaId/reembolsos   (solo ADMIN)
 *
 * Crea un reembolso total o parcial sobre una venta cerrada (RF-60 a RF-65).
 *
 * Payload:
 * {
 *   tipo: "total" | "parcial",
 *   fuente?: "caja" | "nequi" | "ajuste_deuda",   // default "caja" (RF-63)
 *   observaciones?: string,
 *   items: [                                       // qué se reembolsa
 *     { ventaItemId, cantidad, retornaInventario: bool }
 *   ]
 * }
 *
 * Para tipo "total", si no envían items, se reembolsan TODOS los items de la
 * venta en su cantidad restante, con retornaInventario=true por defecto.
 *
 * Reglas:
 *   - No reembolsar una venta anulada.
 *   - Por cada ventaItem, (ya reembolsado + nuevo) no puede exceder lo vendido
 *     (RF: "sin que la suma exceda lo vendido").
 *   - Si retornaInventario=true y el producto controla inventario, se devuelve
 *     stock (RF-64 / RN-05). Si es pérdida, no se toca stock.
 *   - Monto reembolsado por item = precioUnitario original * cantidad.
 *   - Todo atómico (transacción).
 */
exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const ventaId = Number(req.params.ventaId);
    const { tipo, fuente, observaciones } = req.body;
    let { items } = req.body;

    // Cargar venta con sus items.
    const venta = await Venta.findByPk(ventaId, {
      include: [{ model: VentaItem, as: 'items' }],
      transaction: t,
    });
    if (!venta) {
      await t.rollback();
      return res.status(404).json({ error: 'Venta no encontrada.' });
    }
    if (venta.estado === 'anulada') {
      await t.rollback();
      return res.status(409).json({ error: 'No se puede reembolsar una venta anulada.' });
    }

    // Mapa ventaItemId -> VentaItem para acceso rápido.
    const mapaItems = {};
    for (const vi of venta.items) mapaItems[vi.id] = vi;

    // FACTOR DE DESCUENTO DE LA VENTA.
    // El cliente no pagó el precio de lista, sino el total ya con descuento.
    // Para reembolsar de forma JUSTA (lo que el cliente realmente pagó), cada
    // ítem se reembolsa proporcionalmente:
    //     montoItem = precioUnitario * cantidad * factor
    // donde factor = total pagado / subtotal sin descuento.
    // El subtotal sin descuento = total + descuentoMonto (la venta guarda el
    // total ya descontado y el monto de descuento por separado).
    // Si no hubo descuento, factor = 1 y nada cambia.
    const descuentoMonto = venta.descuentoMonto || 0;
    const subtotalSinDescuento = venta.total + descuentoMonto;
    const factorDescuento = subtotalSinDescuento > 0
      ? venta.total / subtotalSinDescuento
      : 1;

    // Si es total y no mandan items, generamos el reembolso de TODO lo que
    // queda por reembolsar de cada item.
    if (tipo === 'total' && (!items || items.length === 0)) {
      items = [];
      for (const vi of venta.items) {
        items.push({ ventaItemId: vi.id, cantidad: vi.cantidad, retornaInventario: true });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Debe indicar al menos un ítem a reembolsar.' });
    }

    // Reembolsos previos de esta venta, para acumular cantidades ya devueltas
    // por cada ventaItem.
    const reembolsosPrevios = await ReembolsoItem.findAll({
      include: [{
        model: Reembolso,
        where: { ventaId },
        attributes: [],
        required: true,
      }],
      transaction: t,
    });
    const yaReembolsadoPorItem = {};
    for (const ri of reembolsosPrevios) {
      if (ri.ventaItemId == null) continue;
      yaReembolsadoPorItem[ri.ventaItemId] =
        (yaReembolsadoPorItem[ri.ventaItemId] || 0) + ri.cantidad;
    }

    // Procesar cada item del payload.
    let montoTotal = 0;
    const itemsParaCrear = [];

    for (const item of items) {
      const vi = mapaItems[item.ventaItemId];
      if (!vi) {
        await t.rollback();
        return res.status(400).json({
          error: `El ítem de venta id=${item.ventaItemId} no pertenece a esta venta.`,
        });
      }

      const yaReemb = yaReembolsadoPorItem[vi.id] || 0;
      const disponibleParaReembolso = vi.cantidad - yaReemb;
      if (item.cantidad > disponibleParaReembolso) {
        await t.rollback();
        return res.status(400).json({
          error: `No se puede reembolsar ${item.cantidad} de "${vi.nombreSnapshot}": ya reembolsado ${yaReemb}, vendido ${vi.cantidad}, disponible ${disponibleParaReembolso}.`,
        });
      }

      // Monto = precio cobrado * cantidad, ajustado por el factor de descuento
      // de la venta (para devolver lo que el cliente realmente pagó, no el
      // precio de lista). Redondeamos a entero (COP sin decimales).
      const montoItem = Math.round(vi.precioUnitario * item.cantidad * factorDescuento);
      montoTotal += montoItem;

      // RF-64 / RN-05: devolver stock solo si retornaInventario y el producto
      // controla inventario.
      const retorna = item.retornaInventario !== false; // default true
      if (retorna && vi.productoId != null) {
        const producto = await Producto.findByPk(vi.productoId, { transaction: t });
        if (producto && producto.controlInventario) {
          const stockActual = producto.stock ?? 0;
          await producto.update({ stock: stockActual + item.cantidad }, { transaction: t });
        }
      }

      itemsParaCrear.push({
        ventaItemId: vi.id,
        productoId: vi.productoId,
        nombreSnapshot: vi.nombreSnapshot,
        cantidad: item.cantidad,
        montoReembolsado: montoItem,
        retornaInventario: retorna,
      });
    }

    // Crear cabecera + items.
    const reembolso = await Reembolso.create(
      {
        ventaId,
        tipo: tipo || 'parcial',
        montoTotal,
        fuente: fuente || 'caja',
        reembolsadoPor: req.user ? req.user.username : 'sistema',
        observaciones: observaciones || null,
      },
      { transaction: t }
    );

    await ReembolsoItem.bulkCreate(
      itemsParaCrear.map((it) => ({ ...it, reembolsoId: reembolso.id })),
      { transaction: t }
    );

    await t.commit();

    const reembolsoCompleto = await Reembolso.findByPk(reembolso.id, {
      include: [{ model: ReembolsoItem, as: 'items' }],
    });
    res.status(201).json({ mensaje: 'Reembolso registrado correctamente.', reembolso: reembolsoCompleto });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
