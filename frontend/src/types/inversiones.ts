export type TipoInversion = 'insumo' | 'maquina';

export interface Inversion {
  id: string;
  elemento: string;
  tipo: TipoInversion;
  proveedor?: string;
  cantidad: number;
  costo: number;
  valorUnitario?: number;
  total: number;
  fecha: string;
  observaciones?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface InversionInput {
  elemento: string;
  tipo: TipoInversion;
  proveedor?: string;
  cantidad: number;
  costo: number;
  valorUnitario?: number;
  fecha: string;
  observaciones?: string;
}
