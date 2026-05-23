'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cliente extends Model {
    static associate(models) {
      Cliente.hasMany(models.Venta, { foreignKey: 'clienteId' });
    }
  }

  Cliente.init(
    {
      nombre: { type: DataTypes.STRING(150), allowNull: false },
      telefono: DataTypes.STRING(20),
      correo: DataTypes.STRING(254),
    },
    { sequelize, modelName: 'Cliente', tableName: 'Clientes' }
  );

  return Cliente;
};
