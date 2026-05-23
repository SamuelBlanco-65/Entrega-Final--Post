'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Clientes', {
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
    await queryInterface.dropTable('Clientes');
  },
};
