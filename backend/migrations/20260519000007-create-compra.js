'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Compras', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      proveedorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Proveedores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // RF-98: Efectivo / Nequi / Consignación
      metodoPago: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'efectivo',
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Compras');
  },
};
