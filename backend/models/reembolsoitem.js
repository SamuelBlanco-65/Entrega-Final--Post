'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReembolsoItem extends Model {
    static associate(models) {
      ReembolsoItem.belongsTo(models.Reembolso, { foreignKey: 'reembolsoId' });
      ReembolsoItem.belongsTo(models.VentaItem, { foreignKey: 'ventaItemId' });
      ReembolsoItem.belongsTo(models.Producto, { foreignKey: 'productoId' });
    }
  }

  ReembolsoItem.init(
    {
      reembolsoId: { type: DataTypes.INTEGER, allowNull: false },
      ventaItemId: DataTypes.INTEGER,
      productoId: DataTypes.INTEGER,
      nombreSnapshot: { type: DataTypes.STRING(150), allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false },
      montoReembolsado: { type: DataTypes.INTEGER, allowNull: false },
      // RF-64 / RN-05: retorna a inventario (true) o pérdida (false).
      retornaInventario: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { sequelize, modelName: 'ReembolsoItem', tableName: 'ReembolsoItems' }
  );

  return ReembolsoItem;
};
