'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Compra extends Model {
    static associate(models) {
      Compra.belongsTo(models.Proveedor, { foreignKey: 'proveedorId' });
      Compra.hasMany(models.CompraItem, { foreignKey: 'compraId', as: 'items' });
    }
  }

  Compra.init(
    {
      proveedorId: DataTypes.INTEGER,
      metodoPago: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'efectivo',
      },
      total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      observaciones: DataTypes.TEXT,
    },
    { sequelize, modelName: 'Compra' }
  );

  return Compra;
};
