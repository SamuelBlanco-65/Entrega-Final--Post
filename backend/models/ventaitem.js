'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VentaItem extends Model {
    static associate(models) {
      VentaItem.belongsTo(models.Venta, { foreignKey: 'ventaId' });
      VentaItem.belongsTo(models.Producto, { foreignKey: 'productoId' });
    }
  }

  VentaItem.init(
    {
      ventaId: { type: DataTypes.INTEGER, allowNull: false },
      productoId: DataTypes.INTEGER,
      nombreSnapshot: { type: DataTypes.STRING(150), allowNull: false },
      precioUnitario: { type: DataTypes.INTEGER, allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false },
      subtotal: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, modelName: 'VentaItem', tableName: 'VentaItems' }
  );

  return VentaItem;
};
