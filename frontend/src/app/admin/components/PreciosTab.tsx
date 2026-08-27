'use client';

import { Zap, Weight, Clock, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEditableSetting } from '@/hooks/useEditableSetting';
import SettingsEditModal from '@/components/ui/SettingsEditModal';
import { formatCOP } from './shared';

interface PreciosData {
  precioKwhHora: number;
  precioKwhMinuto: number;
  precioFilamentoKg: number;
  valorHoraTrabajo: number;
}

const DEFAULTS: PreciosData = {
  precioKwhHora: 900,
  precioKwhMinuto: 15,
  precioFilamentoKg: 85000,
  valorHoraTrabajo: 9000,
};

const SETTINGS_ID = 'precios';

export default function PreciosTab() {
  const { data, editing, form, setForm, startEdit, cancelEdit, saveEdit } =
    useEditableSetting<PreciosData>(SETTINGS_ID, DEFAULTS);

  return (
    <motion.div
      key="precios"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white mb-1">Precios base de fabricación</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Estos valores se usan como punto de partida para calcular el precio de las cotizaciones nuevas
            (energía y filamento). Cambiarlos acá no afecta cotizaciones ya guardadas.
          </p>
        </div>
        <button
          onClick={startEdit}
          className="py-2.5 px-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0"
        >
          <Pencil className="w-4 h-4" /> Editar precios
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Precio energía', unit: 'COP / Kw·h', extra: '', value: data.precioKwhHora, icon: Zap, color: 'text-yellow-400' },
          { label: 'Precio energía por minuto', unit: 'COP / Kw·min', extra: '', value: data.precioKwhMinuto, icon: Zap, color: 'text-yellow-400' },
          { label: 'Precio filamento', unit: 'COP / kg', extra: '', value: data.precioFilamentoKg, icon: Weight, color: 'text-blue-400' },
          { label: 'Valor hora de trabajo', unit: 'COP / hora', extra: '', value: data.valorHoraTrabajo, icon: Clock, color: 'text-emerald-400' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">{stat.label}</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{formatCOP(stat.value)}</p>
            <p className="text-[11px] text-slate-500 mt-1">{stat.unit}</p>
            {stat.extra && <p className="text-[10px] text-yellow-400/80 font-semibold mt-1">{stat.extra}</p>}
          </motion.div>
        ))}
      </div>

      {editing && (
        <SettingsEditModal title="Editar precios base" onSave={saveEdit} onCancel={cancelEdit}>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-400" /> precio energía (COP / Kw·h)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">$</span>
              <input
                type="number"
                value={form.precioKwhHora}
                onChange={e => setForm(prev => ({ ...prev, precioKwhHora: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-7 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm font-semibold outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-yellow-400" /> precio energía (COP / Kw·min)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">$</span>
              <input
                type="number"
                value={form.precioKwhMinuto}
                onChange={e => setForm(prev => ({ ...prev, precioKwhMinuto: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-7 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm font-semibold outline-none focus:border-cyan-500/50"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">Constante propia (no se calcula a partir del precio por hora).</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5"><Weight className="w-3.5 h-3.5 text-blue-400" /> precio filamento (COP / kg)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">$</span>
              <input
                type="number"
                value={form.precioFilamentoKg}
                onChange={e => setForm(prev => ({ ...prev, precioFilamentoKg: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-7 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm font-semibold outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> valor hora de trabajo (COP / hora)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs font-bold">$</span>
              <input
                type="number"
                value={form.valorHoraTrabajo}
                onChange={e => setForm(prev => ({ ...prev, valorHoraTrabajo: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-7 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm font-semibold outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </SettingsEditModal>
      )}
    </motion.div>
  );
}
