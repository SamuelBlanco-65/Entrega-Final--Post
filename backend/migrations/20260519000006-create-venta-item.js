'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VentaItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      ventaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Ventas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // si borras la venta, sus items también
      },
      // Apunta al catálogo pero NO confiamos en este campo para mostrar la
      // factura, porque el producto puede haber cambiado de nombre/precio
      // o haber sido eliminado.
      productoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // SNAPSHOT: nombre y precio al momento de vender. La factura siempre se
      // arma con estos datos, no con los actuales del catálogo.
      nombreSnapshot: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      precioUnitario: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      subtotal: {
        // = precioUnitario * cantidad. Lo guardamos calculado para reportes
        // rápidos sin tener que multiplicar fila por fila.
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('VentaItems');
  },
};
