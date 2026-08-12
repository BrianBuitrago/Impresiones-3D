'use client';

import type { Dispatch, SetStateAction } from 'react';
import {
  Search,
  Mail,
  Phone,
  Settings,
  ChevronDown,
  ChevronUp,
  Zap,
  Weight,
  FileText,
  Eye,
  ImageIcon,
  Clock,
  Percent,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCOP, estadoBadgeClass, type CalcEntry } from './shared';

interface QuotesTabProps {
  quotesList: any[];
  quotesFetching: boolean;
  selectedQuote: any | null;
  quoteSearchTerm: string;
  setQuoteSearchTerm: (v: string) => void;
  quoteStatusFilter: string;
  setQuoteStatusFilter: (v: string) => void;
  filteredQuotes: any[];
  error: string | null;
  fetchQuotes: () => void;
  handleSelectQuote: (quote: Record<string, unknown>) => void;
  precioKwhHora: number;
  setPrecioKwhHora: (v: number) => void;
  precioFilamentoKg: number;
  setPrecioFilamentoKg: (v: number) => void;
  showGlobalConfig: boolean;
  setShowGlobalConfig: Dispatch<SetStateAction<boolean>>;
  calcValues: { [key: number]: CalcEntry };
  handleCalcChange: (idx: number, field: keyof CalcEntry, value: string) => void;
  openProductIndex: number | null;
  setOpenProductIndex: (v: number | null) => void;
  calcProduct: (idx: number, unidades: number) => any;
  totals: { subtotalFabricacion: number; ganancia: number; total: number };
  saving: boolean;
  handleSaveQuote: (newStatus: string, subEstado?: string) => void;
  handleGeneratePdfAndOpenWhatsApp: () => void;
}

