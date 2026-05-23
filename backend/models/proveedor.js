'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Proveedor extends Model {
    static associate(models) {
      Proveedor.hasMany(models.Compra, { foreignKey: 'proveedorId' });
    }
  }

  Proveedor.init(
    {
      nombre: { type: DataTypes.STRING(150), allowNull: false },
      nit: DataTypes.STRING(30),
      telefono: DataTypes.STRING(20),
      correo: DataTypes.STRING(254),
    },
    { sequelize, modelName: 'Proveedor', tableName: 'Proveedores' }
  );

  return Proveedor;
};
