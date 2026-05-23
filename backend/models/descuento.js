'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Descuento extends Model {
    static associate(models) {
      Descuento.hasMany(models.Venta, { foreignKey: 'descuentoId' });
    }
  }

  Descuento.init(
    {
      nombre: { type: DataTypes.STRING(100), allowNull: false },
      tipo: { type: DataTypes.STRING(20), allowNull: false },
      valor: { type: DataTypes.INTEGER, allowNull: false },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'Descuento',
      tableName: 'Descuentos',
    }
  );

  return Descuento;
};
