'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCOP } from './shared';

const SUB_ESTADOS = [
  'diseñando',
  'listo para imprimir',
  'imprimiendo',
  'post impresión',
  'pintura',
  'pendiente de entrega',
  'entregado',
  'stand by',
] as const;

const subEstadoBadgeClass = (subEstado: string) => {
  switch (subEstado) {
    case 'entregado':            return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
    case 'pendiente de entrega':  return 'bg-cyan-500/10   border-cyan-500/25   text-cyan-400';
    case 'stand by':              return 'bg-amber-500/10  border-amber-500/25  text-amber-400';
    default:                      return 'bg-slate-800     border-slate-700     text-slate-400';
  }
};

interface ComprasTabProps {
  quotesList: any[];
  handleUpdateSubEstado: (quote: any, newSubEstado: string) => Promise<void>;
}

export default function ComprasTab({ quotesList, handleUpdateSubEstado }: ComprasTabProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const compras = quotesList.filter(q => q.estado === 'compra');

  const onChangeSubEstado = async (quote: any, value: string) => {
    setUpdatingId(quote.id);
    try {
      await handleUpdateSubEstado(quote, value);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <motion.div
      key="compras"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Compras en proceso</h2>
          <p className="text-xs text-slate-400 mt-1">
            Cotizaciones aceptadas que ya pasaron a producción. Cambiá el sub-estado a medida que avanza el trabajo.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">total</span>
          <span className="text-2xl font-extrabold text-white">{compras.length}</span>
        </div>
      </div>

      {compras.length === 0 ? (
        <div className="bg-slate-900/10 border border-slate-800 border-dashed rounded-3xl p-20 text-center text-slate-500">
          <ShoppingCart className="w-14 h-14 mx-auto mb-4 text-slate-800" />
          <p className="text-base font-bold text-slate-400">ninguna compra en proceso</p>
          <p className="text-xs text-slate-600 mt-1">
            Las cotizaciones aceptadas aparecen acá cuando se pasan a "Compra" desde la pestaña Cotizaciones.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {compras.map(q => (
            <div key={q.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold truncate max-w-[140px]">{q.id}</span>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${subEstadoBadgeClass(q.subEstado || '')}`}>
                  {q.subEstado || 'sin sub-estado'}
                </span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{q.cliente?.nombre || 'Sin nombre'}</p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{q.productos?.length || 0} producto{q.productos?.length !== 1 ? 's' : ''}</span>
                <span className="font-bold text-emerald-400">{formatCOP(q.precioTotalCotizacion || q.precioTotal || 0)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">sub-estado</label>
                <div className="flex items-center gap-2">
                  <select
                    disabled={updatingId === q.id}
                    value={q.subEstado || ''}
                    onChange={e => onChangeSubEstado(q, e.target.value)}
                    className="flex-1 py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50"
                  >
                    {!q.subEstado && <option value="" disabled>Seleccionar...</option>}
                    {SUB_ESTADOS.map(se => (
                      <option key={se} value={se}>{se}</option>
                    ))}
                  </select>
                  {updatingId === q.id && (
                    <div className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
