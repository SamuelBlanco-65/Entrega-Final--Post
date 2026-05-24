'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venta extends Model {
    static associate(models) {
      Venta.belongsTo(models.Cliente, { foreignKey: 'clienteId' });
      Venta.belongsTo(models.Descuento, { foreignKey: 'descuentoId' });
      // alias 'items' para que las consultas usen `include: 'items'` legible
      Venta.hasMany(models.VentaItem, { foreignKey: 'ventaId', as: 'items' });
      // Hito 3: historial de correcciones (RN-06) y reembolsos (RF-60+).
      // Inversas para poder hacer include: 'correcciones' / 'reembolsos'.
      Venta.hasMany(models.CorreccionVenta, { foreignKey: 'ventaId', as: 'correcciones' });
      Venta.hasMany(models.Reembolso, { foreignKey: 'ventaId', as: 'reembolsos' });
    }
  }

  Venta.init(
    {
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'cerrada',
      },
      metodoPago: DataTypes.STRING(20),
      clienteId: DataTypes.INTEGER,
      total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      efectivoRecibido: DataTypes.INTEGER,
      cambio: DataTypes.INTEGER,
      descuentoId: DataTypes.INTEGER,
      descuentoMonto: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      modificadaPor: DataTypes.STRING(150),
      modificadaEn: DataTypes.DATE,
      observaciones: DataTypes.TEXT,
    },
    { sequelize, modelName: 'Venta', tableName: 'Ventas' }
  );

  return Venta;
};
