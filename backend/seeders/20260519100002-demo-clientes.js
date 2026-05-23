'use strict';

module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    await queryInterface.bulkInsert('Clientes', [
      { nombre: 'Cliente Mostrador', telefono: null, correo: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'María Restrepo', telefono: '3104567890', correo: 'maria.r@gmail.com', createdAt: ahora, updatedAt: ahora },
      { nombre: 'Juan Camilo Ortiz', telefono: '3209876543', correo: 'jcortiz@correo.com', createdAt: ahora, updatedAt: ahora },
      { nombre: 'Colegio San Marcos', telefono: '6017654321', correo: 'compras@sanmarcos.edu.co', createdAt: ahora, updatedAt: ahora },
      { nombre: 'Laura Pérez', telefono: '3015551234', correo: null, createdAt: ahora, updatedAt: ahora },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Clientes', null, {});
  },
};
