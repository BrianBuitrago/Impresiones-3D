export const formatCOP = (value: number) =>
  `$${Math.round(value).toLocaleString('es-CO')} COP`;

export const estadoBadgeClass = (estado: string) => {
  switch (estado) {
    case 'pendiente':  return 'bg-amber-500/10  border-amber-500/25  text-amber-400';
    case 'cotizado':   return 'bg-cyan-500/10   border-cyan-500/25   text-cyan-400';
    case 'aceptado':   return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
    case 'rechazado':  return 'bg-red-500/10    border-red-500/25    text-red-400';
    default:           return 'bg-slate-800     border-slate-700     text-slate-400';
  }
};

export interface CalcEntry {
  tiempoHoras: string;
  tiempoMinutos: string;
  pesoGramos: string;
  costoDiseno: string;
  costoAccesorios: string;
  costoEmpaque: string;
  costoPersonalizado: string;
  horasPostProcesado: string;
  costoProcesado: string;
  porcentajeImprevistos: string;
  kwH: string;
  kwMin: string;
  ganancia: string;
}
