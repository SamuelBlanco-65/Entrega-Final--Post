'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // RN-08: solo un descuento activo por venta. Con una FK directa lo
    // garantizamos a nivel de schema.
    await queryInterface.addColumn('Ventas', 'descuentoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Descuentos', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    // Snapshot del monto del descuento aplicado en COP. Si después editas
    // el descuento "10% verano" para que valga 15%, las ventas viejas no
    // deben cambiar.
    await queryInterface.addColumn('Ventas', 'descuentoMonto', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Ventas', 'descuentoMonto');
    await queryInterface.removeColumn('Ventas', 'descuentoId');
  },
};
