'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Detalle por producto reembolsado. Mismo principio que VentaItem:
    // tabla relacional + snapshot de nombre, nunca JSON embebido.
    await queryInterface.createTable('ReembolsoItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      reembolsoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Reembolsos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Apunta al ítem de venta original que se está reembolsando. Sirve para
      // validar que no se reembolse más cantidad de la vendida.
      ventaItemId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'VentaItems', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Nullable + SET NULL igual que VentaItem: el producto puede haberse
      // borrado del catálogo. Si es null, no hay a qué devolver stock.
      productoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Snapshot del nombre al momento del reembolso.
      nombreSnapshot: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      // Cantidad reembolsada de este producto en este reembolso.
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      // Monto reembolsado por este ítem = precioUnitario original * cantidad.
      montoReembolsado: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      // RF-64 / RN-05: por cada producto reembolsado se decide si retorna a
      // inventario (true) o se marca como pérdida (false).
      retornaInventario: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ReembolsoItems');
  },
};
