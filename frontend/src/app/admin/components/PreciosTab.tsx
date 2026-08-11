'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Zap, Weight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface PreciosData {
  precioKwhHora: number;
  precioFilamentoKg: number;
}

const DEFAULTS: PreciosData = {
  precioKwhHora: 900,
  precioFilamentoKg: 85000,
};

export default function PreciosTab() {
  const [form, setForm] = useState<PreciosData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db!, 'settings', 'precios'));
        if (snap.exists()) {
          const data = snap.data() as Partial<PreciosData>;
          setForm({
            precioKwhHora: typeof data.precioKwhHora === 'number' ? data.precioKwhHora : DEFAULTS.precioKwhHora,
            precioFilamentoKg: typeof data.precioFilamentoKg === 'number' ? data.precioFilamentoKg : DEFAULTS.precioFilamentoKg,
          });
        }
      } catch {
        setError('No se pudieron cargar los precios guardados, se muestran los valores por defecto.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await setDoc(doc(db!, 'settings', 'precios'), form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('No se pudo guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      key="precios"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl max-w-xl">
        <h2 className="text-sm font-bold text-white mb-1">Precios base de fabricación</h2>
        <p className="text-xs text-slate-400 mb-6">
          Estos valores se usan como punto de partida para calcular el precio de las cotizaciones nuevas
          (energía y filamento). Cambiarlos acá no afecta cotizaciones ya guardadas.
        </p>

        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
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
                  className="w-full pl-7 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-cyan-500/40"
                />
              </div>
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
                  className="w-full pl-7 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-cyan-500/40"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : null}
              {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
