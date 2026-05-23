require('dotenv').config();

/**
 * Configuración de Sequelize por entorno.
 *
 * - development: SQLite local (un archivo). Útil mientras desarrollas: no
 *   necesitas tener PostgreSQL instalado. Para tu equipo basta con clonar
 *   y correr `npm run db:reset`.
 * - test: SQLite en memoria, para pruebas (no se persiste nada).
 * - production: PostgreSQL real. Lee la URL de DATABASE_URL (Render, Neon
 *   y similares la inyectan así).
 */
module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false, // pon true si quieres ver el SQL en consola
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Neon/Render usan certificados firmados por intermediarios
      },
    },
  },
};
