export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  material: string;
  imagenUrl: string;
  categoria: string;
  destacado: boolean;
  orden: number;
  activo: boolean;
}

export interface ProductFormData {
  nombre: string;
  descripcion: string;
  material: string;
  imagenUrl: string;
  categoria: string;
  destacado: boolean;
  orden: number;
  activo: boolean;
}

export const CATEGORIAS = [
  'figuras',
  'hogar',
  'accesorios',
  'herramientas',
  'decoracion',
  'organizacion',
  'juguetes',
  'tecnologia',
  'cajas',
  'pintura',
];

export const SEED_PRODUCTS: ProductFormData[] = [
  { nombre: 'Figura Articulada Dragón', descripcion: 'Figura de dragón con articulaciones móviles, ideal para coleccionistas.', material: 'Resina ABS-like', imagenUrl: '', categoria: 'figuras', destacado: true, orden: 1, activo: true },
  { nombre: 'Soporte para Laptop', descripcion: 'Soporte ergonómico plegable para laptop de hasta 15 pulgadas.', material: 'PLA+', imagenUrl: '', categoria: 'tecnologia', destacado: true, orden: 2, activo: true },
  { nombre: 'Maceta Geométrica', descripcion: 'Maceta con diseño geométrico moderno, incluye drenaje.', material: 'PETG', imagenUrl: '', categoria: 'hogar', destacado: true, orden: 3, activo: true },
  { nombre: 'Llavero Personalizado', descripcion: 'Llavero con diseño personalizable, resistente y ligero.', material: 'PLA', imagenUrl: '', categoria: 'accesorios', destacado: false, orden: 4, activo: true },
  { nombre: 'Organizador de Escritorio', descripcion: 'Organizador multinivel para lápices, clips y notas.', material: 'PLA+', imagenUrl: '', categoria: 'organizacion', destacado: true, orden: 5, activo: true },
  { nombre: 'Caja para Joyas', descripcion: 'Caja con compartimentos para anillos, collares y aretes.', material: 'PLA', imagenUrl: '', categoria: 'cajas', destacado: false, orden: 6, activo: true },
  { nombre: 'Portalápices Rocket', descripcion: 'Portalápices con forma de cohete, divertido y funcional.', material: 'PETG', imagenUrl: '', categoria: 'decoracion', destacado: false, orden: 7, activo: true },
  { nombre: 'Base para Celular', descripcion: 'Base ajustable para celular con carga inalámbrica compatible.', material: 'PLA+', imagenUrl: '', categoria: 'tecnologia', destacado: true, orden: 8, activo: true },
  { nombre: 'Caja de Herramientas Mini', descripcion: 'Caja portátil con separadores para herramientas pequeñas.', material: 'PETG', imagenUrl: '', categoria: 'herramientas', destacado: false, orden: 9, activo: true },
  { nombre: 'Marco para Fotos', descripcion: 'Marco minimalista para fotos 10x15cm con soporte trasero.', material: 'PLA', imagenUrl: '', categoria: 'decoracion', destacado: false, orden: 10, activo: true },
  { nombre: 'Jarrón Decorativo', descripcion: 'Jarrón con textura espiral, ideal para flores secas.', material: 'PLA+', imagenUrl: '', categoria: 'hogar', destacado: true, orden: 11, activo: true },
  { nombre: 'Caja para Herramientas D&D', descripcion: 'Caja organizadora para dados, fichas y accesorios de rol.', material: 'PLA', imagenUrl: '', categoria: 'cajas', destacado: false, orden: 12, activo: true },
  { nombre: 'Soporte para Audífonos', descripcion: 'Soporte de escritorio para audífonos over-ear.', material: 'PLA+', imagenUrl: '', categoria: 'tecnologia', destacado: true, orden: 13, activo: true },
  { nombre: 'Figura de Gato Articulado', descripcion: 'Figura de gato con patas y cola móviles.', material: 'Resina ABS-like', imagenUrl: '', categoria: 'figuras', destacado: false, orden: 14, activo: true },
  { nombre: 'Caja para Cosméticos', descripcion: 'Caja con bandeja extraíble para maquillaje y accesorios.', material: 'PLA', imagenUrl: '', categoria: 'cajas', destacado: false, orden: 15, activo: true },
  { nombre: 'Repisa Flotante', descripcion: 'Repisa decorativa con soporte oculto, soporta hasta 3kg.', material: 'PETG', imagenUrl: '', categoria: 'hogar', destacado: true, orden: 16, activo: true },
  { nombre: 'Portalápices Doble', descripcion: 'Portalápices con dos compartimentos y base antideslizante.', material: 'PLA+', imagenUrl: '', categoria: 'organizacion', destacado: false, orden: 17, activo: true },
  { nombre: 'Caja para Té', descripcion: 'Caja con 4 compartimentos para bolsitas de té.', material: 'PLA', imagenUrl: '', categoria: 'cajas', destacado: false, orden: 18, activo: true },
  { nombre: 'Llavero Dado', descripcion: 'Llavero con forma de dado de 6 caras, número grabado.', material: 'PLA', imagenUrl: '', categoria: 'accesorios', destacado: false, orden: 19, activo: true },
  { nombre: 'Soporte para Tablet', descripcion: 'Soporte plegable para tablet de 7 a 12 pulgadas.', material: 'PLA+', imagenUrl: '', categoria: 'tecnologia', destacado: true, orden: 20, activo: true },
  { nombre: 'Caja para Cartas Magic', descripcion: 'Caja con separador ajustable para cartas coleccionables.', material: 'PETG', imagenUrl: '', categoria: 'cajas', destacado: false, orden: 21, activo: true },
  { nombre: 'Maceta Colgante', descripcion: 'Maceta con diseño colgante y sistema de autorriego.', material: 'PLA+', imagenUrl: '', categoria: 'hogar', destacado: false, orden: 22, activo: true },
];
