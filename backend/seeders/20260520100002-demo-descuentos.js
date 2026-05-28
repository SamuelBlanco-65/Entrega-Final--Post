'use strict';

module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    const existe = await queryInterface.rawSelect('Descuentos', { limit: 1 }, ['id']);
    if (existe) return;
    await queryInterface.bulkInsert('Descuentos', [
      { nombre: 'Promo 10%', tipo: 'porcentaje', valor: 10, activo: true, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Promo 20% temporada escolar', tipo: 'porcentaje', valor: 20, activo: true, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Cliente frecuente -$2000', tipo: 'valor_fijo', valor: 2000, activo: true, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Liquidación viejo (inactivo)', tipo: 'porcentaje', valor: 50, activo: false, createdAt: ahora, updatedAt: ahora },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Descuentos', null, {});
  },
};
