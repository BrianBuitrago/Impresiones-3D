'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, FileText, ShoppingCart, User, Phone, X, Box, DollarSign, Users, Globe, Tag, Calendar, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import type { Colaborador, ReportData, ReportItem, ProductoDetalle } from '@/types/reportes';
import { fetchColaboradores, fetchReportes, crearReporte, updateReporte, deleteReporte } from '@/services/reporteService';
import { sincronizarPedidosConfirmados } from '@/services/syncService';
import { formatCOP } from './shared';
import SettingsEditModal from '@/components/ui/SettingsEditModal';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

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

// Gestión (crear/editar/eliminar) de compras cargadas a mano — antes vivía
// dentro de /admin/reportes, que pasó a ser solo analítica. Acá conviven con
// las Compras Web (cotizaciones aceptadas) en la misma pestaña "Compras".
// Solo administradores acceden a este panel (se gatea desde ComprasTab).
export default function ComprasManualesPanel() {
  const { token } = useAuth();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [reportes, setReportes] = useState<ReportData[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtroGranularidad, setFiltroGranularidad] = useState<'mensual' | 'anual' | 'todo'>('todo');
  const [filtroPeriodo, setFiltroPeriodo] = useState(() => {
    const now = new Date();
    return `${MONTHS[now.getMonth()]}/${String(now.getFullYear()).slice(-2)}`;
  });
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroColaboradores, setFiltroColaboradores] = useState<string[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [showManualForm, setShowManualForm] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{
    reportId: string; itemIndex: number; descripcion: string; categoria: string; cantidad: number; valor: number;
  } | null>(null);
  const [deletingItemKey, setDeletingItemKey] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>(['cajas', 'pintura']);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    setError(null);
    try {
      const [cols, reps] = await Promise.all([fetchColaboradores(token), fetchReportes(token)]);
      setColaboradores(cols);
      setReportes(reps);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSincronizar = async () => {
    if (!token || syncing) return;
    setSyncing(true);
    try {
      const r = await sincronizarPedidosConfirmados(token);
      if (r.creados === 0 && r.eliminados === 0) {
        alert('Sin cambios: el Sheet y la app ya están sincronizados.');
      } else {
        alert(`Sincronizado: ${r.creados} compra(s) nueva(s) traída(s) del Sheet, ${r.eliminados} eliminada(s) porque ya no están ahí.`);
      }
      await loadData();
    } catch (err: any) {
      alert(`No se pudo sincronizar: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

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

  const handleEditReport = (r: ReportData) => {
    setEditingReport(r);
    setShowManualForm(true);
  };

  const handleDeleteReport = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await deleteReporte(token, id);
      setReportes(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Elimina UNA compra dentro de un reporte sin tocar las demás. Si era la
  // única compra del reporte, se elimina el reporte entero (no tiene sentido
  // dejar un reporte con 0 items).
  const handleDeleteManualItem = async (reportId: string, itemIndex: number) => {
    if (!token) return;
    const report = reportes.find(r => r.id === reportId);
    if (!report) return;
    const key = `${reportId}-${itemIndex}`;
    setDeletingItemKey(key);
    setError(null);
    try {
      const newItems = report.items.filter((_, idx) => idx !== itemIndex);
      if (newItems.length === 0) {
        await deleteReporte(token, reportId);
        setReportes(prev => prev.filter(r => r.id !== reportId));
      } else {
        const updated = await updateReporte(token, reportId, { items: newItems });
        setReportes(prev => prev.map(r => r.id === reportId ? updated : r));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingItemKey(null);
    }
  };

  const handleStartEditItem = (reportId: string, itemIndex: number) => {
    const report = reportes.find(r => r.id === reportId);
    const item = report?.items[itemIndex];
    if (!report || !item) return;
    setEditingItem({
      reportId,
      itemIndex,
      descripcion: item.descripcion || '',
      categoria: item.categoria || categoriasDisponibles[0] || '',
      cantidad: item.cantidad || 1,
      valor: item.valor || 0,
    });
  };

  const handleSaveEditItem = async () => {
    if (!token || !editingItem) return;
    const report = reportes.find(r => r.id === editingItem.reportId);
    if (!report) { setEditingItem(null); return; }
    setSavingItem(true);
    setError(null);
    try {
      const newItems = report.items.map((it, idx) =>
        idx === editingItem.itemIndex
          ? { ...it, descripcion: editingItem.descripcion, categoria: editingItem.categoria, cantidad: editingItem.cantidad, valor: editingItem.valor }
          : it
      );
      const updated = await updateReporte(token, editingItem.reportId, { items: newItems });
      setReportes(prev => prev.map(r => r.id === updated.id ? updated : r));
      setEditingItem(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingItem(false);
    }
  };

  const reportesFiltrados = useMemo(() =>
    reportes.filter(r => {
      if (filtroGranularidad === 'todo') return true;
      if (filtroGranularidad === 'anual') return !filtroAnio || r.periodo.split('/')[1] === filtroAnio;
      return !filtroPeriodo || r.periodo === filtroPeriodo;
    }),
    [reportes, filtroPeriodo, filtroGranularidad, filtroAnio]
  );

  const itemsAplanados = useMemo(() => {
    const items: Array<{
      reportId: string;
      itemIndex: number;
      colaboradorNombre: string;
      categoria: string;
      descripcion: string;
      cantidad: number;
      valor: number;
      clienteNombre?: string;
      clienteTelefono?: string;
      origen?: string;
    }> = [];
    for (const r of reportesFiltrados) {
      r.items.forEach((it, idx) => {
        if (filtroColaboradores.length > 0 && !filtroColaboradores.includes(r.colaboradorUid)) return;
        if (filtroCategoria && it.categoria !== filtroCategoria) return;
        items.push({
          reportId: r.id,
          itemIndex: idx,
          colaboradorNombre: r.colaboradorNombre,
          categoria: it.categoria,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          valor: it.valor,
          clienteNombre: it.clienteNombre,
          clienteTelefono: it.clienteTelefono,
          origen: it.origen,
        });
      });
    }
    return items;
  }, [reportesFiltrados, filtroColaboradores, filtroCategoria]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filtros + categorías */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" /> Periodo
            </label>
            <div className="flex gap-1 mb-1.5">
              {([['mensual', 'Mensual'], ['anual', 'Anual'], ['todo', 'Todo']] as const).map(([g, label]) => (
                <button key={g} type="button" onClick={() => setFiltroGranularidad(g)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${filtroGranularidad === g ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                  {label}
                </button>
              ))}
            </div>
            {filtroGranularidad === 'mensual' && (
              <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} className={selectClass}>
                {Array.from(new Set(reportes.map(r => r.periodo))).sort().map(p => (<option key={p} value={p}>{p}</option>))}
              </select>
            )}
            {filtroGranularidad === 'anual' && (
              <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)} className={selectClass}>
                <option value="">Todos los años</option>
                {Array.from(new Set(reportes.map(r => r.periodo.split('/')[1]).filter(Boolean))).sort().map(y => (<option key={y} value={y}>20{y}</option>))}
              </select>
            )}
            {filtroGranularidad === 'todo' && (
              <div className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 text-sm">Todo el histórico</div>
            )}
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
              <Users className="w-3 h-3 inline mr-1" /> Colaborador
            </label>
            <select value={filtroColaboradores[0] || ''} onChange={e => setFiltroColaboradores(e.target.value ? [e.target.value] : [])} className={selectClass}>
              <option value="">Todos</option>
              {colaboradores.map(col => (<option key={col.uid} value={col.uid}>{col.nombre}</option>))}
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
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
          <input type="text" placeholder="Nueva categoría..." value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAgregarCategoria(); }}
            className="flex-1 min-w-[140px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs outline-none focus:border-cyan-500/50" />
          <button onClick={handleAgregarCategoria} disabled={!nuevaCategoria.trim()} aria-label="Agregar categoría"
            className="p-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg cursor-pointer disabled:cursor-not-allowed transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
          {categoriasDisponibles.map(cat => (
            <span key={cat}
              className={`text-[11px] px-2 py-1 rounded-lg capitalize border cursor-pointer transition-all ${filtroCategoria === cat ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              onClick={() => setFiltroCategoria(filtroCategoria === cat ? '' : cat)}>
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-emerald-400 shrink-0" /><h3 className="text-base font-bold text-white">Compras Manuales {itemsAplanados.length > 0 && <span className="text-slate-500 font-normal">({itemsAplanados.length})</span>}</h3></div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button onClick={handleSincronizar} disabled={syncing} title="Trae al panel lo que se haya agregado o borrado en la pestaña 'Pedidos confirmados' del Google Sheet"
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-700 whitespace-nowrap">
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Sincronizando...' : 'Sincronizar con Google Sheet'}
            </button>
            <button onClick={() => setShowManualForm(true)}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap">
              <Plus className="w-3.5 h-3.5 shrink-0" /> Registrar Compra Manual
            </button>
          </div>
        </div>

        {fetching ? (
          <div className="p-10 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs">Cargando...</p>
          </div>
        ) : itemsAplanados.length === 0 ? (
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
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {itemsAplanados.map((item, i) => {
                  const itemKey = `${item.reportId}-${item.itemIndex}`;
                  return (
                    <tr key={`manual-${itemKey}-${i}`} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-200 font-medium">{item.descripcion}</div>
                        {item.clienteNombre && (
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
                      <td className="py-3 px-4">
                        {item.origen !== 'web' && (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleStartEditItem(item.reportId, item.itemIndex)} title="Editar esta compra"
                              className="text-[9px] px-2 py-0.5 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-400 rounded-lg cursor-pointer transition-colors whitespace-nowrap">
                              Editar
                            </button>
                            <button onClick={() => handleDeleteManualItem(item.reportId, item.itemIndex)} disabled={deletingItemKey === itemKey} title="Eliminar esta compra"
                              className="text-[9px] px-2 py-0.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 rounded-lg cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap">
                              {deletingItemKey === itemKey ? '...' : 'Eliminar'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reportes guardados (para editar/eliminar el reporte completo, ej. si tiene varias compras juntas) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" /> Reportes Guardados</h3>
          <span className="text-xs text-slate-500">{reportesFiltrados.length}</span>
        </div>
        {reportesFiltrados.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">Sin reportes en este periodo</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
            {reportesFiltrados.map((r, idx) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx, 10) * 0.02 }}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition-all group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-mono text-cyan-400 font-bold">{r.periodo}</span>
                  <span className="text-[10px] text-slate-500">{r.items?.length || 0} items</span>
                </div>
                <div className="text-[11px] text-slate-400">{r.colaboradorNombre}</div>
                {r.pedidoId && <div className="text-[10px] text-slate-500">Pedido: <span className="text-slate-300">{r.pedidoId}</span></div>}
                {r.tipo && <span className="inline-block text-[9px] mt-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">{r.tipo}</span>}
                {(r.abono || r.restante || r.totalRecibido) ? (
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    {r.abono ? <>Abono: <span className="text-emerald-400">{formatCOP(r.abono)}</span></> : ''}
                    {r.abono && r.restante ? ' | ' : ''}
                    {r.restante ? <>Restante: <span className="text-amber-400">{formatCOP(r.restante)}</span></> : ''}
                    {(r.abono || r.restante) && r.totalRecibido ? ' | ' : ''}
                    {r.totalRecibido ? <>Recibido: <span className="text-cyan-400">{formatCOP(r.totalRecibido)}</span></> : ''}
                  </div>
                ) : null}
                <div className="text-xs text-emerald-400 font-bold mt-1">Total: {formatCOP(r.totalAPagar || 0)}</div>
                <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditReport(r)} className="text-[9px] px-2 py-0.5 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-400 rounded-lg cursor-pointer transition-colors">Editar</button>
                  <button onClick={() => handleDeleteReport(r.id)} disabled={deletingId === r.id}
                    className="text-[9px] px-2 py-0.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 rounded-lg cursor-pointer disabled:opacity-50 transition-colors">
                    {deletingId === r.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showManualForm && token && (
          <ManualPurchaseForm
            colaboradores={colaboradores}
            categorias={categoriasDisponibles}
            periodo={filtroPeriodo}
            token={token}
            reporteEdit={editingReport}
            onSave={() => { setShowManualForm(false); setEditingReport(null); loadData(); }}
            onClose={() => { setShowManualForm(false); setEditingReport(null); }}
          />
        )}
      </AnimatePresence>

      {editingItem && (
        <SettingsEditModal title="Editar compra" onSave={handleSaveEditItem} onCancel={() => setEditingItem(null)}>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción</label>
            <input type="text" value={editingItem.descripcion} onChange={e => setEditingItem(prev => prev && { ...prev, descripcion: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoría</label>
            <select value={editingItem.categoria} onChange={e => setEditingItem(prev => prev && { ...prev, categoria: e.target.value })} className={selectClass}>
              {categoriasDisponibles.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cantidad</label>
              <input type="number" min={1} value={editingItem.cantidad} onChange={e => setEditingItem(prev => prev && { ...prev, cantidad: parseInt(e.target.value) || 1 })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Valor</label>
              <input type="number" min={0} value={editingItem.valor} onChange={e => setEditingItem(prev => prev && { ...prev, valor: parseFloat(e.target.value) || 0 })} className={inputClass} />
            </div>
          </div>
          {savingItem && <p className="text-xs text-slate-500">Guardando...</p>}
        </SettingsEditModal>
      )}
    </div>
  );
}

function ManualPurchaseForm({
  colaboradores, categorias, periodo, token, reporteEdit, onSave, onClose,
}: {
  colaboradores: Colaborador[]; categorias: string[]; periodo: string; token: string;
  reporteEdit?: ReportData | null; onSave: () => void; onClose: () => void;
}) {
  const isEditing = !!reporteEdit;
  const [clienteNombre, setClienteNombre] = useState(() => reporteEdit?.items[0]?.clienteNombre || '');
  const [clienteTelefono, setClienteTelefono] = useState(() => reporteEdit?.items[0]?.clienteTelefono || '');
  const [productos, setProductos] = useState<ProductForm[]>(() => {
    if (reporteEdit) {
      return reporteEdit.items.map(item => {
        const d = item.productoDetalle;
        return {
          tempId: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
          nombre: item.descripcion,
          descripcion: d?.descripcion || '',
          categoria: item.categoria,
          cantidad: item.cantidad,
          valorUnitario: d?.valorUnitario || (item.cantidad > 0 ? item.valor / item.cantidad : item.valor),
          colaboradorUid: reporteEdit.colaboradorUid,
          colaboradorNombre: reporteEdit.colaboradorNombre,
          trabajos: [],
        };
      });
    }
    return [emptyProduct(colaboradores)];
  });
  const [selectedPeriodo, setSelectedPeriodo] = useState(reporteEdit?.periodo || periodo);
  const [notas, setNotas] = useState(reporteEdit?.notas || '');
  const [fechaConfirmacion, setFechaConfirmacion] = useState(reporteEdit?.fechaConfirmacion || '');
  const [pedidoId, setPedidoId] = useState(reporteEdit?.pedidoId || '');
  const [tipo, setTipo] = useState(reporteEdit?.tipo || '');
  const [abono, setAbono] = useState(reporteEdit?.abono || 0);
  const [restante, setRestante] = useState(reporteEdit?.restante || 0);
  const [totalRecibido, setTotalRecibido] = useState(reporteEdit?.totalRecibido || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodosDisponibles = useMemo(() => {
    const opts: string[] = [];
    const start = new Date(2026, 0, 1);
    const now = new Date();
    const d = new Date(start);
    while (d <= now) {
      opts.push(`${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`);
      d.setMonth(d.getMonth() + 1);
    }
    return opts;
  }, []);

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
    if (productos.length === 0) { setError('Agrega al menos un producto'); return; }
    for (const p of productos) {
      if (!p.nombre.trim()) { setError('Todos los productos deben tener nombre'); return; }
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
          valorUnitario: p.valorUnitario,
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
        const colUid = p.colaboradorUid || '__sin_asignar__';
        if (!itemsPorColaborador.has(colUid)) itemsPorColaborador.set(colUid, []);
        itemsPorColaborador.get(colUid)!.push(item);

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

      if (isEditing && reporteEdit) {
        const allItems: ReportItem[] = [];
        for (const [, items] of itemsPorColaborador) allItems.push(...items);
        await updateReporte(token, reporteEdit.id, {
          periodo: selectedPeriodo,
          categorias: [],
          items: allItems,
          notas: notas || undefined,
          fechaConfirmacion: fechaConfirmacion || undefined,
          pedidoId: pedidoId || undefined,
          tipo: tipo || undefined,
          abono: abono || undefined,
          restante: restante || undefined,
          totalRecibido: totalRecibido || undefined,
        });
      } else {
        for (const [colUid, items] of itemsPorColaborador) {
          const col = colUid === '__sin_asignar__' ? null : colaboradores.find(c => c.uid === colUid);
          await crearReporte(token, {
            colaboradorUid: colUid,
            colaboradorNombre: col?.nombre || 'Sin Asignar',
            periodo: selectedPeriodo,
            categorias: col?.categorias || [],
            items,
            notas: notas || undefined,
            fechaConfirmacion: fechaConfirmacion || undefined,
            pedidoId: pedidoId || undefined,
            tipo: tipo || undefined,
            abono: abono || undefined,
            restante: restante || undefined,
            totalRecibido: totalRecibido || undefined,
          });
        }
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
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">{isEditing ? <FileText className="w-5 h-5 text-cyan-400" /> : <Plus className="w-5 h-5 text-emerald-400" />} {isEditing ? 'Editar Reporte' : 'Registrar Compra Manual'}</h2>
            <select value={selectedPeriodo} onChange={e => setSelectedPeriodo(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs font-bold outline-none focus:border-cyan-500/50 cursor-pointer">
              {periodosDisponibles.map(p => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
          <button onClick={onClose} aria-label="Cerrar formulario" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}

          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><User className="w-4 h-4 text-cyan-400" /> Datos del Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">nombre del cliente *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)}
                    placeholder="Nombre completo" className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)}
                    placeholder="300 123 4567" className={`${inputClass} pl-10`} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-400" /> Información del Pedido</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">fecha de confirmación</label>
                <input type="date" value={fechaConfirmacion} onChange={e => setFechaConfirmacion(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">id del pedido</label>
                <input type="text" value={pedidoId} onChange={e => setPedidoId(e.target.value)} placeholder="Ej: PED-001" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">tipo</label>
                <select value={tipo} onChange={e => setTipo(e.target.value)} className={selectClass}>
                  <option value="">Sin tipo</option>
                  <option value="conseñal">Con seña</option>
                  <option value="completo">Pago completo</option>
                  <option value="contrato">Contrato</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">abono ($)</label>
                <input type="number" min="0" step="0.01" value={abono || ''} onChange={e => setAbono(parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">restante ($)</label>
                <input type="number" min="0" step="0.01" value={restante || ''} onChange={e => setRestante(parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1.5">total recibido ($)</label>
                <input type="number" min="0" step="0.01" value={totalRecibido || ''} onChange={e => setTotalRecibido(parseFloat(e.target.value) || 0)} className={inputClass} />
              </div>
            </div>
          </div>

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
                    <label className="block text-[10px] text-slate-500 mb-1">nombre del producto</label>
                    <input type="text" value={prod.nombre} onChange={e => updateProducto(prod.tempId, 'nombre', e.target.value)}
                      placeholder="Ej: Caja personalizada" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">categoría</label>
                    <select value={prod.categoria} onChange={e => updateProducto(prod.tempId, 'categoria', e.target.value)} className={selectClass}>
                      {categorias.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">descripción</label>
                  <input type="text" value={prod.descripcion} onChange={e => updateProducto(prod.tempId, 'descripcion', e.target.value)}
                    placeholder="Detalles del trabajo realizado" className={inputClass} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Box className="w-3 h-3 inline mr-0.5" /> cantidad</label>
                    <input type="number" min="1" value={prod.cantidad} onChange={e => updateProducto(prod.tempId, 'cantidad', parseInt(e.target.value) || 1)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><DollarSign className="w-3 h-3 inline mr-0.5" /> valor unit.</label>
                    <input type="number" min="0" value={prod.valorUnitario || ''} onChange={e => updateProducto(prod.tempId, 'valorUnitario', parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1"><Users className="w-3 h-3 inline mr-0.5" /> colaborador *</label>
                    <select value={prod.colaboradorUid} onChange={e => handleColaboradorChange(prod.tempId, e.target.value)} className={selectClass}>
                      <option value="">Seleccionar</option>
                      {colaboradores.map(col => (<option key={col.uid} value={col.uid}>{col.nombre}</option>))}
                    </select>
                  </div>
                </div>

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
            <label className="block text-xs text-slate-400 font-bold mb-1.5">notas (opcional)</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Notas adicionales sobre esta compra..." />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl text-sm cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
              {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : `Guardar ${productos.length > 0 ? `${productos.length} producto${productos.length > 1 ? 's' : ''}` : ''}`}
            </button>
            <button onClick={onClose} className="py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium rounded-xl text-sm cursor-pointer transition-colors">Cancelar</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
