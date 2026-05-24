'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { sequelize } = require('../models');

// Routers
const authRouter = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
const categoriasRouter = require('./routes/categorias');
const clientesRouter = require('./routes/clientes');
const proveedoresRouter = require('./routes/proveedores');
const productosRouter = require('./routes/productos');
const ventasRouter = require('./routes/ventas');
const comprasRouter = require('./routes/compras');
const descuentosRouter = require('./routes/descuentos');
const faltantesRouter = require('./routes/faltantes');
const reembolsosRouter = require('./routes/reembolsos');
const reportesRouter = require('./routes/reportes');

// Middlewares
const requestLogger = require('./middlewares/requestLogger');
const authJwt = require('./middlewares/authJwt');

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------------------------------------
// CORS
// -----------------------------------------------------------
const origins = (process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  })
);

// -----------------------------------------------------------
// Body parser - tope alto por imágenes base64 en Producto
// -----------------------------------------------------------
app.use(express.json({ limit: '10mb' }));

// -----------------------------------------------------------
// Logger global
// -----------------------------------------------------------
app.use(requestLogger);

// -----------------------------------------------------------
// Doc de endpoints (pública, sin token)
// -----------------------------------------------------------
app.get('/api', (req, res) => {
  res.json({
    nombre: 'POS Papel y Luna - Backend',
    version: '3.0.0',
    hito: 'Hito 3 - Corrección de ventas, reembolsos y reportes',
    publicas: ['POST /api/login', 'GET /api (esta doc)'],
    autenticadas: [
      'GET /api/me',
      'GET|POST /api/categorias, GET|PUT /api/categorias/:id (DELETE solo ADMIN)',
      'GET|POST /api/clientes, GET|PUT /api/clientes/:id (DELETE solo ADMIN)',
      'GET|POST /api/proveedores, GET|PUT /api/proveedores/:id (DELETE solo ADMIN)',
      'GET|POST /api/productos, GET|PUT /api/productos/:id (DELETE solo ADMIN)',
      'GET|POST /api/ventas, GET /api/ventas/:id (DELETE/anular solo ADMIN)',
      'GET /api/ventas/:id/reabrir, PUT /api/ventas/:id/corregir (solo ADMIN), GET /api/ventas/:id/correcciones',
      'POST /api/ventas/:ventaId/reembolsos (solo ADMIN), GET /api/ventas/:ventaId/reembolsos',
      'GET /api/reembolsos, GET /api/reembolsos/:id',
      'GET /api/reportes/ventas, /api/reportes/productos-mas-vendidos, /api/reportes/compras (?desde=&hasta=)',
      'GET|POST /api/compras, GET /api/compras/:id',
      'GET /api/descuentos, GET /api/descuentos/:id (POST|PUT|DELETE solo ADMIN)',
      'GET|POST /api/faltantes, PUT|PATCH|DELETE /api/faltantes/:id, GET /api/faltantes/reporte/frecuentes',
    ],
    soloAdmin: ['GET|POST|PUT|DELETE /api/usuarios'],
    credencialesDemo: {
      admin: 'username=admin, password=admin123',
      cajero: 'username=cajero, password=cajero123',
    },
  });
});

// -----------------------------------------------------------
// RUTAS PÚBLICAS (no requieren token)
// -----------------------------------------------------------
app.use('/api', authRouter); // /api/login (público), /api/me (protegido internamente)

// -----------------------------------------------------------
// RUTAS PROTEGIDAS
// authJwt verifica el token antes de pasar a cada router. Dentro de cada
// router, los DELETE críticos exigen además requireRole('ADMIN').
// -----------------------------------------------------------
app.use('/api/usuarios', usuariosRouter); // ya protege ADMIN internamente
app.use('/api/categorias', authJwt, categoriasRouter);
app.use('/api/clientes', authJwt, clientesRouter);
app.use('/api/proveedores', authJwt, proveedoresRouter);
app.use('/api/productos', authJwt, productosRouter);
app.use('/api/ventas', authJwt, ventasRouter);
app.use('/api/compras', authJwt, comprasRouter);
app.use('/api/descuentos', descuentosRouter); // protege authJwt internamente
app.use('/api/faltantes', faltantesRouter); // protege authJwt internamente
app.use('/api/reembolsos', reembolsosRouter); // protege authJwt internamente (consulta)
app.use('/api/reportes', reportesRouter); // protege authJwt internamente

// -----------------------------------------------------------
// 404
// -----------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// -----------------------------------------------------------
// Manejador global de errores
// -----------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ error: 'Ya existe un registro con esos datos.' });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ error: 'Referencia inválida a otra entidad.' });
  }
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// -----------------------------------------------------------
// Arranque
// -----------------------------------------------------------
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexión a base de datos establecida.');
    app.listen(PORT, () => {
      console.log(`✓ Servidor escuchando en http://localhost:${PORT}`);
      console.log(`  Documentación de endpoints: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('✗ No se pudo conectar a la BD:', err.message);
    process.exit(1);
  }
})();
