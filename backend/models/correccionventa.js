'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CorreccionVenta extends Model {
    static associate(models) {
      // Cada corrección pertenece a una venta. Alias 'correcciones' del lado
      // de Venta lo definimos en venta.js (hasMany).
      CorreccionVenta.belongsTo(models.Venta, { foreignKey: 'ventaId', as: 'venta' });
    }
  }

  CorreccionVenta.init(
    {
      ventaId: { type: DataTypes.INTEGER, allowNull: false },
      corregidaPor: { type: DataTypes.STRING(150), allowNull: false },
      // JSON con la foto completa de la venta antes/después (RN-06).
      estadoAnterior: { type: DataTypes.JSON, allowNull: false },
      estadoPosterior: { type: DataTypes.JSON, allowNull: false },
      motivo: DataTypes.TEXT,
    },
    { sequelize, modelName: 'CorreccionVenta', tableName: 'CorreccionVentas' }
  );

  return CorreccionVenta;
};
