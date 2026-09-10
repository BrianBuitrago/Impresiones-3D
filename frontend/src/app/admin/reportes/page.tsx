'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, ArrowLeft, BarChart3, Users, Tag, DollarSign,
  RefreshCw, Filter,
  Layers, TrendingUp, TrendingDown,
  FileText, Globe, Wallet,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Colaborador, ReportData } from '@/types/reportes';
import { fetchColaboradores, fetchReportes } from '@/services/reporteService';
import { fetchQuotes } from '@/services/quoteService';
import { fetchInversiones } from '@/services/inversionService';
import { formatCOP } from '../components/shared';
import { GRANULARIDADES, bucketKey, bucketLabel, type Granularidad } from '../components/periodo';
import Spinner from '@/components/ui/Spinner';

// Esta página es SOLO analítica (KPIs, comparativa por colaborador,
// rentabilidad) — la gestión (crear/editar/eliminar) de compras manuales y
// web vive en /admin, pestaña "Compras".

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const selectClass = 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50 cursor-pointer transition-colors';

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
  // Granularidad del filtro de periodo: mes puntual, un año completo, o todo
  // el histórico sin filtrar por fecha. Arranca en "todo" para no esconder
  // por defecto compras sin fecha registrada (ej. las importadas del Sheet).
  const [filtroGranularidadReporte, setFiltroGranularidadReporte] = useState<'mensual' | 'anual' | 'todo'>('todo');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroColaboradores, setFiltroColaboradores] = useState<string[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>(['cajas', 'pintura']);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [inversiones, setInversiones] = useState<any[]>([]);
  const [rentGranularidad, setRentGranularidad] = useState<Granularidad>('mensual');

  const loadData = useCallback(async () => {
    if (!token || profile?.rol !== 'administrador') return;
    setFetching(true);
    setError(null);
    try {
      const [cols, reps, qs, invs] = await Promise.all([
        fetchColaboradores(token),
        fetchReportes(token),
        fetchQuotes(token).catch(() => []),
        fetchInversiones(token).catch(() => []),
      ]);
      setColaboradores(cols);
      setReportes(reps);
      setQuotes(Array.isArray(qs) ? qs : []);
      setInversiones(Array.isArray(invs) ? invs : []);
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
    reportes.filter(r => {
      if (filtroGranularidadReporte === 'todo') return true;
      if (filtroGranularidadReporte === 'anual') return !filtroAnio || r.periodo.split('/')[1] === filtroAnio;
      return !filtroPeriodo || r.periodo === filtroPeriodo;
    }),
    [reportes, filtroPeriodo, filtroGranularidadReporte, filtroAnio]
  );

  // Ítems aplanados de los reportes filtrados, solo para la gráfica de
  // distribución por categoría (no hay acciones de edición acá).
  const itemsAplanados = useMemo(() => {
    const items: Array<{ categoria: string; valor: number }> = [];
    for (const r of reportesFiltrados) {
      r.items.forEach(it => {
        if (filtroColaboradores.length > 0 && !filtroColaboradores.includes(r.colaboradorUid)) return;
        if (filtroCategoria && it.categoria !== filtroCategoria) return;
        items.push({ categoria: it.categoria, valor: it.valor });
      });
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
      const uid = r.colaboradorUid || '__sin_asignar__';
      let c = mapa.get(uid);
      if (!c) {
        c = { uid, nombre: r.colaboradorNombre || 'Sin Asignar', totalGanado: 0, totalItems: 0, itemsPorCategoria: {}, valorPorCategoria: {} };
        mapa.set(uid, c);
      }
      const esCompra = r.tipo === 'compra';
      if (esCompra) c.totalGanado += r.totalRecibido || 0;
      for (const it of r.items) {
        if (!esCompra) c.totalGanado += it.valor;
        c.totalItems += it.cantidad;
        c.itemsPorCategoria[it.categoria] = (c.itemsPorCategoria[it.categoria] || 0) + it.cantidad;
        c.valorPorCategoria[it.categoria] = (c.valorPorCategoria[it.categoria] || 0) + it.valor;
      }
    }
    return Array.from(mapa.values()).sort((a, b) => b.totalGanado - a.totalGanado);
  }, [reportesFiltrados]);

  // ── Rentabilidad: compras entregadas vs. inversiones, por período ──────────
  const comprasEntregadas = useMemo(
    () => quotes.filter(q => q.estado === 'aceptado' && q.subEstado === 'entregado'),
    [quotes]
  );

  const rentabilidadPorPeriodo = useMemo(() => {
    if (rentGranularidad === 'total') {
      const compras = comprasEntregadas.reduce((acc, q) => acc + (q.precioTotalCotizacion || q.precioTotal || 0), 0);
      const inversionesTotal = inversiones.reduce((acc, i) => acc + (i.total || 0), 0);
      return [{ key: 'total', label: 'Todo el histórico', compras, inversiones: inversionesTotal, rentabilidad: compras - inversionesTotal }];
    }
    const map = new Map<string, { compras: number; inversiones: number }>();
    for (const q of comprasEntregadas) {
      const key = bucketKey(q.creadoEn || q.Fecha || '', rentGranularidad);
      const entry = map.get(key) || { compras: 0, inversiones: 0 };
      entry.compras += q.precioTotalCotizacion || q.precioTotal || 0;
      map.set(key, entry);
    }
    for (const inv of inversiones) {
      const key = bucketKey(inv.fecha || '', rentGranularidad);
      const entry = map.get(key) || { compras: 0, inversiones: 0 };
      entry.inversiones += inv.total || 0;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, v]) => ({ key, label: bucketLabel(key, rentGranularidad), ...v, rentabilidad: v.compras - v.inversiones }));
  }, [comprasEntregadas, inversiones, rentGranularidad]);

  const kpiTotales = useMemo(() => {
    // "Total Ganado" no debe incluir el saldo pendiente de cobro de las
    // compras (item.valor ahí es el precio de venta completo, no lo que ya
    // entró). Para reportes tipo="compra" se usa totalRecibido (a nivel de
    // reporte); para el resto (trabajo de colaboradores) se sigue sumando
    // item.valor como siempre, que ahí sí representa lo ganado/adeudado.
    // Compras Manuales (tipo='compra', incluye lo importado del Sheet) vs.
    // Compras Web (items con origen='web', creados al aceptar una cotización
    // -ver buildQuoteReportItems.ts-): ambas suman a Total Ganado, pero acá
    // se separan para ver de dónde viene la plata. Respetan el mismo filtro
    // de período que el resto de esta fila de KPIs (a diferencia de
    // "Ganancia", que es histórica a propósito).
    let totalGanado = 0, totalItems = 0, totalRentabilidad = 0, totalRestante = 0;
    let totalComprasManuales = 0, totalComprasWeb = 0;
    const cols = new Set<string>(), cats = new Set<string>();
    for (const r of reportesFiltrados) {
      cols.add(r.colaboradorUid);
      const esCompra = r.tipo === 'compra';
      if (esCompra) {
        totalGanado += r.totalRecibido || 0;
        totalComprasManuales += r.totalRecibido || 0;
        totalRestante += r.restante || 0;
      }
      for (const it of r.items) {
        if (!esCompra) totalGanado += it.valor;
        if (it.origen === 'web') totalComprasWeb += it.valor;
        totalRentabilidad += it.rentabilidad || 0;
        totalItems += it.cantidad;
        cats.add(it.categoria);
      }
    }
    return {
      totalGanado, totalItems, colaboradoresUnicos: cols.size, categoriasUnicas: cats.size,
      totalRentabilidad, totalRestante, totalComprasManuales, totalComprasWeb,
    };
  }, [reportesFiltrados]);

  // ── Ganancia = Total Ganado histórico - Inversiones histórico ──────────────
  // Deliberadamente NO respeta el filtro de período de arriba (a diferencia
  // de kpiTotales.totalGanado): las inversiones son un desembolso de una
  // sola vez (comprar una impresora, por ejemplo), así que compararlas
  // contra la ganancia de un solo mes daría un número sin sentido. Acá
  // siempre es "desde que arrancamos, ¿ya recuperamos lo invertido?".
  const gananciaTotal = useMemo(() => {
    let totalGanadoHistorico = 0;
    for (const r of reportes) {
      const esCompra = r.tipo === 'compra';
      if (esCompra) {
        totalGanadoHistorico += r.totalRecibido || 0;
      }
      for (const it of r.items) {
        if (!esCompra) totalGanadoHistorico += it.valor;
      }
    }
    const inversionesTotal = inversiones.reduce((acc, i) => acc + (i.total || 0), 0);
    return { totalGanadoHistorico, inversionesTotal, ganancia: totalGanadoHistorico - inversionesTotal };
  }, [reportes, inversiones]);

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

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="2xl" />
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
                Reportes
              </h1>
              <p className="text-slate-400 text-sm mt-1">Ganancias, rentabilidad y rendimiento por colaborador. La gestión de compras vive en la pestaña "Compras" del panel.</p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold capitalize bg-slate-900 border border-slate-800 text-cyan-400">{profile?.nombre}</span>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Cerrar mensaje de error" className="text-red-300 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                Periodo
              </label>
              <div className="flex gap-1 mb-1.5">
                {([['mensual', 'Mensual'], ['anual', 'Anual'], ['todo', 'Todo']] as const).map(([g, label]) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFiltroGranularidadReporte(g)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${filtroGranularidadReporte === g ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {filtroGranularidadReporte === 'mensual' && (
                <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} className={selectClass}>
                  {(() => {
                    const periods = new Set(reportes.map(r => r.periodo));
                    const start = new Date(2026, 0, 1);
                    const now = new Date();
                    const d = new Date(start);
                    while (d <= now) {
                      periods.add(`${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`);
                      d.setMonth(d.getMonth() + 1);
                    }
                    return Array.from(periods).sort().map(p => (<option key={p} value={p}>{p}</option>));
                  })()}
                </select>
              )}
              {filtroGranularidadReporte === 'anual' && (
                <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)} className={selectClass}>
                  <option value="">Todos los años</option>
                  {(() => {
                    const years = Array.from(new Set(reportes.map(r => r.periodo.split('/')[1]).filter(Boolean))).sort();
                    return years.map(y => (<option key={y} value={y}>20{y}</option>));
                  })()}
                </select>
              )}
              {filtroGranularidadReporte === 'todo' && (
                <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 text-sm">Todo el histórico</div>
              )}
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
                title="Recargar" aria-label="Recargar reportes"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Ganado', value: formatCOP(kpiTotales.totalGanado), icon: DollarSign, color: 'text-emerald-400' },
            {
              label: 'Ganancia',
              value: formatCOP(gananciaTotal.ganancia),
              icon: gananciaTotal.ganancia >= 0 ? TrendingUp : TrendingDown,
              color: gananciaTotal.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400',
              hint: `Total Ganado histórico (${formatCOP(gananciaTotal.totalGanadoHistorico)}) menos Inversiones histórico (${formatCOP(gananciaTotal.inversionesTotal)}). No respeta el filtro de período de arriba.`,
            },
            { label: 'Compras Manuales', value: formatCOP(kpiTotales.totalComprasManuales), icon: FileText, color: 'text-emerald-400', hint: 'Compras registradas a mano o importadas del histórico del Sheet (tipo="compra"), usando lo efectivamente recibido (totalRecibido).' },
            { label: 'Compras Web', value: formatCOP(kpiTotales.totalComprasWeb), icon: Globe, color: 'text-cyan-400', hint: 'Cotizaciones aceptadas desde el sitio (items con origen="web"). Se asume 100% cobrado al aceptar, no maneja abono/restante.' },
            { label: 'Total Compras', value: formatCOP(kpiTotales.totalComprasManuales + kpiTotales.totalComprasWeb), icon: Wallet, color: 'text-white', hint: 'Compras Manuales + Compras Web.' },
            { label: 'Rentabilidad', value: formatCOP(kpiTotales.totalRentabilidad), icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Restante por Cobrar', value: formatCOP(kpiTotales.totalRestante), icon: DollarSign, color: 'text-amber-400' },
            { label: 'Items Realizados', value: kpiTotales.totalItems.toLocaleString('es-CO'), icon: Layers, color: 'text-cyan-400' },
            { label: 'Colaboradores Activos', value: kpiTotales.colaboradoresUnicos, icon: Users, color: 'text-blue-400' },
            { label: 'Categorías', value: kpiTotales.categoriasUnicas, icon: Tag, color: 'text-amber-400' },
          ].map(kpi => (
            <div key={kpi.label} title={'hint' in kpi ? kpi.hint : undefined} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* ── Rentabilidad: compras entregadas vs. inversiones ── */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Rentabilidad: Compras vs. Inversiones</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">ver por:</span>
              <select
                value={rentGranularidad}
                onChange={e => setRentGranularidad(e.target.value as Granularidad)}
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs font-semibold cursor-pointer focus:outline-none"
              >
                {GRANULARIDADES.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          {rentabilidadPorPeriodo.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-700" />
              <p className="text-sm">Sin compras entregadas ni inversiones todavía</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4">Período</th>
                    <th className="py-3 px-4 text-right">Compras entregadas</th>
                    <th className="py-3 px-4 text-right">Inversiones</th>
                    <th className="py-3 px-4 text-right">Rentabilidad</th>
                    <th className="py-3 px-4 text-right">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rentabilidadPorPeriodo.map(row => (
                    <tr key={row.key} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-3 px-4 text-sm font-semibold text-white whitespace-nowrap">{row.label}</td>
                      <td className="py-3 px-4 text-sm text-emerald-400 text-right font-bold whitespace-nowrap">{formatCOP(row.compras)}</td>
                      <td className="py-3 px-4 text-sm text-amber-400 text-right font-bold whitespace-nowrap">{formatCOP(row.inversiones)}</td>
                      <td className={`py-3 px-4 text-sm text-right font-bold whitespace-nowrap ${row.rentabilidad >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {formatCOP(row.rentabilidad)}
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-semibold whitespace-nowrap ${row.rentabilidad >= 0 ? 'text-slate-300' : 'text-red-400'}`}>
                        {row.compras > 0 ? `${((row.rentabilidad / row.compras) * 100).toFixed(1)}%` : '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" /><h3 className="text-base font-bold text-white">Comparativa por Colaborador</h3></div>
                <span className="text-xs text-slate-500">{comparativa.length} colaboradores</span>
              </div>
              {fetching ? (
                <div className="p-12 flex flex-col items-center gap-2">
                  <Spinner size="lg" />
                  <p className="text-slate-500 text-xs">Cargando...</p>
                </div>
              ) : comparativa.length === 0 ? (
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
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Tag className="w-4 h-4 text-cyan-400" /> Categorías</h3>
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
              <p className="text-[10px] text-slate-500 mt-3">Para crear una categoría nueva, asignala a una compra manual desde la pestaña "Compras" del panel.</p>
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
    </div>
  );
}
