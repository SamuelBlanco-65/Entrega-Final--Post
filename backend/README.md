# POS Papel y Luna — Backend

Backend del sistema POS para papelería y miscelánea **Papel y Luna**. Implementado con **Node.js + Express + Sequelize**, con soporte para **PostgreSQL** (producción) y **SQLite** (desarrollo local).

## Estructura

```
backend/
├── config/
│   └── config.js              Config de Sequelize por entorno
├── migrations/                Migraciones de BD (estructura de tablas)
├── seeders/                   Datos demo (categorías, productos, etc.)
├── models/                    Modelos Sequelize con asociaciones
├── src/
│   ├── controllers/           Lógica de cada recurso
│   ├── validators/            Reglas de express-validator
│   ├── routes/                Definición de rutas Express
│   ├── middlewares/           requestLogger, handleValidationErrors
│   ├── utils/                 Helpers (validación COP)
│   └── app.js                 Punto de entrada
├── .env.example               Plantilla de variables de entorno
├── .sequelizerc               Config para sequelize-cli
└── package.json
```

## Requisitos

- Node.js >= 18
- npm

Para desarrollo local **NO** necesitas PostgreSQL: usamos SQLite (un archivo `database.sqlite` se crea automáticamente). Para producción sí se requiere PostgreSQL (Neon, Render, Supabase, etc.).

## Instalación

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` si quieres cambiar el puerto o el `JWT_SECRET` (este último se usará en el Hito 2).

## Comandos

```bash
# Aplicar migraciones (crea las tablas)
npm run db:migrate

# Cargar datos demo (categorías, productos, clientes, proveedores)
npm run db:seed

# Borrar TODA la base y volver a aplicar migraciones + seeders
npm run db:reset

# Levantar el servidor (modo producción)
npm start

# Levantar con auto-reload (desarrollo)
npm run dev
```

El servidor arranca en `http://localhost:3000`. Visita `http://localhost:3000/api` para ver la lista de endpoints.

## Setup rápido (primera vez)

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Luego abre otro terminal y prueba:

```bash
curl http://localhost:3000/api/productos
curl http://localhost:3000/api/clientes
```

## Endpoints del Hito 1

| Recurso | Métodos |
|---|---|
| `/api/categorias` | GET, POST |
| `/api/categorias/:id` | GET, PUT, DELETE |
| `/api/clientes` | GET, POST |
| `/api/clientes/:id` | GET, PUT, DELETE |
| `/api/proveedores` | GET, POST |
| `/api/proveedores/:id` | GET, PUT, DELETE |
| `/api/productos` | GET, POST |
| `/api/productos/:id` | GET, PUT, DELETE |
| `/api/ventas` | GET (con filtros `?desde&hasta&metodoPago&clienteId&estado`), POST |
| `/api/ventas/:id` | GET, DELETE (anula con restauración de stock) |
| `/api/compras` | GET (con filtros `?desde&hasta&proveedorId&metodoPago`), POST |
| `/api/compras/:id` | GET |

## Ejemplo: crear una venta

```bash
curl -X POST http://localhost:3000/api/ventas \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": 1,
    "metodoPago": "efectivo",
    "efectivoRecibido": 20000,
    "items": [
      { "productoId": 1, "cantidad": 1 },
      { "productoId": 5, "cantidad": 3 }
    ]
  }'
```

La respuesta incluye `id`, `total` calculado, `cambio` y los items con snapshot del nombre y precio. El stock de los productos se descuenta automáticamente.

## Ejemplo: registrar una compra con producto nuevo

```bash
curl -X POST http://localhost:3000/api/compras \
  -H "Content-Type: application/json" \
  -d '{
    "proveedorId": 1,
    "metodoPago": "efectivo",
    "items": [
      { "productoId": 1, "cantidad": 10, "costoUnitario": 6500 },
      {
        "productoNuevo": {
          "nombre": "Marcador permanente negro",
          "precio": 4500,
          "categoriaId": 2,
          "controlInventario": true
        },
        "cantidad": 24,
        "costoUnitario": 2500
      }
    ]
  }'
```

El producto nuevo se crea en el catálogo y su stock se inicializa con la cantidad comprada.

## Anular una venta (restaura stock)

```bash
curl -X DELETE http://localhost:3000/api/ventas/1 \
  -H "Content-Type: application/json" \
  -d '{ "observaciones": "Cliente devolvió el producto" }'
```

La venta queda con `estado="anulada"` (no se borra de la BD) y el stock de los items con `controlInventario=true` se restaura.

## Despliegue en producción

Para desplegar el backend en Render con Postgres en Neon:

1. Crea un proyecto en [Neon](https://neon.tech) y copia la connection string.
2. En Render, crea un nuevo **Web Service** apuntando al repositorio.
3. Configura las variables de entorno:
   - `NODE_ENV=production`
   - `DATABASE_URL=<connection string de Neon>`
   - `JWT_SECRET=<cadena aleatoria larga>`
   - `CORS_ORIGINS=<URL de tu frontend desplegado>`
4. Comando de build: `npm install`
5. Comando de start: `npm run db:migrate && npm start`

## Próximos hitos

- **Hito 2**: Autenticación con JWT, roles USER/ADMIN, gestión de descuentos y faltantes.
- **Hito 3**: Corrección de ventas, reembolsos, reportes.
- **Hito 4**: Migración del frontend para consumir este backend.
- **Hito 5**: Despliegue completo.
