const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export type Granularidad = 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'total';

export const GRANULARIDADES: { value: Granularidad; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'total', label: 'Total' },
];

// Agrupa por fecha real (ISO) en vez de por strings tipo "Mes/AA" (formato de
// Reportes): eso no tiene parser inverso ni orden cronológico real, no
// alcanza para agrupar por trimestre/semestre/año de forma correcta.
export const bucketKey = (fecha: string, g: Granularidad): string => {
  if (g === 'total') return 'total';
  const d = new Date(fecha?.includes('T') ? fecha : `${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 'sin-fecha';
  const year = d.getFullYear();
  const month = d.getMonth();
  if (g === 'anual') return `${year}`;
  if (g === 'semestral') return `${year}-S${month < 6 ? 1 : 2}`;
  if (g === 'trimestral') return `${year}-Q${Math.floor(month / 3) + 1}`;
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

export const bucketLabel = (key: string, g: Granularidad): string => {
  if (g === 'total') return 'Todo el histórico';
  if (key === 'sin-fecha') return 'Sin fecha';
  if (g === 'anual') return key;
  if (g === 'semestral') {
    const [y, s] = key.split('-S');
    return `${s === '1' ? '1er' : '2do'} semestre ${y}`;
  }
  if (g === 'trimestral') {
    const [y, q] = key.split('-Q');
    return `Trimestre ${q} · ${y}`;
  }
  const [y, m] = key.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
};

// Dada una lista y un getter de fecha, arma las claves de período ascendentes
// (ordenables cronológicamente con .sort() normal) y resuelve cuál queda
// seleccionada por defecto (la más reciente) si la actual ya no es válida.
export const resolverPeriodo = <T,>(
  items: T[],
  getFecha: (item: T) => string,
  granularidad: Granularidad,
  periodoSeleccionado: string,
): { periodosAscendente: string[]; periodoEfectivo: string } => {
  const periodosAscendente = granularidad === 'total'
    ? ['total']
    : Array.from(new Set(items.map(item => bucketKey(getFecha(item), granularidad)))).sort();
  const periodoEfectivo = granularidad === 'total'
    ? 'total'
    : (periodosAscendente.includes(periodoSeleccionado) ? periodoSeleccionado : periodosAscendente[periodosAscendente.length - 1] || '');
  return { periodosAscendente, periodoEfectivo };
};
