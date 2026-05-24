'use strict';
const {
  sequelize,
  Venta,
  VentaItem,
  Producto,
  Cliente,
  Descuento,
  CorreccionVenta,
  Reembolso,
  ReembolsoItem,
} = require('../../models');

// ---------------------------------------------------------------------------
// Helpers internos del Hito 3
// ---------------------------------------------------------------------------

/**
 * Serializa una venta + sus items a un objeto plano, para guardarlo como
 * snapshot JSON en CorreccionVenta (RN-06: estado anterior/posterior).
 * Recibe una instancia de Venta que YA trae sus items incluidos.
 */
function serializarVenta(venta) {
  return {
    id: venta.id,
    estado: venta.estado,
    metodoPago: venta.metodoPago,
    clienteId: venta.clienteId,
    total: venta.total,
    efectivoRecibido: venta.efectivoRecibido,
    cambio: venta.cambio,
    descuentoId: venta.descuentoId,
    descuentoMonto: venta.descuentoMonto,
    observaciones: venta.observaciones,
    items: (venta.items || []).map((it) => ({
      productoId: it.productoId,
      nombreSnapshot: it.nombreSnapshot,
      precioUnitario: it.precioUnitario,
      cantidad: it.cantidad,
      subtotal: it.subtotal,
    })),
  };
}

/**
 * Calcula cuánta cantidad de cada VentaItem ya fue reembolsada, para validar
 * que la venta no esté "cerrada con reembolsos" cuando se intente corregir,
 * y para exponer el estado de reembolso al leer. Devuelve el total de items
 * de reembolso asociados a la venta.
 */
async function contarReembolsos(ventaId, transaction) {
  return Reembolso.count({ where: { ventaId }, transaction });
}

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
 *
 * Devuelve la venta con sus items, cliente, correcciones y reembolsos.
 * Añade un objeto derivado `resumenReembolso` calculado al vuelo (decisión de
 * diseño: la venta sigue en estado "cerrada"; el estado de reembolso NO vive
 * en la columna estado, se calcula leyendo los reembolsos).
 */
exports.show = async (req, res, next) => {
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [
        { model: VentaItem, as: 'items' },
        { model: Cliente },
        { model: CorreccionVenta, as: 'correcciones' },
        { model: Reembolso, as: 'reembolsos', include: [{ model: ReembolsoItem, as: 'items' }] },
      ],
    });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });

    // Resumen de reembolso calculado al vuelo.
    const reembolsos = venta.reembolsos || [];
    const montoReembolsadoTotal = reembolsos.reduce((acc, r) => acc + r.montoTotal, 0);
    const resumenReembolso = {
      tieneReembolsos: reembolsos.length > 0,
      cantidadReembolsos: reembolsos.length,
      montoReembolsadoTotal,
      esTotal: montoReembolsadoTotal >= venta.total && reembolsos.length > 0,
    };

    // fueCorregida: bandera simple para el frontend (RF-51).
    const fueCorregida = (venta.correcciones || []).length > 0;

    res.json({ ...venta.toJSON(), resumenReembolso, fueCorregida });
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
    const { clienteId, metodoPago, efectivoRecibido, items, observaciones, descuentoId } = req.body;

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

    // ----------------------------------------------------------------
    // Aplicar descuento (RN-08): solo uno por venta, calculado sobre el
    // total de los ítems. RF-19 / restricción: no producir totales negativos.
    // ----------------------------------------------------------------
    let descuentoMonto = 0;
    let descuentoAplicadoId = null;

    if (descuentoId) {
      const descuento = await Descuento.findByPk(descuentoId, { transaction: t });
      if (!descuento) {
        await t.rollback();
        return res.status(404).json({ error: `Descuento id=${descuentoId} no encontrado.` });
      }
      if (!descuento.activo) {
        await t.rollback();
        return res.status(400).json({ error: 'El descuento seleccionado está inactivo.' });
      }

      if (descuento.tipo === 'porcentaje') {
        // Redondeamos a entero (no hay centavos en COP)
        descuentoMonto = Math.round((total * descuento.valor) / 100);
      } else {
        // valor_fijo
        descuentoMonto = descuento.valor;
      }

      // No permitir total negativo: el descuento se topa al total.
      if (descuentoMonto > total) descuentoMonto = total;

      descuentoAplicadoId = descuento.id;
      total -= descuentoMonto;
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
        descuentoId: descuentoAplicadoId,
        descuentoMonto,
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

/**
 * GET /api/ventas/:id/reabrir
 *
 * "Reabrir para corrección" (RF-50). Como decidimos que la venta sigue en
 * estado "cerrada" y la corrección es una operación atómica posterior,
 * reabrir NO muta la base: solo valida que la venta sea corregible y
 * devuelve sus datos completos para que el frontend arme el formulario de
 * edición.
 *
 * Reglas de corregibilidad (exclusión mutua, decisión de diseño del hito):
 *   - No se corrige una venta anulada.
 *   - No se corrige una venta que ya tiene reembolsos (evita doble cálculo
 *     de inventario entre corrección y reembolso).
 */
exports.reabrir = async (req, res, next) => {
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [{ model: VentaItem, as: 'items' }, { model: Cliente }],
    });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });

    if (venta.estado === 'anulada') {
      return res.status(409).json({ error: 'No se puede corregir una venta anulada.' });
    }

    const numReembolsos = await contarReembolsos(venta.id);
    if (numReembolsos > 0) {
      return res.status(409).json({
        error: 'No se puede corregir una venta que ya tiene reembolsos asociados.',
      });
    }

    res.json({
      mensaje: 'Venta lista para corrección.',
      venta,
    });
  } catch (err) { next(err); }
};

