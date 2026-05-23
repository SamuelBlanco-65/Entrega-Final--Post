'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Usuarios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      // username único: con esto se loguea. Más corto que un email,
      // adecuado para un POS donde el cajero teclea rápido.
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      // Nombre real, para mostrar en la UI ("Bienvenido, Juan").
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      // bcrypt hash. NUNCA texto plano. Longitud generosa porque los hashes
      // bcrypt rondan los 60 caracteres pero algunas variantes son más largas.
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // 'ADMIN' o 'USER'. Lo controlamos con un check del lado de la app.
      role: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'USER',
      },
      // Si un admin desactiva a un cajero, queda activo=false. Más limpio
      // que borrarlo (preserva historial de quién hizo qué).
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
    await queryInterface.dropTable('Usuarios');
  },
};
