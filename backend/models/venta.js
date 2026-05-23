'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venta extends Model {
    static associate(models) {
      Venta.belongsTo(models.Cliente, { foreignKey: 'clienteId' });
      // alias 'items' para que las consultas usen `include: 'items'` legible
      Venta.hasMany(models.VentaItem, { foreignKey: 'ventaId', as: 'items' });
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
      modificadaPor: DataTypes.STRING(150),
      modificadaEn: DataTypes.DATE,
      observaciones: DataTypes.TEXT,
    },
    { sequelize, modelName: 'Venta' }
  );

  return Venta;
};
