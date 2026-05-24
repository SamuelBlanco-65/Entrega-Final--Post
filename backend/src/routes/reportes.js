'use strict';
const express = require('express');
const ctrl = require('../controllers/reporte.controller');
const authJwt = require('../middlewares/authJwt');

const router = express.Router();

// Todos los reportes requieren autenticación (cualquier rol puede consultarlos).
router.use(authJwt);

// Sección 3.9 del documento de entrega.
router.get('/ventas', ctrl.ventasPorRango);                       // ventas totales por rango
router.get('/productos-mas-vendidos', ctrl.productosMasVendidos); // top productos por rango
router.get('/compras', ctrl.comprasPorRango);                     // compras por rango
// faltantes frecuentes YA EXISTE en /api/faltantes/reporte/frecuentes (Hito 2).

module.exports = router;
