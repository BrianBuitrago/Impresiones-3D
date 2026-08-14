export type TipoInversion = 'insumo' | 'maquina';

export interface Inversion {
  id: string;
  nombre: string;
  tipo: TipoInversion;
  monto: number;
  fecha: string;
  notas?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface InversionInput {
  nombre: string;
  tipo: TipoInversion;
  monto: number;
  fecha: string;
  notas?: string;
}
