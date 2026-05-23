'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CompraItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      compraId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Compras', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      productoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Snapshot del nombre, igual que VentaItem.
      nombreSnapshot: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      // En la compra es el costo unitario que pagó el negocio.
      costoUnitario: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      subtotal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CompraItems');
  },
};
