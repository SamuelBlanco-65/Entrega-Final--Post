'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    // Idempotente y SEGURO: si ya existen categorías, no hacemos nada. Así,
    // correr el seeder varias veces NO duplica datos, y NO borramos nada (lo
    // que evita romper llaves foráneas de productos/ventas que ya existan).
    // rawSelect es portable entre SQLite (dev) y PostgreSQL (prod).
    const existe = await queryInterface.rawSelect('Categorias', { limit: 1 }, ['id']);
    if (existe) {
      return; // ya hay datos, no duplicar
    }
    await queryInterface.bulkInsert('Categorias', [
      { nombre: 'Cuadernos', color: '#3266ad', icono: 'ti-notebook', createdAt: ahora, updatedAt: ahora },
      { nombre: 'Escritura', color: '#0F6E56', icono: 'ti-pencil', createdAt: ahora, updatedAt: ahora },
      { nombre: 'Arte', color: '#D85A30', icono: 'ti-palette', createdAt: ahora, updatedAt: ahora },
      { nombre: 'Oficina', color: '#5F5E5A', icono: 'ti-paperclip', createdAt: ahora, updatedAt: ahora },
      { nombre: 'Empaque', color: '#BA7517', icono: 'ti-box', createdAt: ahora, updatedAt: ahora },
      { nombre: 'Miscelánea', color: '#D4537E', icono: 'ti-sparkles', createdAt: ahora, updatedAt: ahora },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Categorias', null, {});
  },
};
