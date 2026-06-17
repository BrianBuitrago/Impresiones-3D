'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, ArrowLeft, BarChart3, Users, Tag, DollarSign,
  Plus, X, Search, RefreshCw, ChevronDown, ChevronUp, Filter,
  FileText, Calendar, Layers, TrendingUp, User, Phone, Weight,
  Clock, Ruler, Box, Palette, Sparkles, Pen, Globe, ShoppingCart,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Colaborador, ReportData, ReportItem, ProductoDetalle } from '@/types/reportes';
import { fetchColaboradores, fetchReportes, crearReporte } from '@/services/reporteService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const formatCOP = (v: number) => `$${Math.round(v).toLocaleString('es-CO')} COP`;

const inputClass = 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50 transition-colors';
const selectClass = 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50 cursor-pointer transition-colors';

interface TrabajoForm {
  tempId: string;
  descripcion: string;
  valor: number;
  colaboradorUid: string;
  colaboradorNombre: string;
}

interface ProductForm {
  tempId: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  cantidad: number;
  valorUnitario: number;
  pesoGramos: number;
  tiempoHoras: number;
  tiempoMinutos: number;
  filamentoUsado: number;
  costoDiseno: number;
  costoAccesorios: number;
  costoEmpaque: number;
  costoPersonalizacion: number;
  tamanoHorizontal: number;
  tamanoVertical: number;
  colaboradorUid: string;
  colaboradorNombre: string;
  trabajos: TrabajoForm[];
}

const emptyProduct = (cols: Colaborador[]): ProductForm => ({
  tempId: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
  nombre: '',
  descripcion: '',
  categoria: 'cajas',
  cantidad: 1,
  valorUnitario: 0,
  pesoGramos: 0,
  tiempoHoras: 0,
  tiempoMinutos: 0,
  filamentoUsado: 0,
  costoDiseno: 0,
  costoAccesorios: 0,
  costoEmpaque: 0,
  costoPersonalizacion: 0,
  tamanoHorizontal: 0,
  tamanoVertical: 0,
  colaboradorUid: cols[0]?.uid || '',
  colaboradorNombre: cols[0]?.nombre || '',
  trabajos: [],
});

const emptyTrabajo = (cols: Colaborador[]): TrabajoForm => ({
  tempId: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
  descripcion: '',
  valor: 0,
  colaboradorUid: cols[0]?.uid || '',
  colaboradorNombre: cols[0]?.nombre || '',
});

