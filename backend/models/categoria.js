'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Categoria extends Model {
    static associate(models) {
      Categoria.hasMany(models.Producto, { foreignKey: 'categoriaId' });
    }
  }

  Categoria.init(
    {
      nombre: { type: DataTypes.STRING(80), allowNull: false },
      color: DataTypes.STRING(20),
      icono: DataTypes.STRING(50),
    },
    { sequelize, modelName: 'Categoria', tableName: 'Categorias' }
  );

  return Categoria;
};
