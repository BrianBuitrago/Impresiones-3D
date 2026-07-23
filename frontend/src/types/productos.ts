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
