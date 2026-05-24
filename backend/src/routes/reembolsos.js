'use strict';
const express = require('express');
const ctrl = require('../controllers/reembolso.controller');
const authJwt = require('../middlewares/authJwt');

const router = express.Router();

// Todo requiere autenticación. La consulta de reembolsos la puede ver
// cualquier usuario autenticado; la CREACIÓN va por /api/ventas/:ventaId/reembolsos
// y exige ADMIN allí.
router.use(authJwt);

router.get('/', ctrl.list);       // ?ventaId= opcional
router.get('/:id', ctrl.show);

module.exports = router;
