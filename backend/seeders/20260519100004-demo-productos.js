'use strict';

/**
 * Productos demo. Los precios siguen las reglas COP (múltiplos de 50, sin
 * decimales). Las categoriaId asumen el orden del seeder de Categorías:
 *   1: Cuadernos, 2: Escritura, 3: Arte, 4: Oficina, 5: Empaque, 6: Miscelánea
 */
module.exports = {
  async up(queryInterface) {
    const ahora = new Date();
    await queryInterface.bulkInsert('Productos', [
      // Cuadernos
      { nombre: 'Cuaderno argollado 100h cuadriculado', categoriaId: 1, unidadVenta: 'unidad', costo: 6500, precio: 9500, codigoInterno: 'PROD-0001', codigoBarras: null, controlInventario: true, stock: 24, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Cuaderno cosido 50h doble línea', categoriaId: 1, unidadVenta: 'unidad', costo: 3500, precio: 5000, codigoInterno: 'PROD-0002', codigoBarras: null, controlInventario: true, stock: 40, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Block iris cuadriculado', categoriaId: 1, unidadVenta: 'unidad', costo: 2500, precio: 4000, codigoInterno: 'PROD-0003', codigoBarras: null, controlInventario: true, stock: 15, imagen: null, createdAt: ahora, updatedAt: ahora },

      // Escritura
      { nombre: 'Lápiz negro Mirado #2', categoriaId: 2, unidadVenta: 'unidad', costo: 800, precio: 1500, codigoInterno: 'PROD-0004', codigoBarras: null, controlInventario: true, stock: 120, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Bolígrafo Bic cristal negro', categoriaId: 2, unidadVenta: 'unidad', costo: 700, precio: 1500, codigoInterno: 'PROD-0005', codigoBarras: null, controlInventario: true, stock: 200, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Borrador Pelikan', categoriaId: 2, unidadVenta: 'unidad', costo: 600, precio: 1000, codigoInterno: 'PROD-0006', codigoBarras: null, controlInventario: true, stock: 80, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Tajalápiz doble', categoriaId: 2, unidadVenta: 'unidad', costo: 1200, precio: 2500, codigoInterno: 'PROD-0007', codigoBarras: null, controlInventario: true, stock: 30, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Resaltador Stabilo amarillo', categoriaId: 2, unidadVenta: 'unidad', costo: 2500, precio: 4500, codigoInterno: 'PROD-0008', codigoBarras: null, controlInventario: true, stock: 18, imagen: null, createdAt: ahora, updatedAt: ahora },

      // Arte
      { nombre: 'Colores Norma x12', categoriaId: 3, unidadVenta: 'unidad', costo: 8500, precio: 14500, codigoInterno: 'PROD-0009', codigoBarras: null, controlInventario: true, stock: 12, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Témpera 12 colores', categoriaId: 3, unidadVenta: 'unidad', costo: 9000, precio: 14000, codigoInterno: 'PROD-0010', codigoBarras: null, controlInventario: true, stock: 8, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Pincel #6 cerda suave', categoriaId: 3, unidadVenta: 'unidad', costo: 1800, precio: 3000, codigoInterno: 'PROD-0011', codigoBarras: null, controlInventario: true, stock: 25, imagen: null, createdAt: ahora, updatedAt: ahora },

      // Oficina
      { nombre: 'Resma papel carta 75gr', categoriaId: 4, unidadVenta: 'unidad', costo: 15500, precio: 21500, codigoInterno: 'PROD-0012', codigoBarras: null, controlInventario: true, stock: 6, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Carpeta plástica oficio', categoriaId: 4, unidadVenta: 'unidad', costo: 1500, precio: 3000, codigoInterno: 'PROD-0013', codigoBarras: null, controlInventario: true, stock: 50, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Cinta scotch transparente', categoriaId: 4, unidadVenta: 'unidad', costo: 1800, precio: 3500, codigoInterno: 'PROD-0014', codigoBarras: null, controlInventario: true, stock: 28, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Grapas estándar caja x5000', categoriaId: 4, unidadVenta: 'unidad', costo: 3500, precio: 6000, codigoInterno: 'PROD-0015', codigoBarras: null, controlInventario: true, stock: 10, imagen: null, createdAt: ahora, updatedAt: ahora },

      // Empaque
      { nombre: 'Bolsa kraft mediana', categoriaId: 5, unidadVenta: 'unidad', costo: 350, precio: 600, codigoInterno: 'PROD-0016', codigoBarras: null, controlInventario: true, stock: 200, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Cinta de regalo metalizada', categoriaId: 5, unidadVenta: 'medida', costo: 1500, precio: 2500, codigoInterno: 'PROD-0017', codigoBarras: null, controlInventario: false, stock: null, imagen: null, createdAt: ahora, updatedAt: ahora },

      // Miscelánea (sin control de inventario, ejemplo)
      { nombre: 'Servicio de impresión b/n', categoriaId: 6, unidadVenta: 'unidad', costo: 100, precio: 500, codigoInterno: 'PROD-0018', codigoBarras: null, controlInventario: false, stock: null, imagen: null, createdAt: ahora, updatedAt: ahora },
      { nombre: 'Plastificado tamaño carta', categoriaId: 6, unidadVenta: 'unidad', costo: 1500, precio: 3000, codigoInterno: 'PROD-0019', codigoBarras: null, controlInventario: false, stock: null, imagen: null, createdAt: ahora, updatedAt: ahora },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Productos', null, {});
  },
};
