'use client';

import type { Dispatch, SetStateAction } from 'react';
import { CheckCircle2, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Colaborador } from '@/types/reportes';
import { formatCOP } from './shared';

interface TrabajoAdicional {
  tempId: string;
  descripcion: string;
  valor: number;
  colaboradorUid: string;
}

interface AssignColaboradorDialogProps {
  selectedQuote: any;
  assignColaboradores: Colaborador[];
  assignMode: 'all' | 'perItem';
  setAssignMode: Dispatch<SetStateAction<'all' | 'perItem'>>;
  assignAllUid: string;
  setAssignAllUid: (v: string) => void;
  perItemAssignments: Record<number, string>;
  setPerItemAssignments: Dispatch<SetStateAction<Record<number, string>>>;
  perItemTrabajos: Record<number, TrabajoAdicional[]>;
  setPerItemTrabajos: Dispatch<SetStateAction<Record<number, TrabajoAdicional[]>>>;
  assignSaving: boolean;
  handleConfirmAssign: () => void;
  setShowAssignDialog: Dispatch<SetStateAction<boolean>>;
  calcProduct: (idx: number, unidades: number) => any;
}

export default function AssignColaboradorDialog({
  selectedQuote,
  assignColaboradores,
  assignMode,
  setAssignMode,
  assignAllUid,
  setAssignAllUid,
  perItemAssignments,
  setPerItemAssignments,
  perItemTrabajos,
  setPerItemTrabajos,
  assignSaving,
  handleConfirmAssign,
  setShowAssignDialog,
  calcProduct,
}: AssignColaboradorDialogProps) {
  return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowAssignDialog(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Asignar Colaborador(es)</h2>
                <button onClick={() => setShowAssignDialog(false)} aria-label="Cerrar diálogo" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <div className="px-6 py-5 space-y-5">
                <p className="text-xs text-slate-400">Asigna quién realizó el trabajo para que aparezca en los reportes mensuales. Los productos sin colaborador no se sumarán a ningún reporte.</p>

                <div className="flex gap-3">
                  <button onClick={() => setAssignMode('perItem')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${assignMode === 'perItem' ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                    Asignar por producto
                  </button>
                  <button onClick={() => setAssignMode('all')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${assignMode === 'all' ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                    Asignar a toda la compra
                  </button>
                </div>

                {assignMode === 'all' && (
                  <div>
                    <label className="block text-xs text-slate-400 font-bold mb-1.5">Colaborador para todos los productos</label>
                    <select value={assignAllUid} onChange={e => setAssignAllUid(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50 cursor-pointer">
                      <option value="">Seleccionar colaborador</option>
                      {assignColaboradores.map(col => (<option key={col.uid} value={col.uid}>{col.nombre}</option>))}
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedQuote?.productos.map((p: any, idx: number) => {
                    const nombre = p.descripcionLineal || p.nombre || `Producto #${idx + 1}`;
                    return (
                      <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{nombre}</span>
                          <span className="text-xs text-slate-400">{p.unidades || 1} uds · {formatCOP(calcProduct(idx, p.unidades).precioTotalProducto)}</span>
                        </div>
                        {assignMode === 'perItem' && (
                          <>
                            <select value={perItemAssignments[idx] || ''} onChange={e => setPerItemAssignments(prev => ({ ...prev, [idx]: e.target.value }))}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50 cursor-pointer mb-2">
                              <option value="">Sin Asignar (aparecerá como ingreso sin colaborador)</option>
                              {assignColaboradores.map(col => (<option key={col.uid} value={col.uid}>{col.nombre}</option>))}
                            </select>

                            <div className="border-t border-slate-800 pt-2 mt-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Trabajos adicionales</span>
                                <button onClick={() => setPerItemTrabajos(prev => ({
                                  ...prev,
                                  [idx]: [...(prev[idx] || []), { tempId: Math.random().toString(36).slice(2), descripcion: '', valor: 0, colaboradorUid: '' }]
                                }))}
                                  className="py-0.5 px-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-bold rounded-lg cursor-pointer flex items-center gap-0.5 transition-colors">
                                  <Plus className="w-2.5 h-2.5" /> Agregar
                                </button>
                              </div>
                              {(perItemTrabajos[idx] || []).map((t, tidx) => (
                                <div key={t.tempId} className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 mb-1.5">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-bold text-cyan-400 uppercase">Trabajo #{tidx + 1}</span>
                                    <button onClick={() => setPerItemTrabajos(prev => ({
                                      ...prev, [idx]: (prev[idx] || []).filter(x => x.tempId !== t.tempId)
                                    }))}
                                      aria-label="Quitar trabajo"
                                      className="p-0.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <input type="text" value={t.descripcion} onChange={e => setPerItemTrabajos(prev => ({
                                      ...prev, [idx]: (prev[idx] || []).map(x => x.tempId === t.tempId ? { ...x, descripcion: e.target.value } : x)
                                    }))} placeholder="Ej: Pintura" className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-[10px] outline-none focus:border-cyan-500/50" />
                                    <input type="number" min="0" value={t.valor || ''} onChange={e => setPerItemTrabajos(prev => ({
                                      ...prev, [idx]: (prev[idx] || []).map(x => x.tempId === t.tempId ? { ...x, valor: parseFloat(e.target.value) || 0 } : x)
                                    }))} placeholder="Valor $" className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-[10px] outline-none focus:border-cyan-500/50" />
                                    <select value={t.colaboradorUid} onChange={e => setPerItemTrabajos(prev => ({
                                      ...prev, [idx]: (prev[idx] || []).map(x => x.tempId === t.tempId ? { ...x, colaboradorUid: e.target.value } : x)
                                    }))} className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-[10px] outline-none focus:border-cyan-500/50 cursor-pointer">
                                      <option value="">Colaborador</option>
                                      {assignColaboradores.map(col => (<option key={col.uid} value={col.uid}>{col.nombre}</option>))}
                                    </select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-800">
                  <button onClick={handleConfirmAssign} disabled={assignSaving}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl text-sm cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {assignSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {assignSaving ? 'Guardando...' : 'Aceptar y asignar'}
                  </button>
                  <button onClick={() => setShowAssignDialog(false)} className="py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium rounded-xl text-sm cursor-pointer transition-colors">Cancelar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
  );
}
