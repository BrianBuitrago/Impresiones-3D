'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, ArrowLeft, Wallet, Plus, X, Check,
  Package, Cpu, Layers, Pencil, Trash2, Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCOP } from '../components/shared';
import { GRANULARIDADES, bucketKey, bucketLabel, resolverPeriodo, type Granularidad } from '../components/periodo';
import { fetchInversiones, crearInversion, actualizarInversion, eliminarInversion } from '@/services/inversionService';
import type { Inversion, InversionInput, TipoInversion } from '@/types/inversiones';

const tipoBadgeClass = (tipo: TipoInversion) =>
  tipo === 'maquina'
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400';

const emptyForm = (): InversionInput => ({
  elemento: '',
  tipo: 'insumo',
  proveedor: '',
  cantidad: 1,
  costo: 0,
  valorUnitario: 0,
  fecha: new Date().toISOString().slice(0, 10),
  observaciones: '',
});

export default function InversionesPage() {
  const { user, profile, token, loading } = useAuth();
  const router = useRouter();

  const [inversiones, setInversiones] = useState<Inversion[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [granularidad, setGranularidad] = useState<Granularidad>('mensual');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InversionInput>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!token) return;
    setFetching(true);
    setError(null);
    try {
      setInversiones(await fetchInversiones(token));
    } catch (err: any) {
      setError(err.message || 'Error al cargar inversiones.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!user || profile?.rol !== 'administrador') return;
    fetchAll();
  }, [user, profile, token]);

  const { periodosAscendente, periodoEfectivo } = useMemo(
    () => resolverPeriodo(inversiones, i => i.fecha, granularidad, periodoSeleccionado),
    [inversiones, granularidad, periodoSeleccionado]
  );

  const periodosParaDropdown = useMemo(() => [...periodosAscendente].reverse(), [periodosAscendente]);

  const inversionesDelPeriodo = useMemo(() => {
    if (granularidad === 'total') return inversiones;
    if (!periodoEfectivo) return [];
    return inversiones.filter(i => bucketKey(i.fecha, granularidad) === periodoEfectivo);
  }, [inversiones, granularidad, periodoEfectivo]);

  const totalInvertido = inversionesDelPeriodo.reduce((acc, i) => acc + i.total, 0);
  const totalInsumos = inversionesDelPeriodo.filter(i => i.tipo === 'insumo').reduce((acc, i) => acc + i.total, 0);
  const totalMaquinas = inversionesDelPeriodo.filter(i => i.tipo === 'maquina').reduce((acc, i) => acc + i.total, 0);

  const openCreateModal = () => { setEditingId(null); setForm(emptyForm()); setShowModal(true); };
  const openEditModal = (inv: Inversion) => {
    setEditingId(inv.id);
    setForm({
      elemento: inv.elemento,
      tipo: inv.tipo,
      proveedor: inv.proveedor || '',
      cantidad: inv.cantidad,
      costo: inv.costo,
      valorUnitario: inv.valorUnitario || 0,
      fecha: inv.fecha,
      observaciones: inv.observaciones || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!token) return;
    if (!form.elemento.trim() || form.cantidad <= 0 || form.costo < 0 || !form.fecha) {
      setError('Completá elemento, cantidad (mayor a 0), costo y fecha.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await actualizarInversion(token, editingId, form);
        setInversiones(prev => prev.map(i => i.id === editingId ? updated : i));
      } else {
        const created = await crearInversion(token, form);
        setInversiones(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la inversión.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await eliminarInversion(token, id);
      setInversiones(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la inversión.');
    } finally {
      setDeletingId(null);
    }
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
          <p className="text-slate-400 text-sm">Solo administradores pueden acceder a inversiones.</p>
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
                <Wallet className="w-8 h-8 text-cyan-400" />
                Inversiones
              </h1>
              <p className="text-slate-400 text-sm mt-1">Insumos y máquinas de impresión, medidos por período.</p>
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

        {/* Filtro de período */}
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 shrink-0">ver por:</span>
              <select
                value={granularidad}
                onChange={e => setGranularidad(e.target.value as Granularidad)}
                className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm cursor-pointer focus:outline-none"
              >
                {GRANULARIDADES.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            {granularidad !== 'total' && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={periodoEfectivo}
                  onChange={e => setPeriodoSeleccionado(e.target.value)}
                  className="py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm cursor-pointer focus:outline-none"
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

          <button
            onClick={openCreateModal}
            className="py-2.5 px-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Agregar inversión
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total invertido', value: formatCOP(totalInvertido), color: 'text-white', icon: Wallet },
            { label: 'Insumos', value: formatCOP(totalInsumos), color: 'text-cyan-400', icon: Package },
            { label: 'Máquinas', value: formatCOP(totalMaquinas), color: 'text-amber-400', icon: Cpu },
            { label: 'Registros', value: inversionesDelPeriodo.length, color: 'text-emerald-400', icon: Layers },
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

        {/* Listado */}
        {fetching ? (
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl py-20 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Cargando inversiones...</p>
          </div>
        ) : inversionesDelPeriodo.length === 0 ? (
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl py-20 text-center text-slate-500">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-slate-700" />
            <p className="text-lg font-medium">Sin inversiones en este período</p>
          </div>
        ) : (
          <>
            {/* Tabla (md y superior) */}
            <div className="hidden md:block backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                      <th className="py-4 px-6">Fecha</th>
                      <th className="py-4 px-6">Elemento</th>
                      <th className="py-4 px-6">Proveedor</th>
                      <th className="py-4 px-6">Tipo</th>
                      <th className="py-4 px-6 text-right">Cantidad</th>
                      <th className="py-4 px-6 text-right">Costo</th>
                      <th className="py-4 px-6 text-right">Valor unit.</th>
                      <th className="py-4 px-6 text-right">Total</th>
                      <th className="py-4 px-6">Observaciones</th>
                      <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inversionesDelPeriodo.map((inv, idx) => (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(idx, 10) * 0.03 }}
                        className="hover:bg-slate-800/10 transition-colors"
                      >
                        <td className="py-4 px-6 text-sm text-slate-300 font-mono whitespace-nowrap">{inv.fecha}</td>
                        <td className="py-4 px-6 text-sm font-semibold text-white">{inv.elemento}</td>
                        <td className="py-4 px-6 text-sm text-slate-300">{inv.proveedor || '---'}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${tipoBadgeClass(inv.tipo)}`}>
                            {inv.tipo}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-300 text-right">{inv.cantidad}</td>
                        <td className="py-4 px-6 text-sm text-slate-300 text-right whitespace-nowrap">{formatCOP(inv.costo)}</td>
                        <td className="py-4 px-6 text-sm text-slate-400 text-right whitespace-nowrap">{inv.valorUnitario ? formatCOP(inv.valorUnitario) : '---'}</td>
                        <td className="py-4 px-6 text-sm font-bold text-emerald-400 text-right whitespace-nowrap">{formatCOP(inv.total)}</td>
                        <td className="py-4 px-6 text-xs text-slate-400 max-w-[180px] truncate">{inv.observaciones || '---'}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button onClick={() => openEditModal(inv)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(inv.id)} disabled={deletingId === inv.id}
                              className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 cursor-pointer disabled:opacity-50 transition-colors">
                              {deletingId === inv.id
                                ? <div className="w-3.5 h-3.5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tarjetas (mobile) */}
            <div className="md:hidden space-y-3">
              {inversionesDelPeriodo.map((inv, idx) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx, 10) * 0.03 }}
                  className="backdrop-blur-md bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{inv.elemento}</p>
                      <span className="text-xs text-slate-400">{inv.fecha}{inv.proveedor ? ` · ${inv.proveedor}` : ''}</span>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${tipoBadgeClass(inv.tipo)}`}>
                      {inv.tipo}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                    <span>Cant: <span className="text-slate-200 font-semibold">{inv.cantidad}</span></span>
                    <span>Costo: <span className="text-slate-200 font-semibold">{formatCOP(inv.costo)}</span></span>
                    {inv.valorUnitario ? <span>V. unit: <span className="text-slate-200 font-semibold">{formatCOP(inv.valorUnitario)}</span></span> : null}
                  </div>
                  <span className="block text-sm font-bold text-emerald-400">Total: {formatCOP(inv.total)}</span>
                  {inv.observaciones && <p className="text-xs text-slate-400">{inv.observaciones}</p>}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button onClick={() => openEditModal(inv)}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => handleDelete(inv.id)} disabled={deletingId === inv.id}
                      className="py-1.5 px-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1">
                      {deletingId === inv.id ? '...' : (<><Trash2 className="w-3.5 h-3.5" /> Eliminar</>)}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">{editingId ? 'Editar inversión' : 'Agregar inversión'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">elemento</label>
                <input type="text" value={form.elemento} onChange={e => setForm(prev => ({ ...prev, elemento: e.target.value }))}
                  placeholder="Ej. Filamento PLA 1kg"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">tipo</label>
                  <select value={form.tipo} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value as TipoInversion }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50 cursor-pointer">
                    <option value="insumo">Insumo</option>
                    <option value="maquina">Máquina</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">proveedor</label>
                  <input type="text" value={form.proveedor} onChange={e => setForm(prev => ({ ...prev, proveedor: e.target.value }))}
                    placeholder="Ej. 3DFilaments SAS"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">cantidad</label>
                  <input type="number" min="0" step="any" value={form.cantidad || ''} onChange={e => setForm(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm font-semibold outline-none focus:border-cyan-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">costo (c/u)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">$</span>
                    <input type="number" min="0" value={form.costo || ''} onChange={e => setForm(prev => ({ ...prev, costo: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm font-semibold outline-none focus:border-cyan-500/50" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">valor unit.</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">$</span>
                    <input type="number" min="0" value={form.valorUnitario || ''} onChange={e => setForm(prev => ({ ...prev, valorUnitario: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm font-semibold outline-none focus:border-cyan-500/50" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Total (cantidad × costo)</span>
                <span className="text-lg font-extrabold text-emerald-400">{formatCOP((form.cantidad || 0) * (form.costo || 0))}</span>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50" />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">observaciones (opcional)</label>
                <textarea value={form.observaciones} onChange={e => setForm(prev => ({ ...prev, observaciones: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar
              </button>
              <button onClick={() => setShowModal(false)} disabled={saving}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
