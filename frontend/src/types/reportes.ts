export interface Colaborador {
  uid: string;
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  categorias: string[];
  rol: string;
}

export interface ProductoDetalle {
  nombre?: string;
  descripcion?: string;
  pesoGramos?: number;
  tiempoHoras?: number;
  tiempoMinutos?: number;
  filamentoUsado?: number;
  costoDiseno?: number;
  costoAccesorios?: number;
  costoEmpaque?: number;
  costoPersonalizacion?: number;
  valorUnitario?: number;
  tamanoHorizontal?: number;
  tamanoVertical?: number;
}

export interface ReportItem {
  quote_id?: string;
  producto_id?: string;
  categoria: string;
  descripcion: string;
  actividad?: string;
  cantidad: number;
  valor: number;
  notas?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  origen?: string;
  productoDetalle?: ProductoDetalle;
}

export interface ReportData {
  id: string;
  colaboradorUid: string;
  colaboradorNombre: string;
  periodo: string;
  categorias: string[];
  items: ReportItem[];
  notas?: string;
  estado?: string;
  totalesPorCategoria: Record<string, number>;
  totalAPagar: number;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface ReportCreate {
  colaboradorUid: string;
  colaboradorNombre: string;
  periodo: string;
  categorias: string[];
  items: ReportItem[];
  notas?: string;
  estado?: string;
}

export interface ComparativaColaborador {
  uid: string;
  nombre: string;
  totalGanado: number;
  totalItems: number;
  itemsPorCategoria: Record<string, number>;
  valorPorCategoria: Record<string, number>;
}

export interface FiltrosReportes {
  periodo: string;
  colaboradores: string[];
  categoria: string;
}
