'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const ahora = new Date();

    // Hash de passwords. SALT_ROUNDS=10 es un equilibrio razonable entre
    // seguridad y velocidad. Cada hash tarda ~80ms en generar.
    const SALT_ROUNDS = 10;

    await queryInterface.bulkInsert('Usuarios', [
      {
        username: 'admin',
        nombre: 'Administrador',
        password: await bcrypt.hash('admin123', SALT_ROUNDS),
        role: 'ADMIN',
        activo: true,
        createdAt: ahora,
        updatedAt: ahora,
      },
      {
        username: 'cajero',
        nombre: 'Cajero Demo',
        password: await bcrypt.hash('cajero123', SALT_ROUNDS),
        role: 'USER',
        activo: true,
        createdAt: ahora,
        updatedAt: ahora,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Usuarios', null, {});
  },
};
