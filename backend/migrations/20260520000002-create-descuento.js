'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Descuentos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      // 'porcentaje' (valor 0-100) o 'valor_fijo' (entero COP)
      tipo: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      // Si tipo='porcentaje', es 0-100. Si tipo='valor_fijo', es la cantidad en COP.
      valor: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      // Si está inactivo, no aparece en el selector al cobrar.
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Descuentos');
  },
};
