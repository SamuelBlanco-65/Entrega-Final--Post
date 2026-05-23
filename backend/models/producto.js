'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Producto extends Model {
    static associate(models) {
      Producto.belongsTo(models.Categoria, { foreignKey: 'categoriaId' });
      Producto.hasMany(models.VentaItem, { foreignKey: 'productoId' });
      Producto.hasMany(models.CompraItem, { foreignKey: 'productoId' });
    }
  }

  Producto.init(
    {
      nombre: { type: DataTypes.STRING(150), allowNull: false },
      categoriaId: DataTypes.INTEGER,
      unidadVenta: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'unidad',
      },
      costo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      precio: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      codigoInterno: DataTypes.STRING(50),
      codigoBarras: DataTypes.STRING(50),
      controlInventario: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      stock: DataTypes.INTEGER,
      imagen: DataTypes.TEXT,
    },
    { sequelize, modelName: 'Producto', tableName: 'Productos' }
  );

  return Producto;
};
