'use strict';
const express = require('express');
const ctrl = require('../controllers/auth.controller');
const { loginRules } = require('../validators/auth.validator');
const handleValidation = require('../middlewares/handleValidationErrors');
const authJwt = require('../middlewares/authJwt');

const router = express.Router();

// Públicas
router.post('/login', loginRules, handleValidation, ctrl.login);

// Requiere token válido
router.get('/me', authJwt, ctrl.me);

module.exports = router;
