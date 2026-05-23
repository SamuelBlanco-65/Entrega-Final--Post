'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CompraItem extends Model {
    static associate(models) {
      CompraItem.belongsTo(models.Compra, { foreignKey: 'compraId' });
      CompraItem.belongsTo(models.Producto, { foreignKey: 'productoId' });
    }
  }

  CompraItem.init(
    {
      compraId: { type: DataTypes.INTEGER, allowNull: false },
      productoId: DataTypes.INTEGER,
      nombreSnapshot: { type: DataTypes.STRING(150), allowNull: false },
      costoUnitario: { type: DataTypes.INTEGER, allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false },
      subtotal: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, modelName: 'CompraItem', tableName: 'CompraItems' }
  );

  return CompraItem;
};
