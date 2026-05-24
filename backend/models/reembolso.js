'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reembolso extends Model {
    static associate(models) {
      Reembolso.belongsTo(models.Venta, { foreignKey: 'ventaId', as: 'venta' });
      // alias 'items' para poder hacer include: 'items', igual que en Venta/Compra.
      Reembolso.hasMany(models.ReembolsoItem, { foreignKey: 'reembolsoId', as: 'items' });
    }
  }

  Reembolso.init(
    {
      ventaId: { type: DataTypes.INTEGER, allowNull: false },
      tipo: { type: DataTypes.STRING(20), allowNull: false }, // total | parcial
      montoTotal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      fuente: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'caja' }, // RF-63
      reembolsadoPor: { type: DataTypes.STRING(150), allowNull: false },
      observaciones: DataTypes.TEXT,
    },
    { sequelize, modelName: 'Reembolso', tableName: 'Reembolsos' }
  );

  return Reembolso;
};
