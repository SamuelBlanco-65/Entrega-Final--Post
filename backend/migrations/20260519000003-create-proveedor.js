'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Proveedores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      // El doc de requerimientos pide NIT mínimo, lo guardamos como string para
      // poder soportar formatos con guion ("900.123.456-7").
      nit: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      correo: {
        type: Sequelize.STRING(254),
        allowNull: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Proveedores');
  },
};
