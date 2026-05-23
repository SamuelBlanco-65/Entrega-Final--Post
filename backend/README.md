# POS Papel y Luna — Backend

Backend del sistema POS **Papel y Luna**. Node.js + Express + Sequelize, con PostgreSQL (producción) y SQLite (desarrollo local).

## Estado: Hito 2 completado

- **Hito 1**: CRUDs base (productos, ventas, compras, clientes, proveedores, categorías) ✅
- **Hito 2**: Autenticación JWT, roles ADMIN/USER, descuentos, faltantes ✅

## Requisitos

- Node.js >= 18
- npm

## Instalación

```bash
cd backend
npm install
cp .env.example .env
```

Edita `.env` y cambia `JWT_SECRET` por una cadena larga y aleatoria.

## Comandos

```bash
npm run db:migrate    # crea las tablas
npm run db:seed       # carga datos demo
npm run db:reset      # borra todo y reaplica migraciones + seeders
npm run dev           # arranca con auto-reload
npm start             # arranca en modo producción
```

## Setup rápido (primera vez)

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

## Usuarios demo

| Username | Password | Rol |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `cajero` | `cajero123` | USER |

## Autenticación

Casi todas las rutas requieren un token JWT. Para obtenerlo:

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "admin", "password": "admin123" }'
```

La respuesta incluye un `token`. Inclúyelo en las demás peticiones:

```
Authorization: Bearer <token>
```

## Endpoints

### Públicos
- `POST /api/login` — autenticación
- `GET /api` — documentación

### Autenticados (cualquier rol)
- `GET /api/me` — datos del usuario actual
- `GET|POST /api/categorias`, `GET|PUT /api/categorias/:id`
- `GET|POST /api/clientes`, `GET|PUT /api/clientes/:id`
- `GET|POST /api/proveedores`, `GET|PUT /api/proveedores/:id`
- `GET|POST /api/productos`, `GET|PUT /api/productos/:id`
- `GET|POST /api/ventas`, `GET /api/ventas/:id`
- `GET|POST /api/compras`, `GET /api/compras/:id`
- `GET /api/descuentos`, `GET /api/descuentos/:id`
- `GET|POST /api/faltantes`, `GET|PUT|PATCH|DELETE /api/faltantes/:id`
- `GET /api/faltantes/reporte/frecuentes`

### Solo ADMIN
- `DELETE` de categorías, clientes, proveedores, productos y ventas (anular)
- `POST|PUT|DELETE /api/descuentos`
- `GET|POST|PUT|DELETE /api/usuarios`

## Aplicar un descuento a una venta

Incluye `descuentoId` en el body al crear la venta:

```bash
curl -X POST http://localhost:3000/api/ventas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "metodoPago": "efectivo",
    "efectivoRecibido": 20000,
    "descuentoId": 1,
    "items": [{ "productoId": 1, "cantidad": 1 }]
  }'
```

El total se calcula, se aplica el descuento (porcentaje o valor fijo), y se guarda `descuentoMonto` como snapshot. Nunca produce total negativo.

## Próximos hitos

- **Hito 3**: corrección de ventas, reembolsos, reportes
- **Hito 4**: migración del frontend
- **Hito 5**: despliegue