/**
 * PUT /api/ventas/:id/corregir   (solo ADMIN)
 *
 * Corrige una venta cerrada (RF-50, RF-51, RF-52, RN-06). Recibe el ESTADO
 * DESEADO COMPLETO de la venta, no un diff:
 *
 * {
 *   clienteId?: number|null,
 *   metodoPago: "efectivo" | "nequi" | "debe",
 *   efectivoRecibido?: number,        // si metodoPago = efectivo
 *   descuentoId?: number|null,        // se recalcula sobre el nuevo total
 *   items: [{ productoId, cantidad }, ...],   // estado final de items
 *   motivo?: string,
 *   observaciones?: string,
 * }
 *
 * Pasos (todos dentro de UNA transacción):
 *   1. Cargar la venta con sus items actuales y validar corregibilidad.
 *   2. Tomar snapshot del estado ANTERIOR (para CorreccionVenta).
 *   3. Calcular el ajuste de inventario POR DIFERENCIA comparando el mapa
 *      de cantidades viejas (por productoId) contra el nuevo:
 *         delta = cantidadNueva - cantidadVieja
 *         delta > 0  -> hay que descontar 'delta' de stock (validar que alcance)
 *         delta < 0  -> hay que devolver '-delta' al stock
 *      Productos quitados => devolver todo su stock. Productos agregados =>
 *      descontar su cantidad completa.
 *   4. Aplicar los ajustes de stock.
 *   5. Borrar los VentaItem viejos y crear los nuevos (snapshot de nombre y
 *      precio ACTUAL del catálogo).
 *   6. Recalcular total y descuento (mismo descuentoId, o el nuevo que envíen).
 *   7. Actualizar la venta + modificadaPor/modificadaEn.
 *   8. Crear la fila CorreccionVenta con estadoAnterior y estadoPosterior.
 *   9. Commit.
 */
