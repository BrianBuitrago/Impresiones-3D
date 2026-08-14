'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronLeft, Mail, Phone, IdCard, ImageIcon, Eye, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCOP } from './shared';
import { GRANULARIDADES, bucketKey, bucketLabel, resolverPeriodo, type Granularidad } from './periodo';
import ImageLightbox from '@/components/ui/ImageLightbox';

const getFechaCompra = (q: any) => q.creadoEn || q.Fecha || '';

const getProductImages = (producto: any) =>
  (['imagenFrontal', 'imagenLateral', 'imagenTrasera', 'imagenDiagonal'] as const)
    .map((f, i) => ({ url: producto[f], label: ['Frontal', 'Lateral', 'Trasera', 'Diagonal'][i] }))
    .filter(img => img.url);

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

const Field = ({ label, value }: { label: string; value: any }) => (
  <div className="min-w-0">
    <span className="block text-[9px] text-slate-500 uppercase tracking-wider">{label}</span>
    <span className="block text-xs font-semibold text-slate-200 truncate">{value ?? '—'}</span>
  </div>
);

interface ComprasTabProps {
  isColaborador?: boolean;
  quotesList: any[];
  handleUpdateSubEstado: (quote: any, newSubEstado: string) => Promise<void>;
  autoExpandId?: string | null;
  onAutoExpandHandled?: () => void;
}