export default function QuotesTab({
  quotesList,
  quotesFetching,
  selectedQuote,
  quoteSearchTerm,
  setQuoteSearchTerm,
  quoteStatusFilter,
  setQuoteStatusFilter,
  filteredQuotes,
  error,
  fetchQuotes,
  handleSelectQuote,
  precioKwhHora,
  setPrecioKwhHora,
  precioFilamentoKg,
  setPrecioFilamentoKg,
  showGlobalConfig,
  setShowGlobalConfig,
  calcValues,
  handleCalcChange,
  openProductIndex,
  setOpenProductIndex,
  calcProduct,
  totals,
  saving,
  handleSaveQuote,
  handleGeneratePdfAndOpenWhatsApp,
}: QuotesTabProps) {
  return (
            <motion.div
              key="cotizaciones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total', value: quotesList.length, color: 'text-white' },
                  { label: 'Pendientes', value: quotesList.filter(q => q.estado === 'pendiente').length, color: 'text-amber-400' },
                  { label: 'Cotizadas', value: quotesList.filter(q => q.estado === 'cotizado').length, color: 'text-cyan-400' },
                  { label: 'Aceptadas', value: quotesList.filter(q => q.estado === 'aceptado').length, color: 'text-emerald-400' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                    <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                      {kpi.label}
                    </div>
                    <div className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Dos columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* ── Columna izquierda: lista ── */}
                <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
                  <h2 className="text-sm font-bold text-white px-1">búsqueda y filtros</h2>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente o ID..."
                      value={quoteSearchTerm}
                      onChange={e => setQuoteSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/40 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 shrink-0">estado:</span>
                    <select
                      value={quoteStatusFilter}
                      onChange={e => setQuoteStatusFilter(e.target.value)}
                      className="flex-1 py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="todos">Todos</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="cotizado">Cotizadas</option>
                      <option value="aceptado">Aceptadas</option>
                      <option value="rechazado">Rechazadas</option>
                    </select>
                    <button
                      onClick={fetchQuotes}
                      className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Recargar cotizaciones"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  <div className="border-t border-slate-800 pt-3 max-h-[520px] overflow-y-auto space-y-2 pr-1">
                    {quotesFetching ? (
                      <div className="py-10 text-center text-slate-500 text-xs">Cargando...</div>
                    ) : filteredQuotes.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 text-xs">Sin resultados</div>
                    ) : (
                      filteredQuotes.map(q => (
                        <button
                          key={q.id}
                          onClick={() => handleSelectQuote(q)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                            selectedQuote?.id === q.id
                              ? 'bg-slate-800/40 border-cyan-500/50 shadow shadow-cyan-500/5'
                              : 'bg-slate-950/30 border-slate-800 hover:bg-slate-900/30'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono text-cyan-400 font-bold truncate max-w-[120px]">
                              {q.id}
                            </span>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${estadoBadgeClass(q.estado)}`}>
                              {q.estado}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-white truncate">
                            {q.cliente?.nombre || 'Sin nombre'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {q.productos?.length || 0} producto{q.productos?.length !== 1 ? 's' : ''}
                          </span>
                          {q.precioTotalCotizacion > 0 && (
                            <span className="text-xs font-bold text-emerald-400">
                              {formatCOP(q.precioTotalCotizacion)}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* ── Columna derecha: detalle + calculadora ── */}
                <div className="lg:col-span-8 space-y-6">
                  {selectedQuote ? (
                    <div className="space-y-6">

                      {/* Cabecera del cliente */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                              cotización
                            </span>
                            <h2 className="text-2xl font-extrabold text-white">{selectedQuote.cliente?.nombre}</h2>
                            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 mt-2">
                              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedQuote.cliente?.email}</span>
                              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedQuote.cliente?.telefono}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">estado</span>
                            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${estadoBadgeClass(selectedQuote.estado)}`}>
                              {selectedQuote.estado}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 select-all">{selectedQuote.id}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-400 mt-4">
                          <div>
                            <span className="block text-slate-500 uppercase tracking-wider">fecha</span>
                            <span className="font-semibold text-slate-200 block truncate">
                              {selectedQuote.Fecha || selectedQuote.creadoEn || 'Sin fecha'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-500 uppercase tracking-wider">id cliente</span>
                            <span className="font-semibold text-slate-200 block truncate">
                              {selectedQuote.ID_Cliente || selectedQuote.cliente?.uid || 'No disponible'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-500 uppercase tracking-wider">cédula</span>
                            <span className="font-semibold text-slate-200 block truncate">
                              {selectedQuote.cliente?.cedula || 'No disponible'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-500 uppercase tracking-wider">piezas totales</span>
                            <span className="font-semibold text-slate-200 block">
                              {selectedQuote.Cantidad_Total_Piezas || selectedQuote.cantidadTotalPiezas || 0}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-500 uppercase tracking-wider">ganancia</span>
                            <span className="font-semibold text-slate-200 block">
                              {selectedQuote.Porcentaje_Ganancia || selectedQuote.porcentajeGanancia || 30}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── CONFIGURACIÓN GLOBAL DE FABRICACIÓN ── */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                        <button
                          type="button"
                          onClick={() => setShowGlobalConfig(v => !v)}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/20 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-bold text-white">variables globales de fabricación</span>
                            <span className="text-[10px] text-slate-500 ml-1">
                              (kw/h: ${precioKwhHora.toLocaleString('es-CO')} · Filamento: ${precioFilamentoKg.toLocaleString('es-CO')}/kg)
                            </span>
                          </div>
                          {showGlobalConfig ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        <AnimatePresence>
                          {showGlobalConfig && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Precio Kw/h */}
                                <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                      <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-400" /> precio energía (COP / Kw·h)</span>
                                    </label>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">$</span>
                                    <input
                                      type="number"
                                      value={precioKwhHora}
                                      onChange={e => setPrecioKwhHora(parseFloat(e.target.value) || 0)}
                                      className="w-full pl-7 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-cyan-500/40"
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1.5">
                                    → <span className="text-yellow-400/80 font-semibold">{(precioKwhHora / 60).toFixed(2)} COP/min</span> de impresión
                                  </p>
                                </div>

                                {/* Precio filamento */}
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    <span className="flex items-center gap-1.5"><Weight className="w-3.5 h-3.5 text-blue-400" /> precio filamento (COP / kg)</span>
                                  </label>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">$</span>
                                    <input
                                      type="number"
                                      value={precioFilamentoKg}
                                      onChange={e => setPrecioFilamentoKg(parseFloat(e.target.value) || 0)}
                                      className="w-full pl-7 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-cyan-500/40"
                                    />
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1.5">
                                    → <span className="text-blue-400/80 font-semibold">{(precioFilamentoKg / 1000).toFixed(2)} COP/g</span> de plástico
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── CALCULADORA POR PRODUCTO ── */}
                      <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-slate-950 via-cyan-950 to-blue-950 border border-cyan-500/20 rounded-3xl shadow-xl shadow-cyan-500/10 text-white">
                        <div className="space-y-2 max-w-3xl">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-cyan-200 text-[11px] font-bold uppercase tracking-[0.22em]">
                            <FileText className="w-4 h-4" />
                            PENDIENTES
                          </div>
                          <h3 className="text-xl md:text-2xl font-extrabold">Cálculo por producto</h3>
                          <p className="text-sm text-slate-300">
                            Ajusta horas, peso, empaque y personalización con mayor claridad. El panel ahora aprovecha mejor el espacio.
                          </p>
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-1">
                            <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">total cotizaciones</span>
                          <span className="text-3xl font-extrabold text-white">{filteredQuotes.length}</span>
                        </div>
                      </div>

                        {selectedQuote.productos.map((producto: any, idx: number) => {
                          const c = calcProduct(idx, producto.unidades);
                          const vals = calcValues[idx] || {
                            tiempoHoras: '0',
                            tiempoMinutos: '0',
                            pesoGramos: '0',
                            costoDiseno: '0',
                            costoAccesorios: '0',
                            costoEmpaque: '0',
                            costoPersonalizado: '0',
                            horasPostProcesado: '0',
                            costoProcesado: '0',
                            porcentajeImprevistos: '0',
                            kwH: '0',
                            kwMin: '0',
                            ganancia: '30',
                          };

                          return (
                            <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">

                              {/* Header del producto */}
                              <div className="bg-slate-950/60 px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  {['imagenFrontal', 'imagenLateral', 'imagenTrasera', 'imagenDiagonal'].some(f => producto[f]) && (
                                    <div className="flex -space-x-2 shrink-0">
                                      {['imagenFrontal', 'imagenLateral', 'imagenTrasera', 'imagenDiagonal']
                                        .filter(f => producto[f])
                                        .slice(0, 4)
                                        .map((f) => (
                                          <a key={f} href={producto[f]} target="_blank" rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-lg overflow-hidden border-2 border-slate-900 bg-slate-950 hover:border-cyan-500/60 hover:z-10 relative transition-all">
                                            <img src={producto[f]} alt={f} className="w-full h-full object-cover" />
                                          </a>
                                        ))}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate">{producto.nombre}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      {producto.tamanoHorizontal} × {producto.tamanoVertical} mm ·{' '}
                                      <span className="text-slate-300 font-semibold">{producto.unidades} unidad{producto.unidades !== 1 ? 'es' : ''}</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs font-bold text-cyan-400 px-3 py-1 bg-cyan-950/20 border border-cyan-800/20 rounded-lg shrink-0">
                                    Producto #{idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setOpenProductIndex(openProductIndex === idx ? null : idx)}
                                    className="p-2 rounded-md bg-slate-900/30 hover:bg-slate-900/40 border border-slate-800 text-slate-300 transition-colors"
                                    aria-expanded={openProductIndex === idx}
                                    aria-controls={`producto-detalle-${idx}`}
                                    title={openProductIndex === idx ? 'Contraer producto' : 'Expandir producto'}
                                  >
                                    {openProductIndex === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              {/* Info del cliente: requerimientos + foto */}
                              {openProductIndex === idx ? (
                                <div id={`producto-detalle-${idx}`} className="px-5 py-4 border-b border-slate-800/50 bg-slate-950/20 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">accesorios</span>
                                      <p className="text-xs text-slate-300 mt-1">{producto.accesorios || 'Ninguno'}</p>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">personalización</span>
                                      <div className="flex flex-wrap gap-1.5 mt-1">
                                        {producto.personalizacion?.length > 0 ? (
                                          producto.personalizacion.map((pz: string, pIdx: number) => (
                                            <span key={pIdx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 capitalize">
                                              {pz === 'otra' ? `Otra: ${producto.personalizacionOtraText || ''}` : pz}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-xs text-slate-500">Sin personalización</span>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">empaque</span>
                                      <p className="text-xs text-slate-300 mt-1 capitalize">
                                        {producto.empaque === 'otra'
                                          ? `Otro: ${producto.empaqueOtraText || ''}`
                                          : producto.empaque}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Fotos */}
                                  <div className="flex flex-col items-center border border-dashed border-slate-800 rounded-xl p-3">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                                      fotos
                                    </span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {['imagenFrontal', 'imagenLateral', 'imagenTrasera', 'imagenDiagonal'].map((f, i) => {
                                        const imgUrl = producto[f];
                                        const labels = ['Frontal', 'Lateral', 'Trasera', 'Diagonal'];
                                        return imgUrl ? (
                                          <a key={f} href={imgUrl} target="_blank" rel="noopener noreferrer"
                                            className="relative w-full aspect-square rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-500/50 bg-slate-950 flex items-center justify-center group transition-all">
                                            <img src={imgUrl} alt={labels[i]} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[8px] font-bold gap-0.5">
                                              <Eye className="w-3 h-3" /> {labels[i]}
                                            </div>
                                          </a>
                                        ) : (
                                          <div key={f} className="w-full aspect-square rounded-lg border border-dashed border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600">
                                            <ImageIcon className="w-3 h-3 mb-0.5 text-slate-700" />
                                            <span className="text-[7px]">{labels[i]}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="px-5 py-4 border-b border-slate-800/50 bg-slate-950/10 flex items-center justify-between">
                                  <div>
                                    <div className="text-xs text-slate-400">{producto.accesorios || 'Ninguno'}</div>
                                    <div className="text-[10px] text-slate-500 mt-1">{producto.personalizacion?.length > 0 ? producto.personalizacion.join(' · ') : 'Sin personalización'}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-500">precio estimado</div>
                                    <div className="font-bold text-emerald-400">{formatCOP(c.precioTotalProducto)}</div>
                                  </div>
                                </div>
                              )}
                              <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 border-b border-slate-800/50 bg-slate-950/80 rounded-b-3xl">
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    tiempo (h)
                                  </label>
                                  <div className="relative">
                                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300" />
                                    <input
                                      type="number"
                                      min="0"
                                      value={vals.tiempoHoras}
                                      onChange={e => handleCalcChange(idx, 'tiempoHoras', e.target.value)}
                                      className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                                    />
                                  </div>
                                  <p className="text-[9px] text-slate-400">{Math.round(c.duracion)} min total</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    tiempo (min)
                                  </label>
                                  <div className="relative">
                                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300" />
                                    <input
                                      type="number"
                                      min="0"
                                      value={vals.tiempoMinutos}
                                      onChange={e => handleCalcChange(idx, 'tiempoMinutos', e.target.value)}
                                      className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                                    />
                                  </div>
                                  <p className="text-[9px] text-slate-400">= {formatCOP(c.costoEnergiaUnitario)}/u</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    peso (g)
                                  </label>
                                  <div className="relative">
                                    <Weight className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300" />
                                    <input
                                      type="number"
                                      min="0"
                                      value={vals.pesoGramos}
                                      onChange={e => handleCalcChange(idx, 'pesoGramos', e.target.value)}
                                      className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                                    />
                                  </div>
                                  <p className="text-[9px] text-slate-400">= {formatCOP(c.costoFilamentoUnitario)}/u</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    diseño ($/u)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={vals.costoDiseno}
                                    onChange={e => handleCalcChange(idx, 'costoDiseno', e.target.value)}
                                    className="w-full px-2.5 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400 text-right"
                                  />
                                  <p className="text-[9px] text-slate-500">por unidad</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    accesorios ($/u)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={vals.costoAccesorios}
                                    onChange={e => handleCalcChange(idx, 'costoAccesorios', e.target.value)}
                                    className="w-full px-2.5 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400 text-right"
                                  />
                                  <p className="text-[9px] text-slate-500">por unidad</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    ganancia (%)
                                  </label>
                                  <div className="relative">
                                    <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300" />
                                    <input
                                      type="number"
                                      min="0"
                                      max="1000"
                                      value={vals.ganancia}
                                      onChange={e => handleCalcChange(idx, 'ganancia', e.target.value)}
                                      className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-bold focus:outline-none focus:border-cyan-400"
                                    />
                                  </div>
                                  <p className="text-[9px] text-emerald-400/70">+ {formatCOP(c.gananciaTotal / (producto.unidades || 1))}/u</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    precio unitario
                                  </label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={formatCOP(c.precioUnitario)}
                                    className="w-full px-2.5 py-2 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl text-cyan-300 text-xs font-bold focus:outline-none text-right"
                                  />
                                  <p className="text-[9px] text-slate-500">base + ganancia</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    personaliz. ($/u)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={vals.costoPersonalizado}
                                    onChange={e => handleCalcChange(idx, 'costoPersonalizado', e.target.value)}
                                    className="w-full px-2.5 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400 text-right"
                                  />
                                  <p className="text-[9px] text-slate-500">por unidad</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    empaque ($/u)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={vals.costoEmpaque}
                                    onChange={e => handleCalcChange(idx, 'costoEmpaque', e.target.value)}
                                    className="w-full px-2.5 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400 text-right"
                                  />
                                  <p className="text-[9px] text-slate-500">por unidad</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    post-proc. (h)
                                  </label>
                                  <Clock className="w-4 h-4 text-cyan-300 mb-1" />
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={vals.horasPostProcesado}
                                    onChange={e => handleCalcChange(idx, 'horasPostProcesado', e.target.value)}
                                    className="w-full px-2.5 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    costo procesado ($)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={vals.costoProcesado}
                                    onChange={e => handleCalcChange(idx, 'costoProcesado', e.target.value)}
                                    className="w-full px-2.5 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400 text-right"
                                  />
                                  <p className="text-[9px] text-slate-500">total</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    imprevistos (%)
                                  </label>
                                  <div className="relative">
                                    <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300" />
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={vals.porcentajeImprevistos}
                                      onChange={e => handleCalcChange(idx, 'porcentajeImprevistos', e.target.value)}
                                      className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-bold focus:outline-none focus:border-cyan-400"
                                    />
                                  </div>
                                  <p className="text-[9px] text-amber-400/70">{formatCOP(c.valorImprevistos)}</p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    kw/h
                                    </label>
                                    <Zap className="w-4 h-4 text-yellow-300 mb-1" />
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={vals.kwH}
                                    onChange={e => handleCalcChange(idx, 'kwH', e.target.value)}
                                    className="w-full px-2.5 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    kw/min
                                    </label>
                                    <Zap className="w-4 h-4 text-yellow-300 mb-1" />
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={vals.kwMin}
                                    onChange={e => handleCalcChange(idx, 'kwMin', e.target.value)}
                                    className="w-full px-2.5 py-2 bg-slate-900 border border-cyan-500/20 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                                  />
                                </div>

                              </div>

                                {/* Resultados desglosados */}
                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3">
                                    resumen de costos — {producto.unidades} unidad{producto.unidades !== 1 ? 'es' : ''}
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">

                                    <div>
                                      <span className="text-[10px] text-slate-500 block mb-1">
                                        Costo Fabricación Base/u:
                                      </span>
                                      <span className="font-semibold text-slate-300">
                                        {formatCOP(c.costoFabricacionUnitario)}
                                      </span>
                                      <span className="block text-[9px] text-slate-500 mt-0.5">
                                        Energía {formatCOP(c.costoEnergiaUnitario)} · Material {formatCOP(c.costoFilamentoUnitario)}
                                        {c.costoDiseno > 0 ? ` · Diseño ${formatCOP(c.costoDiseno)}` : ''}
                                        {c.costoAccesorios > 0 ? ` · Accesorios ${formatCOP(c.costoAccesorios)}` : ''}
                                        {c.costoProcesado > 0 ? ` · Post-proc. ${formatCOP(c.costoProcesado)}` : ''}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] text-slate-500 block mb-1">
                                        Imprevistos:
                                      </span>
                                      <span className="font-semibold text-amber-400">
                                        {formatCOP(c.valorImprevistos)}
                                      </span>
                                      <span className="block text-[9px] text-slate-500 mt-0.5">
                                        {c.imprevistos}% del costo base
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] text-slate-500 block mb-1">
                                        Precio Unitario/u:
                                      </span>
                                      <span className="font-bold text-cyan-400">
                                        {formatCOP(c.precioUnitario)}
                                      </span>
                                      <span className="block text-[9px] text-slate-500 mt-0.5">
                                        Fabricación + ganancia
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] text-slate-500 block mb-1">
                                        Subtotal Fabricación Total:
                                      </span>
                                      <span className="font-semibold text-slate-200">
                                        {formatCOP(c.subtotalFabricacionTotal)}
                                      </span>
                                      <span className="block text-[9px] text-emerald-400/80 mt-0.5">
                                        Ganancia: {formatCOP(c.gananciaTotal)}
                                      </span>
                                    </div>

                                    <div className="border-l border-slate-800 pl-4">
                                      <span className="text-[10px] text-slate-500 block mb-1">
                                        Precio Total Producto:
                                      </span>
                                      <span className="font-extrabold text-emerald-400 text-sm">
                                        {formatCOP(c.precioTotalProducto)}
                                      </span>
                                      <span className="block text-[9px] text-slate-500 mt-0.5">
                                        {formatCOP(c.precioTotalUnitario)}/u inc. empaque y personaliz.
                                      </span>
                                    </div>

                                  </div>
                                </div>

                            </div>
                          );
                        })}
                      </div>

                      {/* ── TOTALES Y ACCIONES ── */}
                      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                          {/* Totales */}
                          <div className="space-y-1 min-w-0">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              totales de la cotización
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-xs text-slate-400">
                              <div className="min-w-0">
                                <span className="block truncate">subtotal fabricación:</span>
                                <span className="font-bold text-slate-200">{formatCOP(totals.subtotalFabricacion)}</span>
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate">valor ganancia:</span>
                                <span className="font-bold text-cyan-400">{formatCOP(totals.ganancia)}</span>
                              </div>
                              <div className="min-w-0">
                                <span className="block text-sm font-bold text-white truncate">precio total:</span>
                                <span className="font-extrabold text-emerald-400 text-2xl block truncate">{formatCOP(totals.total)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button
                              disabled={saving}
                              onClick={() => handleSaveQuote('cotizado')}
                              className="py-3 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
                            >
                              {saving ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              Guardar y Enviar Cotización
                            </button>

                            <button
                              disabled={saving}
                              onClick={handleGeneratePdfAndOpenWhatsApp}
                              className="py-3 px-5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                            >
                              <Zap className="w-4 h-4" />
                              Generar PDF y WhatsApp
                            </button>

                            <div className="flex gap-2">
                              <button
                                disabled={saving}
                                onClick={() => handleSaveQuote('aceptado')}
                                className="flex-1 py-3 px-4 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                Aceptada
                              </button>
                              <button
                                disabled={saving}
                                onClick={() => handleSaveQuote('rechazado')}
                                className="flex-1 py-3 px-4 bg-red-900/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                Rechazada
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-slate-900/10 border border-slate-800 border-dashed rounded-3xl p-20 text-center text-slate-500">
                      <FileText className="w-14 h-14 mx-auto mb-4 text-slate-800" />
                      <p className="text-base font-bold text-slate-400">ninguna cotización seleccionada</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Elige una solicitud de la lista lateral para procesarla.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
  );
}
