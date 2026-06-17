export interface Colaborador {
  uid: string;
  nombre: string;
  cedula: string;
  email: string;
  telefono: string;
  categorias: string[];
  rol: string;
}

export interface CollaboratorContribution {
  colaboradorUid: string;
  colaboradorNombre: string;
  categoria: string;
  cantidad: number;
  valorUnitario: number;
}

export interface ReportLineItem {
  descripcion: string;
  contribuciones: CollaboratorContribution[];
  notas?: string;
}

export interface MonthlyReport {
  id: string;
  periodo: string;
  items: ReportLineItem[];
  notas?: string;
  totalesPorColaborador: Record<string, number>;
  totalesPorCategoria: Record<string, number>;
  totalGeneral: number;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface MonthlyReportCreate {
  periodo: string;
  items: ReportLineItem[];
  notas?: string;
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
