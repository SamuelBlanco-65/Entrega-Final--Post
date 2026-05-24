'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // RN-06: "El sistema debe almacenar el estado anterior y posterior de la
    // venta corregida." Una tabla aparte (en vez de campos en Venta) permite
    // conservar TODAS las correcciones: si una venta se corrige dos veces,
    // quedan dos filas, cada una con su antes/después. Si lo guardáramos en
    // columnas de Venta, la segunda corrección sobrescribiría a la primera.
    await queryInterface.createTable('CorreccionVentas', {
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
        onDelete: 'CASCADE', // si se borra la venta, su historial de correcciones se va con ella
      },
      // Trazabilidad (RNF-06): quién corrigió. Lo tomamos del token JWT
      // (req.user), nunca del body, porque el body es manipulable.
      corregidaPor: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      // Snapshot COMPLETO de la venta ANTES de corregir: total, descuento,
      // método de pago, cliente, e items (nombre/precio/cantidad/subtotal).
      // DataTypes.JSON es portable entre SQLite (dev) y PostgreSQL (prod).
      // Lo leemos como bloque entero; no consultamos campos internos, así que
      // no necesitamos JSONB.
      estadoAnterior: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      // Snapshot COMPLETO de la venta DESPUÉS de corregir.
      estadoPosterior: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      // Motivo opcional que el operador puede escribir.
      motivo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CorreccionVentas');
  },
};
