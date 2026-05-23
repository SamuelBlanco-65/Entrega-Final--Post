'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Ventas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      // RF-10/15/24/70: estados posibles del documento de requerimientos.
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'cerrada', // por defecto las ventas se crean ya cobradas
      },
      // RF-21: Efectivo / Nequi / Debe. Permitimos null para ventas "abiertas"
      // que aún no se cobran.
      metodoPago: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      clienteId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Clientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // Solo aplica si metodoPago = "Efectivo".
      efectivoRecibido: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      cambio: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      // RNF-06: auditoría. Quién corrigió/anuló por última vez (texto libre por
      // ahora; en Hito 2 lo enlazaremos al Usuario que hace la acción).
      modificadaPor: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      modificadaEn: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // Observaciones libres (ej. razón de anulación).
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Ventas');
  },
};
