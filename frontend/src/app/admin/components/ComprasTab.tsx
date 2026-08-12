'use client';

import { useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, Mail, Phone, IdCard, ImageIcon, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const compras = quotesList.filter(q => q.estado === 'aceptado');

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
            Las cotizaciones aceptadas aparecen acá automáticamente.
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

              <button
                type="button"
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white border-t border-slate-800 pt-3 cursor-pointer transition-colors"
              >
                {expandedId === q.id ? (
                  <>Ver menos <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Ver más <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>

              <AnimatePresence>
                {expandedId === q.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-400">
                        {q.cliente?.email && (
                          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {q.cliente.email}</span>
                        )}
                        {q.cliente?.telefono && (
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {q.cliente.telefono}</span>
                        )}
                        {q.cliente?.cedula && (
                          <span className="flex items-center gap-1.5"><IdCard className="w-3.5 h-3.5 text-slate-500" /> {q.cliente.cedula}</span>
                        )}
                        {(q.notasCotizacion || q.Notas_Cotizacion) && (
                          <span className="block mt-1 text-slate-500 italic">"{q.notasCotizacion || q.Notas_Cotizacion}"</span>
                        )}
                      </div>

                      <div className="space-y-3">
                        {(q.productos || []).map((p: any, idx: number) => (
                          <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-xs font-bold text-white">{p.nombre || `Producto #${idx + 1}`}</p>
                              <span className="text-[10px] font-semibold text-emerald-400 shrink-0">
                                {formatCOP(p.precioTotal || p.Precio_Total || 0)}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {p.tamanoHorizontal} × {p.tamanoVertical} mm · {p.unidades} unidad{p.unidades !== 1 ? 'es' : ''}
                            </p>
                            <div className="text-[10px] text-slate-500 space-y-0.5">
                              <p>accesorios: {p.accesorios || 'ninguno'}</p>
                              <p>
                                personalización: {p.personalizacion?.length > 0 ? p.personalizacion.join(', ') : 'sin personalización'}
                              </p>
                              <p>empaque: {p.empaque === 'otra' ? p.empaqueOtraText : p.empaque}</p>
                            </div>
                            {(p.imagenFrontal || p.imagenLateral || p.imagenTrasera || p.imagenDiagonal) && (
                              <div className="grid grid-cols-4 gap-1.5 pt-1">
                                {['imagenFrontal', 'imagenLateral', 'imagenTrasera', 'imagenDiagonal'].map((f) => {
                                  const imgUrl = p[f];
                                  return imgUrl ? (
                                    <a key={f} href={imgUrl} target="_blank" rel="noopener noreferrer"
                                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-500/50 bg-slate-950 flex items-center justify-center group">
                                      <img src={imgUrl} alt={f} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Eye className="w-3 h-3 text-white" />
                                      </div>
                                    </a>
                                  ) : (
                                    <div key={f} className="aspect-square rounded-lg border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center">
                                      <ImageIcon className="w-3 h-3 text-slate-700" />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
