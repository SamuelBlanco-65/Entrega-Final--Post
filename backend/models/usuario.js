'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate() {
      // sin asociaciones por ahora. Si quisiéramos auditar quién hizo qué
      // venta, podríamos agregar Usuario.hasMany(Venta) más adelante.
    }
  }

  Usuario.init(
    {
      username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      nombre: { type: DataTypes.STRING(150), allowNull: false },
      password: { type: DataTypes.STRING(255), allowNull: false },
      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'USER',
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'Usuario',
      tableName: 'Usuarios',
      // Por defecto el password nunca sale en findAll/findByPk: hay que
      // pedirlo explícitamente con .scope('withPassword') o attributes.
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
      },
    }
  );

  return Usuario;
};
