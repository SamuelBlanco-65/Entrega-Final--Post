# POS Papel y Luna — Sistema Completo

Sistema de punto de venta (POS) para papelería y miscelánea, desarrollado como proyecto final de Desarrollo de Aplicaciones Web.

## Estructura del monorepo

```
pos-papel-y-luna/
├── backend/        Node.js + Express + Sequelize + PostgreSQL
└── frontend/       HTML + CSS + JavaScript vanilla
```

Cada carpeta tiene su propio `README.md` con instrucciones específicas.

## Arranque rápido (desarrollo local)

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Backend disponible en `http://localhost:3000`.

### Frontend

(Por migrar en el Hito 4. Por ahora el frontend está en su versión original conectado a Google Sheets.)

## Estado del proyecto

| Hito | Descripción | Estado |
|---|---|---|
| 1 | Backend base con CRUDs del MVP 1/2 | ✅ Completo |
| 2 | Autenticación JWT, descuentos, faltantes | Pendiente |
| 3 | Corrección de ventas, reembolsos, reportes | Pendiente |
| 4 | Migración del frontend al backend nuevo | Pendiente |
| 5 | Despliegue (Vercel + Render + Neon) | Pendiente |
