'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Categorias', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      color: {
        // Color de la categoría (hex tipo "#FF8800"). Opcional por requisito.
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      icono: {
        // Nombre del ícono (ej. "ti-school"). Opcional.
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Categorias');
  },
};
