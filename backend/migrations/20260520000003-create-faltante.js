'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Faltantes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      // Texto libre del nombre solicitado. No hay FK a Producto porque puede
      // ser un producto que ni siquiera existe en el catálogo (RF-151b).
      nombreSolicitado: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      // Versión normalizada para agrupar (lowercase, sin tildes, sin espacios
      // sobrantes). Permite consolidar "cofias" y "Cofia" en el reporte (RN-10).
      nombreNormalizado: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      // 'agotado' (existe pero sin stock) o 'no_registrado' (no en catálogo). RF-151
      tipo: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      cantidadSolicitada: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      observacion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // 'pendiente', 'resuelto', 'descartado' (RF-153)
      estado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      // FK opcional al producto si después se crea/registra. RF-156.
      productoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Faltantes');
  },
};
