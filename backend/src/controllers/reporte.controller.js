'use strict';
const { sequelize, Venta, VentaItem, Compra } = require('../../models');
const { Op } = sequelize.Sequelize;

/**
 * Construye un filtro de rango de fechas sobre createdAt a partir de los query
 * params ?desde y ?hasta (formato YYYY-MM-DD o ISO).
 *
 * Detalle clave: si "hasta" viene como fecha sin hora (ej. "2026-05-20"),
 * JS lo interpreta como 2026-05-20T00:00:00, y un filtro <= dejaría fuera todo
 * lo ocurrido ESE día. Por eso, si detectamos que "hasta" no trae hora,
 * empujamos el límite al final del día (23:59:59.999).
 *
 * Devuelve { ok, where, error }.
 */
function construirRangoFechas(desde, hasta) {
  if (!desde || !hasta) {
    return { ok: false, error: 'Debe indicar "desde" y "hasta" (rango mínimo de 1 día).' };
  }

  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
    return { ok: false, error: 'Fechas inválidas. Usa formato YYYY-MM-DD.' };
  }

  // Si "hasta" no incluye una hora explícita, lo llevamos al fin del día.
  if (!String(hasta).includes('T') && !String(hasta).includes(':')) {
    fechaHasta.setHours(23, 59, 59, 999);
  }

  if (fechaDesde > fechaHasta) {
    return { ok: false, error: 'La fecha "desde" no puede ser posterior a "hasta".' };
  }

  return {
    ok: true,
    where: { createdAt: { [Op.gte]: fechaDesde, [Op.lte]: fechaHasta } },
  };
}

/**
 * GET /api/reportes/ventas?desde=&hasta=
 *
 * Ventas totales por rango de fechas (sección 3.9). Cuenta solo ventas NO
 * anuladas (las anuladas no representan ingreso). Devuelve número de ventas,
 * suma de totales y suma de descuentos aplicados.
 */
exports.ventasPorRango = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const rango = construirRangoFechas(desde, hasta);
    if (!rango.ok) return res.status(400).json({ error: rango.error });

    const where = { ...rango.where, estado: { [Op.ne]: 'anulada' } };

    const { fn, col } = sequelize.Sequelize;
    const resultado = await Venta.findOne({
      where,
      attributes: [
        [fn('COUNT', col('id')), 'numeroVentas'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'totalVendido'],
        [fn('COALESCE', fn('SUM', col('descuentoMonto')), 0), 'totalDescuentos'],
      ],
      raw: true,
    });

    res.json({
      desde,
      hasta,
      numeroVentas: Number(resultado.numeroVentas) || 0,
      totalVendido: Number(resultado.totalVendido) || 0,
      totalDescuentos: Number(resultado.totalDescuentos) || 0,
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/reportes/productos-mas-vendidos?desde=&hasta=&limite=
 *
 * Productos más vendidos por rango de fechas (sección 3.9). Agrupa los
 * VentaItem de ventas no anuladas por nombreSnapshot (robusto frente a
 * productos borrados) y suma cantidades e ingresos.
 */
exports.productosMasVendidos = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const limite = Math.min(Number(req.query.limite) || 10, 100);
    const rango = construirRangoFechas(desde, hasta);
    if (!rango.ok) return res.status(400).json({ error: rango.error });

    const { fn, col } = sequelize.Sequelize;

    // Unimos VentaItem con su Venta para filtrar por fecha y excluir anuladas.
    // NOTA PostgreSQL: Postgres es estricto con GROUP BY y con los alias de
    // columnas agregadas. Por eso:
    //  - referenciamos las columnas con su nombre simple (sin prefijo de modelo),
    //  - en el ORDER BY usamos la MISMA expresión agregada (no el alias), porque
    //    Postgres no permite ordenar por alias dentro de funciones igual que SQLite.
    const filas = await VentaItem.findAll({
      attributes: [
        'productoId',
        'nombreSnapshot',
        [fn('SUM', col('VentaItem.cantidad')), 'cantidadVendida'],
        [fn('SUM', col('VentaItem.subtotal')), 'ingresoTotal'],
      ],
      include: [{
        model: Venta,
        attributes: [],
        required: true,
        where: { ...rango.where, estado: { [Op.ne]: 'anulada' } },
      }],
      group: ['VentaItem.productoId', 'VentaItem.nombreSnapshot'],
      order: [[fn('SUM', col('VentaItem.cantidad')), 'DESC']],
      limit: limite,
      subQuery: false,
      raw: true,
    });

    res.json(filas.map((f) => ({
      productoId: f.productoId,
      nombre: f.nombreSnapshot,
      cantidadVendida: Number(f.cantidadVendida) || 0,
      ingresoTotal: Number(f.ingresoTotal) || 0,
    })));
  } catch (err) { next(err); }
};

/**
 * GET /api/reportes/compras?desde=&hasta=
 *
 * Compras registradas por rango de fechas (sección 3.9). Devuelve número de
 * compras y total invertido, desglosado por método de pago.
 */
exports.comprasPorRango = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const rango = construirRangoFechas(desde, hasta);
    if (!rango.ok) return res.status(400).json({ error: rango.error });

    const { fn, col } = sequelize.Sequelize;

    // Totales generales.
    const general = await Compra.findOne({
      where: rango.where,
      attributes: [
        [fn('COUNT', col('id')), 'numeroCompras'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'totalComprado'],
      ],
      raw: true,
    });

    // Desglose por método de pago (efectivo / nequi / consignacion).
    const porMetodo = await Compra.findAll({
      where: rango.where,
      attributes: [
        'metodoPago',
        [fn('COUNT', col('id')), 'numeroCompras'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'total'],
      ],
      group: ['metodoPago'],
      raw: true,
    });

    res.json({
      desde,
      hasta,
      numeroCompras: Number(general.numeroCompras) || 0,
      totalComprado: Number(general.totalComprado) || 0,
      porMetodoPago: porMetodo.map((m) => ({
        metodoPago: m.metodoPago,
        numeroCompras: Number(m.numeroCompras) || 0,
        total: Number(m.total) || 0,
      })),
    });
  } catch (err) { next(err); }
};
