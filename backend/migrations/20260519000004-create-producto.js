'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Productos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      categoriaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Categorias', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // si se borra la categoría, el producto queda sin categoría
      },
      // "Por unidad" o "Por medida" según el documento de requerimientos (RF-82).
      unidadVenta: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'unidad',
      },
      costo: {
        // Precio de compra. Entero porque en COP no hay centavos.
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      precio: {
        // Precio de venta.
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      codigoInterno: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      codigoBarras: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      controlInventario: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // NULL si controlInventario es false. Si true, refleja el stock actual.
      stock: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      // URL o data-URI base64 de la imagen del producto.
      imagen: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Productos');
  },
};
