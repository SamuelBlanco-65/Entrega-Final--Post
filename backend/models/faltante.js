'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Faltante extends Model {
    static associate(models) {
      Faltante.belongsTo(models.Producto, { foreignKey: 'productoId' });
    }
  }

  Faltante.init(
    {
      nombreSolicitado: { type: DataTypes.STRING(150), allowNull: false },
      nombreNormalizado: { type: DataTypes.STRING(150), allowNull: false },
      tipo: { type: DataTypes.STRING(20), allowNull: false },
      cantidadSolicitada: DataTypes.INTEGER,
      observacion: DataTypes.TEXT,
      estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      productoId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Faltante',
      tableName: 'Faltantes',
    }
  );

  return Faltante;
};
