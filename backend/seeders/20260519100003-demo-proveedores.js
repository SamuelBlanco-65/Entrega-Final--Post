'use strict';

module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    await queryInterface.bulkInsert('Proveedores', [
      { nombre: 'Distribuidora Papelera S.A.', nit: '900.111.222-3', telefono: '6014445566', correo: 'ventas@distpapelera.com', createdAt: ahora, updatedAt: ahora },
      { nombre: 'Bic Colombia', nit: '800.555.444-1', telefono: '6017778899', correo: 'pedidos@biccolombia.com', createdAt: ahora, updatedAt: ahora },
      { nombre: 'Norma S.A.', nit: '890.123.456-7', telefono: '6012223344', correo: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Mayoreo La 13', nit: null, telefono: '3115557766', correo: null, createdAt: ahora, updatedAt: ahora },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Proveedores', null, {});
  },
};
