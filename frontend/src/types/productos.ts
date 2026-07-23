export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  material: string;
  imagenFrontal: string;
  imagenLateral: string;
  imagenTrasera: string;
  imagenDiagonal: string;
  categoria: string;
  destacado: boolean;
  orden: number;
  activo: boolean;
}

export interface ProductFormData {
  nombre: string;
  descripcion: string;
  material: string;
  imagenFrontal: string;
  imagenLateral: string;
  imagenTrasera: string;
  imagenDiagonal: string;
  categoria: string;
  destacado: boolean;
  orden: number;
  activo: boolean;
}