export default function ReportesPage() {
  const { user, profile, token, loading } = useAuth();
  const router = useRouter();

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [reportes, setReportes] = useState<ReportData[]>([]);
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
  const [purchaseTab, setPurchaseTab] = useState<'manual' | 'web'>('manual');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [quotesFetching, setQuotesFetching] = useState(false);

  const loadData = useCallback(async () => {
    if (!token || profile?.rol !== 'administrador') return;
    setFetching(true);
    setError(null);
    try {
      const [cols, reps, qs] = await Promise.all([
        fetchColaboradores(token),
        fetchReportes(token),
        fetch(`${API_URL}/quotes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      ]);
      setColaboradores(cols);
      setReportes(reps);
      setQuotes(Array.isArray(qs) ? qs : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, [token, profile]);

  useEffect(() => {
    if (!loading) loadData();
  }, [loading, loadData]);

  const reportesFiltrados = useMemo(() =>
    reportes.filter(r => !filtroPeriodo || r.periodo === filtroPeriodo),
    [reportes, filtroPeriodo]
  );

  const itemsAplanados = useMemo(() => {
    const items: Array<{
      reportId: string;
      periodo: string;
      colaboradorNombre: string;
      categoria: string;
      descripcion: string;
      cantidad: number;
      valor: number;
      clienteNombre?: string;
      clienteTelefono?: string;
      origen?: string;
      productoDetalle?: ProductoDetalle;
    }> = [];

    for (const r of reportesFiltrados) {
      for (const it of r.items) {
        if (filtroColaboradores.length > 0 && !filtroColaboradores.includes(r.colaboradorUid)) continue;
        if (filtroCategoria && it.categoria !== filtroCategoria) continue;
        items.push({
          reportId: r.id,
          periodo: r.periodo,
          colaboradorNombre: r.colaboradorNombre,
          categoria: it.categoria,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          valor: it.valor,
          clienteNombre: it.clienteNombre,
          clienteTelefono: it.clienteTelefono,
          origen: it.origen,
          productoDetalle: it.productoDetalle,
        });
      }
    }
    return items;
  }, [reportesFiltrados, filtroColaboradores, filtroCategoria]);

  const comparativa = useMemo(() => {
    const mapa = new Map<string, {
      uid: string; nombre: string; totalGanado: number;
      totalItems: number; itemsPorCategoria: Record<string, number>;
      valorPorCategoria: Record<string, number>;
    }>();
    for (const r of reportesFiltrados) {
      let c = mapa.get(r.colaboradorUid);
      if (!c) {
        c = { uid: r.colaboradorUid, nombre: r.colaboradorNombre, totalGanado: 0, totalItems: 0, itemsPorCategoria: {}, valorPorCategoria: {} };
        mapa.set(r.colaboradorUid, c);
      }
      for (const it of r.items) {
        c.totalGanado += it.valor;
        c.totalItems += it.cantidad;
        c.itemsPorCategoria[it.categoria] = (c.itemsPorCategoria[it.categoria] || 0) + it.cantidad;
        c.valorPorCategoria[it.categoria] = (c.valorPorCategoria[it.categoria] || 0) + it.valor;
      }
    }
    return Array.from(mapa.values()).sort((a, b) => b.totalGanado - a.totalGanado);
  }, [reportesFiltrados]);

  const webPurchases = useMemo(() => {
    const items: Array<{
      quoteId: string;
      clienteNombre: string;
      clienteTelefono: string;
      productoNombre: string;
      categoria: string;
      cantidad: number;
      valor: number;
      estado: string;
      fecha?: string;
    }> = [];
    for (const q of quotes) {
      if (q.estado !== 'aceptado') continue;
      const productos = Array.isArray(q.productos) ? q.productos : [];
      for (const p of productos) {
        if (filtroColaboradores.length > 0) continue;
        items.push({
          quoteId: q.id,
          clienteNombre: q.cliente?.nombre || 'N/A',
          clienteTelefono: q.cliente?.telefono || '',
          productoNombre: p.nombre || p.descripcionLineal || 'Producto',
          categoria: 'cotización-web',
          cantidad: p.unidades || 1,
          valor: p.precioTotal || p.Precio_Total || p.precioLinealTotal || 0,
          estado: q.estado,
          fecha: q.Fecha || q.creadoEn || '',
        });
      }
    }
    return items;
  }, [quotes, filtroColaboradores]);

  const kpiTotales = useMemo(() => {
    let totalGanado = 0, totalItems = 0;
    const cols = new Set<string>(), cats = new Set<string>();
    for (const r of reportesFiltrados) {
      cols.add(r.colaboradorUid);
      for (const it of r.items) {
        totalGanado += it.valor;
        totalItems += it.cantidad;
        cats.add(it.categoria);
      }
    }
    return { totalGanado, totalItems, colaboradoresUnicos: cols.size, categoriasUnicas: cats.size };
  }, [reportesFiltrados]);

  useEffect(() => {
    const cats = new Set(categoriasDisponibles);
    for (const r of reportes) {
      for (const it of r.items) {
        if (it.categoria) cats.add(it.categoria);
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
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-md w-full text-center p-8 backdrop-blur-xl bg-slate-900/40 border border-red-500/20 rounded-3xl shadow-2xl">
          <div className="inline-flex p-4 bg-red-500/10 rounded-2xl text-red-500 mb-5"><ShieldAlert className="w-10 h-10" /></div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Acceso Denegado</h2>
          <p className="text-slate-400 text-sm">Solo administradores pueden acceder a reportes.</p>
          <button onClick={() => router.push('/admin')}
            className="mt-6 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl cursor-pointer">
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin')}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Volver al panel"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-outfit">
                <BarChart3 className="w-8 h-8 text-cyan-400" />
                Reportes Mensuales
              </h1>
              <p className="text-slate-400 text-sm mt-1">Comparativa de ganancias, rendimiento por colaborador y resumen de compras.</p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold capitalize bg-slate-900 border border-slate-800 text-cyan-400">{profile?.nombre}</span>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" /> Periodo
              </label>
              <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} className={selectClass}>
                {Array.from(new Set(reportes.map(r => r.periodo))).sort().map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
                {reportes.length === 0 && <option value={filtroPeriodo}>{filtroPeriodo}</option>}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                <Users className="w-3 h-3 inline mr-1" /> Colaborador
              </label>
              <select
                value={filtroColaboradores[0] || ''}
                onChange={e => setFiltroColaboradores(e.target.value ? [e.target.value] : [])}
                className={selectClass}
              >
                <option value="">Todos</option>
                {colaboradores.map(col => (
                  <option key={col.uid} value={col.uid}>{col.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                <Tag className="w-3 h-3 inline mr-1" /> Categoría
              </label>
              <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className={selectClass}>
                <option value="">Todas</option>
                {categoriasDisponibles.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setFiltroColaboradores([]); setFiltroCategoria(''); }}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-300 font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Limpiar
              </button>
              <button onClick={loadData}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Recargar"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

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

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" /><h3 className="text-base font-bold text-white">Comparativa por Colaborador</h3></div>
                <span className="text-xs text-slate-500">{comparativa.length} colaboradores</span>
              </div>
              {comparativa.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                  <p className="text-base font-medium">Sin datos para el periodo seleccionado</p>
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
                        const valPorItem = col.totalItems > 0 ? col.totalGanado / col.totalItems : 0;
                        return (
                          <tr key={col.uid} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : idx === 1 ? 'bg-slate-500/15 text-slate-300 border border-slate-500/30' : idx === 2 ? 'bg-amber-700/15 text-amber-600 border border-amber-700/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{idx + 1}</div>
                                <span className="text-sm font-semibold text-white">{col.nombre}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-right"><span className="text-sm font-bold text-cyan-400">{col.totalItems}</span></td>
                            <td className="py-3.5 px-5">
                              <div className="flex flex-wrap gap-1">
                                {cats.map(cat => (<span key={cat} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 capitalize">{cat}</span>))}
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-right"><span className="text-xs text-slate-300">{formatCOP(valPorItem)}</span></td>
                            <td className="py-3.5 px-5 text-right"><span className="text-sm font-extrabold text-emerald-400">{formatCOP(col.totalGanado)}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" /><h3 className="text-base font-bold text-white">Compras del Mes</h3></div>
                  {purchaseTab === 'manual' && (
                    <button onClick={() => setShowManualForm(true)}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Registrar Compra Manual
                    </button>
                  )}
                </div>
                <div className="flex border-b border-slate-800 pb-0">
                  <button onClick={() => setPurchaseTab('manual')}
                    className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${purchaseTab === 'manual' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                    <ShoppingCart className="w-3.5 h-3.5" /> Compras Manuales {itemsAplanados.length > 0 && <span className="text-[10px] text-slate-500 ml-1">({itemsAplanados.length})</span>}
                  </button>
                  <button onClick={() => setPurchaseTab('web')}
                    className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${purchaseTab === 'web' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                    <Globe className="w-3.5 h-3.5" /> Compras Web {webPurchases.length > 0 && <span className="text-[10px] text-slate-500 ml-1">({webPurchases.length})</span>}
                  </button>
                </div>
              </div>

              {purchaseTab === 'manual' ? (
                itemsAplanados.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                    <p className="text-sm">No hay compras manuales registradas</p>
                    <button onClick={() => setShowManualForm(true)} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer">Registrar primera compra manual</button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                          <th className="py-3 px-4">Cliente / Descripción</th>
                          <th className="py-3 px-4">Colaborador</th>
                          <th className="py-3 px-4">Categoría</th>
                          <th className="py-3 px-4 text-right">Cant</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                          <th className="py-3 px-4">Origen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {itemsAplanados.map((item, i) => (
                          <tr key={`manual-${item.reportId}-${i}`} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-3 px-4">
                              <div className="text-sm text-slate-200 font-medium">{item.descripcion}</div>
                              {(item.clienteNombre) && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <User className="w-3 h-3" /> {item.clienteNombre}{item.clienteTelefono ? ` - ${item.clienteTelefono}` : ''}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-300">{item.colaboradorNombre}</td>
                            <td className="py-3 px-4"><span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded capitalize">{item.categoria}</span></td>
                            <td className="py-3 px-4 text-right text-sm text-slate-300">{item.cantidad}</td>
                            <td className="py-3 px-4 text-right text-sm font-bold text-emerald-400">{formatCOP(item.valor)}</td>
                            <td className="py-3 px-4">
                              {item.origen === 'web' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                                  <Globe className="w-3 h-3" /> Web
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                                  <ShoppingCart className="w-3 h-3" /> Manual
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                webPurchases.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    <Globe className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                    <p className="text-sm">No hay compras web (cotizaciones aceptadas) en este periodo</p>
                    <p className="text-xs text-slate-600 mt-1">Las cotizaciones aceptadas por clientes aparecerán aquí automáticamente.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                          <th className="py-3 px-4">Cliente</th>
                          <th className="py-3 px-4">Producto</th>
                          <th className="py-3 px-4 text-right">Cant</th>
                          <th className="py-3 px-4 text-right">Valor</th>
                          <th className="py-3 px-4">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {webPurchases.map((item, i) => (
                          <tr key={`web-${item.quoteId}-${i}`} className="hover:bg-slate-800/10 transition-colors">
                            <td className="py-3 px-4">
                              <span className="text-sm text-slate-200 font-medium">{item.clienteNombre}</span>
                              {item.clienteTelefono && <div className="text-[10px] text-slate-400">{item.clienteTelefono}</div>}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-300">{item.productoNombre}</td>
                            <td className="py-3 px-4 text-right text-sm text-slate-300">{item.cantidad}</td>
                            <td className="py-3 px-4 text-right text-sm font-bold text-emerald-400">{formatCOP(item.valor)}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Aceptada
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" /> Reportes Guardados</h3>
                <span className="text-xs text-slate-500">{reportesFiltrados.length}</span>
              </div>
              {fetching ? (
                <div className="py-6 text-center text-slate-500 text-xs">Cargando...</div>
              ) : reportesFiltrados.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">Sin reportes en este periodo</div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {reportesFiltrados.map(r => (
                    <div key={r.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-mono text-cyan-400 font-bold">{r.periodo}</span>
                        <span className="text-[10px] text-slate-500">{r.items?.length || 0} items</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{r.colaboradorNombre}</div>
                      <div className="text-xs text-emerald-400 font-bold mt-1">Total: {formatCOP(r.totalAPagar || 0)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Tag className="w-4 h-4 text-cyan-400" /> Categorías</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder="Nueva categoría..." value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAgregarCategoria(); }} className={inputClass} />
                <button onClick={handleAgregarCategoria} disabled={!nuevaCategoria.trim()}
                  className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl cursor-pointer disabled:cursor-not-allowed transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categoriasDisponibles.map(cat => (
                  <span key={cat}
                    className={`text-xs px-2.5 py-1 rounded-lg capitalize border cursor-pointer transition-all ${filtroCategoria === cat ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                    onClick={() => setFiltroCategoria(filtroCategoria === cat ? '' : cat)}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Layers className="w-4 h-4 text-cyan-400" /> Distribución por Categoría</h3>
              {itemsAplanados.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(itemsAplanados.reduce((acc, item) => {
                    acc[item.categoria] = (acc[item.categoria] || 0) + item.valor;
                    return acc;
                  }, {} as Record<string, number>)).sort(([, a], [, b]) => b - a).map(([cat, val]) => {
                    const pct = kpiTotales.totalGanado > 0 ? (val / kpiTotales.totalGanado) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-slate-300">{cat}</span>
                          <span className="text-slate-400">{formatCOP(val)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
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

      <AnimatePresence>
        {showManualForm && (
          <ManualPurchaseForm
            colaboradores={colaboradores}
            categorias={categoriasDisponibles}
            periodo={filtroPeriodo}
            token={token!}
            onSave={() => { setShowManualForm(false); loadData(); }}
            onClose={() => setShowManualForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ManualPurchaseForm({
  colaboradores, categorias, periodo, token, onSave, onClose,
}: {
  colaboradores: Colaborador[]; categorias: string[]; periodo: string;
  token: string; onSave: () => void; onClose: () => void;
}) {
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [productos, setProductos] = useState<ProductForm[]>([emptyProduct(colaboradores)]);
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProducto = (tempId: string, field: keyof ProductForm, value: any) => {
    setProductos(prev => prev.map(p => p.tempId === tempId ? { ...p, [field]: value } : p));
  };

  const handleColaboradorChange = (tempId: string, uid: string) => {
    const col = colaboradores.find(c => c.uid === uid);
    setProductos(prev => prev.map(p => p.tempId === tempId ? { ...p, colaboradorUid: uid, colaboradorNombre: col?.nombre || '' } : p));
  };

  const handleAddProducto = () => setProductos(prev => [...prev, emptyProduct(colaboradores)]);
  const handleRemoveProducto = (tempId: string) => setProductos(prev => prev.filter(p => p.tempId !== tempId));

  const handleAddTrabajo = (prodTempId: string) => {
    setProductos(prev => prev.map(p => p.tempId === prodTempId ? { ...p, trabajos: [...p.trabajos, emptyTrabajo(colaboradores)] } : p));
  };
  const handleRemoveTrabajo = (prodTempId: string, trabTempId: string) => {
    setProductos(prev => prev.map(p => p.tempId === prodTempId ? { ...p, trabajos: p.trabajos.filter(t => t.tempId !== trabTempId) } : p));
  };
  const handleTrabajoChange = (prodTempId: string, trabTempId: string, field: keyof TrabajoForm, value: any) => {
    setProductos(prev => prev.map(p => p.tempId === prodTempId ? {
      ...p,
      trabajos: p.trabajos.map(t => t.tempId === trabTempId ? { ...t, [field]: value } : t),
    } : p));
  };
  const handleTrabajoColaborador = (prodTempId: string, trabTempId: string, uid: string) => {
    const col = colaboradores.find(c => c.uid === uid);
    setProductos(prev => prev.map(p => p.tempId === prodTempId ? {
      ...p,
      trabajos: p.trabajos.map(t => t.tempId === trabTempId ? { ...t, colaboradorUid: uid, colaboradorNombre: col?.nombre || '' } : t),
    } : p));
  };

  const handleSubmit = async () => {
    if (!clienteNombre.trim()) { setError('El nombre del cliente es obligatorio'); return; }
    if (!clienteTelefono.trim()) { setError('El teléfono del cliente es obligatorio'); return; }
    if (productos.length === 0) { setError('Agrega al menos un producto'); return; }
    for (const p of productos) {
      if (!p.nombre.trim()) { setError('Todos los productos deben tener nombre'); return; }
      if (!p.colaboradorUid) { setError(`El producto "${p.nombre}" debe tener un colaborador asignado`); return; }
      if (p.cantidad < 1) { setError(`El producto "${p.nombre}" debe tener cantidad mayor a 0`); return; }
    }

    setSaving(true);
    setError(null);
    try {
      const itemsPorColaborador = new Map<string, ReportItem[]>();
      for (const p of productos) {
        const detalle: ProductoDetalle = {
          nombre: p.nombre,
          descripcion: p.descripcion,
          pesoGramos: p.pesoGramos,
          tiempoHoras: p.tiempoHoras,
          tiempoMinutos: p.tiempoMinutos,
          filamentoUsado: p.filamentoUsado,
          costoDiseno: p.costoDiseno,
          costoAccesorios: p.costoAccesorios,
          costoEmpaque: p.costoEmpaque,
          costoPersonalizacion: p.costoPersonalizacion,
          valorUnitario: p.valorUnitario,
          tamanoHorizontal: p.tamanoHorizontal,
          tamanoVertical: p.tamanoVertical,
        };
        const item: ReportItem = {
          categoria: p.categoria,
          descripcion: p.descripcion || p.nombre,
          cantidad: p.cantidad,
          valor: p.cantidad * p.valorUnitario,
          actividad: `Trabajo en ${p.categoria}`,
          notas: notas || undefined,
          clienteNombre: clienteNombre.trim(),
          clienteTelefono: clienteTelefono.trim(),
          origen: 'manual',
          productoDetalle: detalle,
        };
        const colUid = p.colaboradorUid;
        if (!itemsPorColaborador.has(colUid)) itemsPorColaborador.set(colUid, []);
        itemsPorColaborador.get(colUid)!.push(item);

        // Sub-items (trabajos) con colaboradores distintos
        for (const t of p.trabajos) {
          if (!t.colaboradorUid || !t.descripcion.trim() || t.valor <= 0) continue;
          const trabajoItem: ReportItem = {
            categoria: p.categoria,
            descripcion: `${p.descripcion || p.nombre} - ${t.descripcion}`,
            cantidad: 1,
            valor: t.valor,
            actividad: t.descripcion,
            notas: notas || undefined,
            clienteNombre: clienteNombre.trim(),
            clienteTelefono: clienteTelefono.trim(),
            origen: 'manual',
          };
          if (!itemsPorColaborador.has(t.colaboradorUid)) itemsPorColaborador.set(t.colaboradorUid, []);
          itemsPorColaborador.get(t.colaboradorUid)!.push(trabajoItem);
        }
      }

      for (const [colUid, items] of itemsPorColaborador) {
        const col = colaboradores.find(c => c.uid === colUid);
        await crearReporte(token, {
          colaboradorUid: colUid,
          colaboradorNombre: col?.nombre || '',
          periodo,
          categorias: col?.categorias || [],
          items,
          notas: notas || undefined,
        });
      }
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-400" /> Registrar Compra Manual</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}

          {/* ── Datos del Cliente ── */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><User className="w-4 h-4 text-cyan-400" /> Datos del Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">Nombre del Cliente *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)}
                    placeholder="Nombre completo" className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">Teléfono *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)}
                    placeholder="300 123 4567" className={`${inputClass} pl-10`} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Productos ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Box className="w-4 h-4 text-cyan-400" /> Productos ({productos.length})</h3>
              <button onClick={handleAddProducto}
                className="py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Agregar Producto
              </button>
            </div>

            {productos.map((prod, idx) => (
              <div key={prod.tempId} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Producto #{idx + 1}</span>
                  {productos.length > 1 && (
                    <button onClick={() => handleRemoveProducto(prod.tempId)}
                      className="p-1 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1">Nombre del producto</label>
                    <input type="text" value={prod.nombre} onChange={e => updateProducto(prod.tempId, 'nombre', e.target.value)}
                      placeholder="Ej: Caja personalizada" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Categoría</label>
                    <select value={prod.categoria} onChange={e => updateProducto(prod.tempId, 'categoria', e.target.value)} className={selectClass}>
                      {categorias.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Descripción</label>
                  <input type="text" value={prod.descripcion} onChange={e => updateProducto(prod.tempId, 'descripcion', e.target.value)}
                    placeholder="Detalles del trabajo realizado" className={inputClass} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Ruler className="w-3 h-3 inline mr-0.5" /> Ancho (mm)</label>
                    <input type="number" min="0" value={prod.tamanoHorizontal || ''} onChange={e => updateProducto(prod.tempId, 'tamanoHorizontal', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Ruler className="w-3 h-3 inline mr-0.5" /> Alto (mm)</label>
                    <input type="number" min="0" value={prod.tamanoVertical || ''} onChange={e => updateProducto(prod.tempId, 'tamanoVertical', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Weight className="w-3 h-3 inline mr-0.5" /> Peso (g)</label>
                    <input type="number" min="0" value={prod.pesoGramos || ''} onChange={e => updateProducto(prod.tempId, 'pesoGramos', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Box className="w-3 h-3 inline mr-0.5" /> Cantidad</label>
                    <input type="number" min="1" value={prod.cantidad} onChange={e => updateProducto(prod.tempId, 'cantidad', parseInt(e.target.value) || 1)} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Clock className="w-3 h-3 inline mr-0.5" /> Horas</label>
                    <input type="number" min="0" step="0.5" value={prod.tiempoHoras || ''} onChange={e => updateProducto(prod.tempId, 'tiempoHoras', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Clock className="w-3 h-3 inline mr-0.5" /> Minutos</label>
                    <input type="number" min="0" value={prod.tiempoMinutos || ''} onChange={e => updateProducto(prod.tempId, 'tiempoMinutos', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Weight className="w-3 h-3 inline mr-0.5" /> Filamento (g)</label>
                    <input type="number" min="0" value={prod.filamentoUsado || ''} onChange={e => updateProducto(prod.tempId, 'filamentoUsado', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><DollarSign className="w-3 h-3 inline mr-0.5" /> Valor Unit.</label>
                    <input type="number" min="0" value={prod.valorUnitario || ''} onChange={e => updateProducto(prod.tempId, 'valorUnitario', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Pen className="w-3 h-3 inline mr-0.5" /> Diseño ($)</label>
                    <input type="number" min="0" value={prod.costoDiseno || ''} onChange={e => updateProducto(prod.tempId, 'costoDiseno', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Box className="w-3 h-3 inline mr-0.5" /> Accesorios ($)</label>
                    <input type="number" min="0" value={prod.costoAccesorios || ''} onChange={e => updateProducto(prod.tempId, 'costoAccesorios', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Palette className="w-3 h-3 inline mr-0.5" /> Personaliz. ($)</label>
                    <input type="number" min="0" value={prod.costoPersonalizacion || ''} onChange={e => updateProducto(prod.tempId, 'costoPersonalizacion', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Sparkles className="w-3 h-3 inline mr-0.5" /> Empaque ($)</label>
                    <input type="number" min="0" value={prod.costoEmpaque || ''} onChange={e => updateProducto(prod.tempId, 'costoEmpaque', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1"><Users className="w-3 h-3 inline mr-0.5" /> Colaborador que realizó el trabajo *</label>
                  <select value={prod.colaboradorUid} onChange={e => handleColaboradorChange(prod.tempId, e.target.value)} className={selectClass}>
                    <option value="">Seleccionar colaborador</option>
                    {colaboradores.map(col => (<option key={col.uid} value={col.uid}>{col.nombre}</option>))}
                  </select>
                </div>

                {/* ── Trabajos (sub-items) ── */}
                <div className="border-t border-slate-800 pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trabajos adicionales (caja, pintura, etc.)</span>
                    <button onClick={() => handleAddTrabajo(prod.tempId)}
                      className="py-1 px-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors">
                      <Plus className="w-3 h-3" /> Agregar trabajo
                    </button>
                  </div>
                  {prod.trabajos.length === 0 && (
                    <p className="text-[10px] text-slate-600 italic">Sin trabajos adicionales. El valor total va al colaborador principal.</p>
                  )}
                  {prod.trabajos.map((trab, tidx) => (
                    <div key={trab.tempId} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Trabajo #{tidx + 1}</span>
                        <button onClick={() => handleRemoveTrabajo(prod.tempId, trab.tempId)}
                          className="p-0.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 cursor-pointer"><X className="w-3 h-3" /></button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-500 mb-0.5">Descripción</label>
                          <input type="text" value={trab.descripcion} onChange={e => handleTrabajoChange(prod.tempId, trab.tempId, 'descripcion', e.target.value)}
                            placeholder="Ej: Pintura, empaque..." className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-500 mb-0.5">Valor ($)</label>
                          <input type="number" min="0" value={trab.valor || ''} onChange={e => handleTrabajoChange(prod.tempId, trab.tempId, 'valor', parseFloat(e.target.value) || 0)} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-500 mb-0.5">Colaborador</label>
                          <select value={trab.colaboradorUid} onChange={e => handleTrabajoColaborador(prod.tempId, trab.tempId, e.target.value)} className={selectClass}>
                            <option value="">Seleccionar</option>
                            {colaboradores.map(col => (<option key={col.uid} value={col.uid}>{col.nombre}</option>))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-emerald-400 font-bold text-right pt-2 border-t border-slate-800">
                  Total producto: {formatCOP(prod.cantidad * prod.valorUnitario)}
                  {prod.trabajos.filter(t => t.descripcion.trim() && t.valor > 0).length > 0 && (
                    <span className="text-[10px] text-slate-400 font-normal ml-2">
                      (+ {formatCOP(prod.trabajos.filter(t => t.descripcion.trim() && t.valor > 0).reduce((s, t) => s + t.valor, 0))} en trabajos)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1.5">Notas (opcional)</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Notas adicionales sobre esta compra..." />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl text-sm cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
              {saving ? 'Guardando...' : `Guardar ${productos.length > 0 ? `${productos.length} producto${productos.length > 1 ? 's' : ''}` : ''}`}
            </button>
            <button onClick={onClose} className="py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium rounded-xl text-sm cursor-pointer transition-colors">Cancelar</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
