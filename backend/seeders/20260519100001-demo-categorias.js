'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
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
