'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { sequelize } = require('../models');

// Routers
const categoriasRouter = require('./routes/categorias');
const clientesRouter = require('./routes/clientes');
const proveedoresRouter = require('./routes/proveedores');
const productosRouter = require('./routes/productos');
const ventasRouter = require('./routes/ventas');
const comprasRouter = require('./routes/compras');

// Middlewares
const requestLogger = require('./middlewares/requestLogger');

const app = express();
const PORT = process.env.PORT || 3000;

// -----------------------------------------------------------
// CORS
// El frontend va desplegado en Vercel/Netlify y el backend en Render,
// dominios distintos. Sin CORS el navegador bloquea las peticiones.
// CORS_ORIGINS=* permite todo (dev); en producción se pone la URL real.
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
// Body parser - tope alto porque guardamos imágenes en base64 en Producto
// -----------------------------------------------------------
app.use(express.json({ limit: '10mb' }));

// -----------------------------------------------------------
// Logger global
// -----------------------------------------------------------
app.use(requestLogger);

// -----------------------------------------------------------
// Rutas
// -----------------------------------------------------------
app.use('/api/categorias', categoriasRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/productos', productosRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/compras', comprasRouter);

// Ruta raíz de la API: documentación auto-generada de endpoints disponibles.
app.get('/api', (req, res) => {
  res.json({
    nombre: 'POS Papel y Luna - Backend',
    version: '1.0.0',
    hito: 'Hito 1 - Backend base con CRUDs del MVP 1/2',
    endpoints: {
      categorias: 'GET|POST /api/categorias, GET|PUT|DELETE /api/categorias/:id',
      clientes: 'GET|POST /api/clientes, GET|PUT|DELETE /api/clientes/:id',
      proveedores: 'GET|POST /api/proveedores, GET|PUT|DELETE /api/proveedores/:id',
      productos: 'GET|POST /api/productos, GET|PUT|DELETE /api/productos/:id',
      ventas:
        'GET /api/ventas (?desde&hasta&metodoPago&clienteId&estado), POST /api/ventas, DELETE /api/ventas/:id (anula)',
      compras: 'GET /api/compras (?desde&hasta&proveedorId&metodoPago), POST /api/compras',
    },
  });
});

// -----------------------------------------------------------
// 404 para rutas no reconocidas
// -----------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// -----------------------------------------------------------
// Manejador global de errores
// -----------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[error]', err);
  // Errores de Sequelize por unicidad/FK los devolvemos como 400 más legibles
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