exports.corregir = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { clienteId, metodoPago, efectivoRecibido, descuentoId, items, motivo, observaciones } = req.body;

    // --- Paso 1: cargar venta con items y validar corregibilidad ---
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
      return res.status(409).json({ error: 'No se puede corregir una venta anulada.' });
    }
    const numReembolsos = await contarReembolsos(venta.id, t);
    if (numReembolsos > 0) {
      await t.rollback();
      return res.status(409).json({
        error: 'No se puede corregir una venta que ya tiene reembolsos asociados.',
      });
    }

    // Validación de negocio: "debe" exige cliente (RF-23), igual que en create.
    if (metodoPago === 'debe' && !clienteId) {
      await t.rollback();
      return res.status(400).json({ error: 'El método "Debe" requiere un cliente asociado.' });
    }

    // --- Paso 2: snapshot del estado ANTERIOR ---
    const estadoAnterior = serializarVenta(venta);

    // --- Paso 3: calcular ajuste de inventario por diferencia ---
    // Mapa productoId -> cantidad vieja. Ignoramos items con productoId null
    // (producto borrado): no hay stock que ajustar para ellos.
    const cantidadesViejas = {};
    for (const it of venta.items) {
      if (it.productoId == null) continue;
      cantidadesViejas[it.productoId] = (cantidadesViejas[it.productoId] || 0) + it.cantidad;
    }

    // Mapa productoId -> cantidad nueva (del payload).
    const cantidadesNuevas = {};
    for (const it of items) {
      cantidadesNuevas[it.productoId] = (cantidadesNuevas[it.productoId] || 0) + it.cantidad;
    }

    // Conjunto de todos los productoId involucrados (viejos + nuevos).
    const idsInvolucrados = new Set([
      ...Object.keys(cantidadesViejas),
      ...Object.keys(cantidadesNuevas),
    ].map(Number));

    // Para cada producto, delta = nueva - vieja.
    // delta > 0 => descontar; delta < 0 => devolver.
    // Validamos stock ANTES de aplicar nada (dentro de la transacción).
    const ajustes = []; // { producto, delta }
    for (const productoId of idsInvolucrados) {
      const vieja = cantidadesViejas[productoId] || 0;
      const nueva = cantidadesNuevas[productoId] || 0;
      const delta = nueva - vieja;
      if (delta === 0) continue;

      const producto = await Producto.findByPk(productoId, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: `Producto id=${productoId} no encontrado.` });
      }

      if (producto.controlInventario) {
        if (delta > 0) {
          // Se necesita MÁS stock del que había en la venta original.
          const disponible = producto.stock ?? 0;
          if (disponible < delta) {
            await t.rollback();
            return res.status(400).json({
              error: `Stock insuficiente de "${producto.nombre}" para la corrección (disponible: ${disponible}, adicional requerido: ${delta}).`,
            });
          }
        }
        ajustes.push({ producto, delta });
      }
    }

    // --- Paso 4: aplicar ajustes de stock ---
    // stock nuevo = stock actual - delta  (delta>0 descuenta, delta<0 suma)
    for (const { producto, delta } of ajustes) {
      const stockActual = producto.stock ?? 0;
      await producto.update({ stock: stockActual - delta }, { transaction: t });
    }

    // --- Paso 5: reemplazar VentaItem ---
    // Borramos los viejos y recreamos con precio/nombre ACTUALES del catálogo.
    await VentaItem.destroy({ where: { ventaId: venta.id }, transaction: t });

    let total = 0;
    const itemsParaCrear = [];
    for (const item of items) {
      const producto = await Producto.findByPk(item.productoId, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: `Producto id=${item.productoId} no encontrado.` });
      }
      const subtotal = producto.precio * item.cantidad;
      total += subtotal;
      itemsParaCrear.push({
        ventaId: venta.id,
        productoId: producto.id,
        nombreSnapshot: producto.nombre,
        precioUnitario: producto.precio,
        cantidad: item.cantidad,
        subtotal,
      });
    }
    await VentaItem.bulkCreate(itemsParaCrear, { transaction: t });

    // --- Paso 6: recalcular descuento sobre el nuevo total ---
    // Si el payload trae descuentoId (incluido null para quitarlo) usamos ese;
    // si NO viene la propiedad, conservamos el descuento que ya tenía la venta.
    let descuentoMonto = 0;
    let descuentoAplicadoId = null;
    const descuentoObjetivo =
      Object.prototype.hasOwnProperty.call(req.body, 'descuentoId')
        ? descuentoId
        : venta.descuentoId;

    if (descuentoObjetivo) {
      const descuento = await Descuento.findByPk(descuentoObjetivo, { transaction: t });
      if (!descuento) {
        await t.rollback();
        return res.status(404).json({ error: `Descuento id=${descuentoObjetivo} no encontrado.` });
      }
      if (!descuento.activo) {
        await t.rollback();
        return res.status(400).json({ error: 'El descuento seleccionado está inactivo.' });
      }
      if (descuento.tipo === 'porcentaje') {
        descuentoMonto = Math.round((total * descuento.valor) / 100);
      } else {
        descuentoMonto = descuento.valor;
      }
      if (descuentoMonto > total) descuentoMonto = total; // no negativo (RF-19)
      descuentoAplicadoId = descuento.id;
      total -= descuentoMonto;
    }

    // --- Recalcular cambio si paga efectivo ---
    let cambio = null;
    let efectivoFinal = null;
    if (metodoPago === 'efectivo') {
      if (efectivoRecibido == null || efectivoRecibido < total) {
        await t.rollback();
        return res.status(400).json({
          error: `Efectivo recibido (${efectivoRecibido ?? 0}) menor al total corregido (${total}).`,
        });
      }
      efectivoFinal = efectivoRecibido;
      cambio = efectivoRecibido - total;
    }

    // --- Paso 7: actualizar la venta + trazabilidad ---
    await venta.update(
      {
        metodoPago,
        clienteId: clienteId || null,
        total,
        efectivoRecibido: efectivoFinal,
        cambio,
        descuentoId: descuentoAplicadoId,
        descuentoMonto,
        observaciones: observaciones != null ? observaciones : venta.observaciones,
        modificadaPor: req.user ? req.user.username : 'sistema',
        modificadaEn: new Date(),
      },
      { transaction: t }
    );

    // --- Paso 8: snapshot POSTERIOR + fila de corrección ---
    const ventaActualizada = await Venta.findByPk(venta.id, {
      include: [{ model: VentaItem, as: 'items' }],
      transaction: t,
    });
    const estadoPosterior = serializarVenta(ventaActualizada);

    await CorreccionVenta.create(
      {
        ventaId: venta.id,
        corregidaPor: req.user ? req.user.username : 'sistema',
        estadoAnterior,
        estadoPosterior,
        motivo: motivo || null,
      },
      { transaction: t }
    );

    // --- Paso 9: commit ---
    await t.commit();

    const ventaCompleta = await Venta.findByPk(venta.id, {
      include: [
        { model: VentaItem, as: 'items' },
        { model: Cliente },
        { model: CorreccionVenta, as: 'correcciones' },
      ],
    });
    res.json({ mensaje: 'Venta corregida correctamente.', venta: ventaCompleta });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

/**
 * GET /api/ventas/:id/correcciones
 *
 * Devuelve el historial de correcciones de una venta (RF-51: "el sistema debe
 * registrar que una venta fue corregida"). Cada fila trae quién, cuándo, y el
 * antes/después en JSON.
 */
exports.historialCorrecciones = async (req, res, next) => {
  try {
    const venta = await Venta.findByPk(req.params.id);
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });

    const correcciones = await CorreccionVenta.findAll({
      where: { ventaId: req.params.id },
      order: [['createdAt', 'ASC']],
    });
    res.json(correcciones);
  } catch (err) { next(err); }
};
