'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, ArrowLeft, BarChart3, Users, Tag, DollarSign,
  Plus, X, Search, RefreshCw, ChevronDown, ChevronUp, Filter,
  FileText, Calendar, Layers, TrendingUp, Eye, Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Colaborador, MonthlyReport, MonthlyReportCreate,
  ComparativaColaborador, CollaboratorContribution,
} from '@/types/reportes';
import {
  fetchColaboradores, fetchReportes, crearReporte, actualizarReporte,
} from '@/services/reporteService';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatCOP = (v: number) =>
  `$${Math.round(v).toLocaleString('es-CO')} COP`;

const inputClass =
  'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50 transition-colors';

const selectClass =
  'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50 cursor-pointer transition-colors';

export default function ReportesPage() {
  const { user, profile, token, loading } = useAuth();
  const router = useRouter();

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [reportes, setReportes] = useState<MonthlyReport[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtroPeriodo, setFiltroPeriodo] = useState(() => {
    const now = new Date();
    return `${MONTHS[now.getMonth()]}/${String(now.getFullYear()).slice(-2)}`;
  });
  const [filtroColaboradores, setFiltroColaboradores] = useState<string[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [showManualForm, setShowManualForm] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>(['cajas', 'pintura']);

  const loadData = useCallback(async () => {
    if (!token || profile?.rol !== 'administrador') return;
    setFetching(true);
    setError(null);
    try {
      const [cols, reps] = await Promise.all([
        fetchColaboradores(token),
        fetchReportes(token),
      ]);
      setColaboradores(cols);
      setReportes(reps);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, [token, profile]);

  useEffect(() => {
    if (!loading) loadData();
  }, [loading, loadData]);

  const reportesFiltrados = useMemo(() => {
    return reportes.filter(r => {
      if (filtroPeriodo && r.periodo !== filtroPeriodo) return false;
      return true;
    });
  }, [reportes, filtroPeriodo]);

  const itemsAplanados = useMemo(() => {
    const items: Array<{
      reportId: string;
      periodo: string;
      descripcion: string;
      colaboradorUid: string;
      colaboradorNombre: string;
      categoria: string;
      cantidad: number;
      valorUnitario: number;
      valorTotal: number;
      notas?: string;
    }> = [];

    for (const r of reportesFiltrados) {
      for (const item of r.items) {
        for (const c of item.contribuciones) {
          if (filtroColaboradores.length > 0 && !filtroColaboradores.includes(c.colaboradorUid)) continue;
          if (filtroCategoria && c.categoria !== filtroCategoria) continue;
          items.push({
            reportId: r.id,
            periodo: r.periodo,
            descripcion: item.descripcion,
            colaboradorUid: c.colaboradorUid,
            colaboradorNombre: c.colaboradorNombre,
            categoria: c.categoria,
            cantidad: c.cantidad,
            valorUnitario: c.valorUnitario,
            valorTotal: c.cantidad * c.valorUnitario,
            notas: item.notas,
          });
        }
      }
    }
    return items;
  }, [reportesFiltrados, filtroColaboradores, filtroCategoria]);

  const comparativa = useMemo(() => {
    const mapa = new Map<string, ComparativaColaborador>();
    for (const item of itemsAplanados) {
      let c = mapa.get(item.colaboradorUid);
      if (!c) {
        c = {
          uid: item.colaboradorUid,
          nombre: item.colaboradorNombre,
          totalGanado: 0,
          totalItems: 0,
          itemsPorCategoria: {},
          valorPorCategoria: {},
        };
        mapa.set(item.colaboradorUid, c);
      }
      c.totalGanado += item.valorTotal;
      c.totalItems += item.cantidad;
      c.itemsPorCategoria[item.categoria] = (c.itemsPorCategoria[item.categoria] || 0) + item.cantidad;
      c.valorPorCategoria[item.categoria] = (c.valorPorCategoria[item.categoria] || 0) + item.valorTotal;
    }
    return Array.from(mapa.values()).sort((a, b) => b.totalGanado - a.totalGanado);
  }, [itemsAplanados]);

  const kpiTotales = useMemo(() => {
    const totalGanado = itemsAplanados.reduce((s, i) => s + i.valorTotal, 0);
    const totalItems = itemsAplanados.reduce((s, i) => s + i.cantidad, 0);
    const colaboradoresUnicos = new Set(itemsAplanados.map(i => i.colaboradorUid)).size;
    const categoriasUnicas = new Set(itemsAplanados.map(i => i.categoria)).size;
    return { totalGanado, totalItems, colaboradoresUnicos, categoriasUnicas };
  }, [itemsAplanados]);

  useEffect(() => {
    const cats = new Set(categoriasDisponibles);
    for (const r of reportes) {
      for (const item of r.items) {
        for (const c of item.contribuciones) {
          if (c.categoria) cats.add(c.categoria);
        }
      }
    }
    for (const col of colaboradores) {
      for (const cat of (col.categorias || [])) {
        if (cat) cats.add(cat);
      }
    }
    setCategoriasDisponibles(Array.from(cats).sort());
  }, [reportes, colaboradores]);

  const handleAgregarCategoria = () => {
    const cat = nuevaCategoria.trim().toLowerCase();
    if (!cat || categoriasDisponibles.includes(cat)) return;
    setCategoriasDisponibles(prev => [...prev, cat].sort());
    setNuevaCategoria('');
  };

  const toggleFiltroColab = (uid: string) => {
    setFiltroColaboradores(prev =>
      prev.includes(uid) ? prev.filter(u => u !== uid) : [...prev, uid]
    );
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.rol !== 'administrador') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-slate-950 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.08),transparent)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-md w-full text-center p-8 backdrop-blur-xl bg-slate-900/40 border border-red-500/20 rounded-3xl shadow-2xl"
        >
          <div className="inline-flex p-4 bg-red-500/10 rounded-2xl text-red-500 mb-5">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Acceso Denegado</h2>
          <p className="text-slate-400 text-sm">Solo administradores pueden acceder a reportes.</p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-6 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl cursor-pointer"
          >
            Volver al Panel
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.05),transparent)] -z-10" />

      <div className="relative max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Volver al panel"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-outfit">
                <BarChart3 className="w-8 h-8 text-cyan-400" />
                Reportes Mensuales
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Comparativa de ganancias, rendimiento por colaborador y resumen de compras.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold capitalize bg-slate-900 border border-slate-800 text-cyan-400">
              {profile?.nombre}
            </span>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Filtros ── */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" /> Periodo
              </label>
              <select
                value={filtroPeriodo}
                onChange={e => setFiltroPeriodo(e.target.value)}
                className={selectClass}
              >
                {Array.from(new Set(reportes.map(r => r.periodo))).sort().map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
                {reportes.length === 0 && (
                  <option value={filtroPeriodo}>{filtroPeriodo}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                <Users className="w-3 h-3 inline mr-1" /> Colaboradores
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    const sel = document.getElementById('colab-dropdown');
                    if (sel) sel.classList.toggle('hidden');
                  }}
                  className={`${selectClass} text-left flex items-center justify-between`}
                >
                  <span className="truncate">
                    {filtroColaboradores.length === 0
                      ? 'Todos'
                      : `${filtroColaboradores.length} seleccionado${filtroColaboradores.length > 1 ? 's' : ''}`}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
                <div
                  id="colab-dropdown"
                  className="hidden absolute z-20 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto"
                >
                  <button
                    onClick={() => setFiltroColaboradores([])}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 cursor-pointer"
                  >
                    Todos
                  </button>
                  {colaboradores.map(col => (
                    <label
                      key={col.uid}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filtroColaboradores.includes(col.uid)}
                        onChange={() => toggleFiltroColab(col.uid)}
                        className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                      />
                      {col.nombre}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                <Tag className="w-3 h-3 inline mr-1" /> Categoría
              </label>
              <select
                value={filtroCategoria}
                onChange={e => setFiltroCategoria(e.target.value)}
                className={selectClass}
              >
                <option value="">Todas</option>
                {categoriasDisponibles.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFiltroColaboradores([]);
                  setFiltroCategoria('');
                }}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-300 font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" /> Limpiar
              </button>
              <button
                onClick={loadData}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Recargar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Ganado', value: formatCOP(kpiTotales.totalGanado), icon: DollarSign, color: 'text-emerald-400' },
            { label: 'Items Realizados', value: kpiTotales.totalItems.toLocaleString('es-CO'), icon: Layers, color: 'text-cyan-400' },
            { label: 'Colaboradores Activos', value: kpiTotales.colaboradoresUnicos, icon: Users, color: 'text-blue-400' },
            { label: 'Categorías', value: kpiTotales.categoriasUnicas, icon: Tag, color: 'text-amber-400' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ═══ Columna izquierda: Comparativa + Detalle ═══ */}
          <div className="lg:col-span-8 space-y-6">

            {/* ── Comparativa por Colaborador ── */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Comparativa por Colaborador</h3>
                </div>
                <span className="text-xs text-slate-500">{comparativa.length} colaboradores</span>
              </div>

              {comparativa.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                  <p className="text-base font-medium">Sin datos para el periodo seleccionado</p>
                  <p className="text-xs text-slate-600 mt-1">Crea un reporte o registra compras manualmente</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3.5 px-5">Colaborador</th>
                        <th className="py-3.5 px-5 text-right">Items</th>
                        <th className="py-3.5 px-5">Categorías</th>
                        <th className="py-3.5 px-5 text-right">Valor / Item</th>
                        <th className="py-3.5 px-5 text-right">Total Ganado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {comparativa.map((col, idx) => {
                        const cats = Object.keys(col.valorPorCategoria);
                        const valorPorItem = col.totalItems > 0 ? col.totalGanado / col.totalItems : 0;
                        return (
                          <tr key={col.uid} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  idx === 0 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                                  idx === 1 ? 'bg-slate-500/15 text-slate-300 border border-slate-500/30' :
                                  idx === 2 ? 'bg-amber-700/15 text-amber-600 border border-amber-700/30' :
                                  'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                  {idx + 1}
                                </div>
                                <span className="text-sm font-semibold text-white">{col.nombre}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <span className="text-sm font-bold text-cyan-400">{col.totalItems}</span>
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="flex flex-wrap gap-1">
                                {cats.map(cat => (
                                  <span key={cat} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 capitalize">
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <span className="text-xs text-slate-300">{formatCOP(valorPorItem)}</span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <span className="text-sm font-extrabold text-emerald-400">{formatCOP(col.totalGanado)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Items / Compras del Mes ── */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Resumen de Compras e Items del Mes</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowManualForm(true)}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Registrar Compra Manual
                  </button>
                </div>
              </div>

              {itemsAplanados.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                  <p className="text-sm">No hay compras registradas en este periodo</p>
                  <button
                    onClick={() => setShowManualForm(true)}
                    className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Registrar primera compra manual
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3 px-4">Descripción</th>
                        <th className="py-3 px-4">Colaborador</th>
                        <th className="py-3 px-4">Categoría</th>
                        <th className="py-3 px-4 text-right">Cantidad</th>
                        <th className="py-3 px-4 text-right">Valor Unit.</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {itemsAplanados.map((item, i) => (
                        <tr key={`${item.reportId}-${i}`} className="hover:bg-slate-800/10 transition-colors">
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-200 font-medium">{item.descripcion}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-slate-300">{item.colaboradorNombre}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded capitalize">{item.categoria}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-slate-300">{item.cantidad}</td>
                          <td className="py-3 px-4 text-right text-sm text-slate-300">{formatCOP(item.valorUnitario)}</td>
                          <td className="py-3 px-4 text-right text-sm font-bold text-emerald-400">{formatCOP(item.valorTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ═══ Columna derecha: Gestión ═══ */}
          <div className="lg:col-span-4 space-y-6">

            {/* ── Reportes Existentes ── */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Reportes Guardados
                </h3>
                <span className="text-xs text-slate-500">{reportesFiltrados.length}</span>
              </div>

              {fetching ? (
                <div className="py-6 text-center text-slate-500 text-xs">Cargando...</div>
              ) : reportesFiltrados.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">Sin reportes en este periodo</div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {reportesFiltrados.map(r => (
                    <div
                      key={r.id}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-all"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-mono text-cyan-400 font-bold">{r.periodo}</span>
                        <span className="text-[10px] text-slate-500">{r.items?.length || 0} items</span>
                      </div>
                      <div className="text-xs text-emerald-400 font-bold">
                        Total: {formatCOP(r.totalGeneral || 0)}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(r.totalesPorCategoria || {}).map(([cat, val]) => (
                          <span key={cat} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded capitalize">
                            {cat}: {formatCOP(val)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Categorías ── */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  Categorías
                </h3>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nueva categoría..."
                  value={nuevaCategoria}
                  onChange={e => setNuevaCategoria(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAgregarCategoria(); }}
                  className={inputClass}
                />
                <button
                  onClick={handleAgregarCategoria}
                  disabled={!nuevaCategoria.trim()}
                  className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {categoriasDisponibles.map(cat => (
                  <span
                    key={cat}
                    className={`text-xs px-2.5 py-1 rounded-lg capitalize border cursor-pointer transition-all ${
                      filtroCategoria === cat
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                    onClick={() => setFiltroCategoria(filtroCategoria === cat ? '' : cat)}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Distribución ── */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-cyan-400" />
                Distribución por Categoría
              </h3>
              {Object.keys(kpiTotales).length > 0 && itemsAplanados.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(
                    itemsAplanados.reduce((acc, item) => {
                      acc[item.categoria] = (acc[item.categoria] || 0) + item.valorTotal;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, val]) => {
                      const pct = kpiTotales.totalGanado > 0 ? (val / kpiTotales.totalGanado) * 100 : 0;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize text-slate-300">{cat}</span>
                            <span className="text-slate-400">{formatCOP(val)}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Sin datos para mostrar</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          MODAL: Registro Manual de Compra/Item
      ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showManualForm && (
          <ManualPurchaseForm
            colaboradores={colaboradores}
            categorias={categoriasDisponibles}
            periodo={filtroPeriodo}
            token={token!}
            onSave={() => {
              setShowManualForm(false);
              loadData();
            }}
            onClose={() => setShowManualForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   COMPONENTE: Formulario Manual de Compra
═══════════════════════════════════════════════════ */
function ManualPurchaseForm({
  colaboradores,
  categorias,
  periodo,
  token,
  onSave,
  onClose,
}: {
  colaboradores: Colaborador[];
  categorias: string[];
  periodo: string;
  token: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const [descripcion, setDescripcion] = useState('');
  const [contribuciones, setContribuciones] = useState<CollaboratorContribution[]>([]);
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddContrib = () => {
    setContribuciones(prev => [
      ...prev,
      {
        colaboradorUid: colaboradores[0]?.uid || '',
        colaboradorNombre: colaboradores[0]?.nombre || '',
        categoria: categorias[0] || '',
        cantidad: 1,
        valorUnitario: 0,
      },
    ]);
  };

  const handleRemoveContrib = (idx: number) => {
    setContribuciones(prev => prev.filter((_, i) => i !== idx));
  };

  const handleContribChange = (idx: number, field: keyof CollaboratorContribution, value: any) => {
    setContribuciones(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      if (field === 'colaboradorUid') {
        const col = colaboradores.find(c => c.uid === value);
        if (col) copy[idx].colaboradorNombre = col.nombre;
      }
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    if (contribuciones.length === 0) {
      setError('Agrega al menos un colaborador');
      return;
    }
    for (const c of contribuciones) {
      if (!c.categoria) { setError('Todas las contribuciones deben tener categoría'); return; }
      if (c.cantidad < 1) { setError('La cantidad debe ser mayor a 0'); return; }
      if (c.valorUnitario < 0) { setError('El valor unitario no puede ser negativo'); return; }
    }

    setSaving(true);
    setError(null);
    try {
      await crearReporte(token, {
        periodo,
        items: [{
          descripcion: descripcion.trim(),
          contribuciones: contribuciones.map(c => ({
            ...c,
            cantidad: Math.round(c.cantidad),
            valorUnitario: Math.round(c.valorUnitario * 100) / 100,
          })),
          notas: notas.trim() || undefined,
        }],
        notas: undefined,
      });
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            Registrar Compra Manual
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>
          )}

          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1.5">Descripción del trabajo</label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej: Impresión de 10 cajas personalizadas"
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400 font-bold">Colaboradores que participaron</label>
              <button
                onClick={handleAddContrib}
                className="py-1 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>

            <div className="space-y-3">
              {contribuciones.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">
                  No hay colaboradores agregados. Haz clic en "Agregar".
                </p>
              )}

              {contribuciones.map((contrib, idx) => (
                <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Colaborador #{idx + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveContrib(idx)}
                      className="p-1 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Colaborador</label>
                      <select
                        value={contrib.colaboradorUid}
                        onChange={e => handleContribChange(idx, 'colaboradorUid', e.target.value)}
                        className={selectClass}
                      >
                        {colaboradores.map(col => (
                          <option key={col.uid} value={col.uid}>{col.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Categoría</label>
                      <select
                        value={contrib.categoria}
                        onChange={e => handleContribChange(idx, 'categoria', e.target.value)}
                        className={selectClass}
                      >
                        {categorias.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={contrib.cantidad}
                        onChange={e => handleContribChange(idx, 'cantidad', parseInt(e.target.value) || 0)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Valor Unitario (COP)</label>
                      <input
                        type="number"
                        min="0"
                        value={contrib.valorUnitario}
                        onChange={e => handleContribChange(idx, 'valorUnitario', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-emerald-400 font-bold text-right">
                    Total: {formatCOP(contrib.cantidad * contrib.valorUnitario)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1.5">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Notas adicionales sobre este trabajo..."
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl text-sm cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Guardar Reporte
            </button>
            <button
              onClick={onClose}
              className="py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium rounded-xl text-sm cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
