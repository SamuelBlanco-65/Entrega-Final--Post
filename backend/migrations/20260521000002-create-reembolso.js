'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // RF-60 a RF-65: cabecera de un reembolso sobre una venta cerrada.
    // Una venta puede tener VARIOS reembolsos parciales (RF-61), por eso
    // es una tabla con FK a Venta y no un campo en Venta.
    await queryInterface.createTable('Reembolsos', {
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
        onDelete: 'CASCADE',
      },
      // total | parcial (RF-61). Lo guardamos calculado al momento para
      // poder mostrarlo en historial sin recomputar.
      tipo: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      // Suma de montoReembolsado de todos sus items, en COP enteros.
      montoTotal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // RF-63: "Fuente del reembolso" con "Caja" por defecto. Es informativo:
      // registramos qué dijo el operador, no movemos dinero real (el documento
      // dice que no hay integración real de pagos).
      fuente: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'caja',
      },
      // Trazabilidad (RNF-06): quién hizo el reembolso. Del token, no del body.
      reembolsadoPor: {
        type: Sequelize.STRING(150),
        allowNull: false,
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
    await queryInterface.dropTable('Reembolsos');
  },
};