export default function ComprasTab({ isColaborador = false, quotesList, handleUpdateSubEstado, autoExpandId, onAutoExpandHandled }: ComprasTabProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: { url: string; label?: string }[]; index: number } | null>(null);
  const [granularidad, setGranularidad] = useState<Granularidad>('total');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('');

  const comprasBase = quotesList.filter(q => q.estado === 'aceptado');

  const { periodosAscendente, periodoEfectivo } = useMemo(
    () => resolverPeriodo(comprasBase, getFechaCompra, granularidad, periodoSeleccionado),
    [comprasBase, granularidad, periodoSeleccionado]
  );
  const periodosParaDropdown = useMemo(() => [...periodosAscendente].reverse(), [periodosAscendente]);

  const compras = granularidad === 'total'
    ? comprasBase
    : comprasBase.filter(q => bucketKey(getFechaCompra(q), granularidad) === periodoEfectivo);

  const expandedQuote = compras.find(q => q.id === expandedId) || null;

  useEffect(() => {
    if (autoExpandId) {
      setGranularidad('total'); // asegura que la compra recién aceptada no quede oculta por un filtro de período viejo
      setExpandedId(autoExpandId);
      onAutoExpandHandled?.();
    }
  }, [autoExpandId, onAutoExpandHandled]);

  const onChangeSubEstado = async (quote: any, value: string) => {
    setUpdatingId(quote.id);
    try {
      await handleUpdateSubEstado(quote, value);
    } finally {
      setUpdatingId(null);
    }
  };

  const SubEstadoSelector = ({ q }: { q: any }) => (
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
  );

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

      {/* Filtro de período */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-400 shrink-0">ver por:</span>
        <select
          value={granularidad}
          onChange={e => setGranularidad(e.target.value as Granularidad)}
          className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs font-semibold cursor-pointer focus:outline-none"
        >
          {GRANULARIDADES.map(g => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>

        {granularidad !== 'total' && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={periodoEfectivo}
              onChange={e => setPeriodoSeleccionado(e.target.value)}
              className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs font-semibold cursor-pointer focus:outline-none"
            >
              {periodosParaDropdown.length === 0 ? (
                <option value="">Sin datos</option>
              ) : (
                periodosParaDropdown.map(p => (
                  <option key={p} value={p}>{bucketLabel(p, granularidad)}</option>
                ))
              )}
            </select>
          </div>
        )}
      </div>

      {compras.length === 0 ? (
        <div className="bg-slate-900/10 border border-slate-800 border-dashed rounded-3xl p-20 text-center text-slate-500">
          <ShoppingCart className="w-14 h-14 mx-auto mb-4 text-slate-800" />
          <p className="text-base font-bold text-slate-400">
            {comprasBase.length === 0 ? 'ninguna compra en proceso' : 'ninguna compra en este período'}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {comprasBase.length === 0
              ? 'Las cotizaciones aceptadas aparecen acá automáticamente.'
              : 'Probá con otro período o cambiá a "Total" para ver todas.'}
          </p>
        </div>
      ) : expandedQuote ? (
        <div className="space-y-4">
          {/* ── Tarjeta expandida, ancho completo ── */}
          <div className="bg-slate-900/40 border border-cyan-500/30 rounded-3xl p-6 space-y-5">
            <button
              type="button"
              onClick={() => setExpandedId(null)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Volver a la lista
            </button>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">{expandedQuote.id}</span>
                <h3 className="text-xl font-extrabold text-white">{expandedQuote.cliente?.nombre || 'Sin nombre'}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                  {expandedQuote.cliente?.email && (
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {expandedQuote.cliente.email}</span>
                  )}
                  {expandedQuote.cliente?.telefono && (
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {expandedQuote.cliente.telefono}</span>
                  )}
                  {expandedQuote.cliente?.cedula && (
                    <span className="flex items-center gap-1"><IdCard className="w-3.5 h-3.5" /> {expandedQuote.cliente.cedula}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {expandedQuote.actualizadoEn || expandedQuote.creadoEn || expandedQuote.Fecha || 'sin fecha'}
                  </span>
                </div>
              </div>
              <div className="w-full sm:w-64 shrink-0">
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">sub-estado</label>
                <SubEstadoSelector q={expandedQuote} />
              </div>
            </div>

            {(expandedQuote.notasCotizacion || expandedQuote.Notas_Cotizacion) && (
              <p className="text-xs text-slate-400 italic border-l-2 border-slate-700 pl-3">
                "{expandedQuote.notasCotizacion || expandedQuote.Notas_Cotizacion}"
              </p>
            )}

            {/* ── Datos de pago (pendiente de captura en la app) ── */}
            {!isColaborador && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
                <Field label="Total cotización" value={formatCOP(expandedQuote.precioTotalCotizacion || expandedQuote.precioTotal || 0)} />
                <Field label="Abono" value="No registrado" />
                <Field label="Restante" value="No registrado" />
                <Field label="Total recibido" value="No registrado" />
              </div>
            )}

            {/* ── Productos ── */}
            <div className="space-y-4">
              {(expandedQuote.productos || []).map((p: any, idx: number) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="bg-slate-900/60 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                    <p className="text-sm font-bold text-white">{p.nombre || `Producto #${idx + 1}`}</p>
                    {!isColaborador && (
                      <span className="text-sm font-extrabold text-emerald-400">{formatCOP(p.precioTotal || p.Precio_Total || 0)}</span>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    {p.descripcionLineal && (
                      <p className="text-xs text-slate-400">{p.descripcionLineal}</p>
                    )}

                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">datos del producto</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5">
                        <Field label="Unidades" value={p.unidades} />
                        <Field label="Tamaño horizontal" value={p.tamanoHorizontal ? `${p.tamanoHorizontal} cm` : null} />
                        <Field label="Tamaño vertical" value={p.tamanoVertical ? `${p.tamanoVertical} cm` : null} />
                        <Field label="Accesorios" value={p.accesorios || 'ninguno'} />
                        <Field label="Personalización" value={p.personalizacion?.length > 0 ? p.personalizacion.join(', ') : 'sin personalización'} />
                        <Field label="Tipo de empaque" value={p.empaque === 'otra' ? (p.empaqueOtraText || 'otro') : p.empaque} />
                      </div>
                    </div>

                    {!isColaborador && (
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">cálculo de fabricación</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5">
                          <Field label="Kw/h" value={p.precioKwhHora} />
                          <Field label="Kw/min" value={p.precioKwhMinuto} />
                          <Field label="Tiempo impresión (h)" value={p.tiempoHoras} />
                          <Field label="Min" value={p.tiempoMinutos} />
                          <Field label="Subtotal energía" value={formatCOP(p.subtotalEnergia || 0)} />
                          <Field label="Peso (g)" value={p.pesoGramos} />
                          <Field label="Subtotal peso" value={formatCOP(p.subtotalMaterial || 0)} />
                          <Field label="Diseño" value={formatCOP(p.costoDisenoUnitario || 0)} />
                          <Field label="Accesorios ($)" value={formatCOP(p.costoAccesoriosUnitario || 0)} />
                          <Field label="Horas post-procesado" value={p.horasPostProcesado} />
                          <Field label="Costo procesado" value={formatCOP(p.costoProcesado || 0)} />
                          <Field label="Personalizado + pintura" value={formatCOP(p.valorPersonalizacionUnitario || 0)} />
                          <Field label="Empaque ($)" value={formatCOP(p.valorEmpaqueUnitario || 0)} />
                          <Field label="Sub total fabricación" value={formatCOP(p.costoFabricacionUnitario || 0)} />
                          <Field label="% imprevistos" value={p.porcentajeImprevistos != null ? `${p.porcentajeImprevistos}%` : null} />
                          <Field label="% ganancia" value={p.porcentajeGanancia != null ? `${p.porcentajeGanancia}%` : null} />
                          <Field label="Precio C/U" value={formatCOP(p.precioUnitario || 0)} />
                        </div>
                      </div>
                    )}

                    {(p.imagenFrontal || p.imagenLateral || p.imagenTrasera || p.imagenDiagonal) && (
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">fotos de referencia</p>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {['imagenFrontal', 'imagenLateral', 'imagenTrasera', 'imagenDiagonal'].map((f) => {
                            const imgUrl = p[f];
                            return imgUrl ? (
                              <button key={f} type="button"
                                onClick={() => {
                                  const imgs = getProductImages(p);
                                  const clickedIdx = imgs.findIndex(img => img.url === imgUrl);
                                  setLightbox({ images: imgs, index: clickedIdx >= 0 ? clickedIdx : 0 });
                                }}
                                className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-500/50 bg-slate-950 flex items-center justify-center group cursor-pointer">
                                <img src={imgUrl} alt={f} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </button>
                            ) : (
                              <div key={f} className="aspect-square rounded-lg border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center">
                                <ImageIcon className="w-3.5 h-3.5 text-slate-700" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Resto de las compras, minimizadas ── */}
          {compras.length > 1 && (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">otras compras</p>
              {compras.filter(q => q.id !== expandedQuote.id).map((q, idx) => (
                <motion.button
                  key={q.id}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx, 10) * 0.03 }}
                  onClick={() => setExpandedId(q.id)}
                  className="w-full flex items-center justify-between gap-3 bg-slate-900/30 hover:bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold shrink-0">{q.id.slice(0, 8)}…</span>
                    <span className="text-xs font-semibold text-white truncate">{q.cliente?.nombre || 'Sin nombre'}</span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${subEstadoBadgeClass(q.subEstado || '')}`}>
                      {q.subEstado || 'sin sub-estado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {!isColaborador && (
                      <span className="text-xs font-bold text-emerald-400">{formatCOP(q.precioTotalCotizacion || q.precioTotal || 0)}</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-500 -rotate-90" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {compras.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx, 10) * 0.03 }}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-mono text-cyan-400 font-bold truncate max-w-[140px]">{q.id}</span>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${subEstadoBadgeClass(q.subEstado || '')}`}>
                  {q.subEstado || 'sin sub-estado'}
                </span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{q.cliente?.nombre || 'Sin nombre'}</p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{q.productos?.length || 0} producto{q.productos?.length !== 1 ? 's' : ''}</span>
                {!isColaborador && (
                  <span className="font-bold text-emerald-400">{formatCOP(q.precioTotalCotizacion || q.precioTotal || 0)}</span>
                )}
              </div>
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">sub-estado</label>
                <SubEstadoSelector q={q} />
              </div>

              <button
                type="button"
                onClick={() => setExpandedId(q.id)}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white border-t border-slate-800 pt-3 cursor-pointer transition-colors"
              >
                Ver más <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={i => setLightbox(prev => (prev ? { ...prev, index: i } : prev))}
        />
      )}
    </motion.div>
  );
}
