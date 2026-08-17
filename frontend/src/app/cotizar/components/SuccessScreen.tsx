'use client';

import Link from 'next/link';
import { CheckCircle2, Plus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SuccessScreenProps {
  quoteId: string;
  onNuevaCotizacion: () => void;
}

export default function SuccessScreen({ quoteId, onNuevaCotizacion }: SuccessScreenProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_65%)] -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="max-w-xl w-full bg-slate-900/50 border border-slate-800/80 rounded-3xl p-10 backdrop-blur-xl shadow-2xl text-center relative"
      >
        <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent rounded-full" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-full flex items-center justify-center mb-6 border border-cyan-500/20"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        <h1 className="text-3xl font-extrabold text-white mb-3 font-outfit">¡Cotización Enviada!</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Hemos registrado tu solicitud. Nuestro equipo revisará los detalles y te
          notificará por correo con los costos de fabricación detallados.
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-8 text-left">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest mb-2">Número de Referencia</span>
          <span className="text-lg font-mono text-cyan-400 font-bold select-all break-all">{quoteId}</span>
          <p className="text-xs text-slate-500 mt-2">Guarda este número para hacer seguimiento de tu cotización.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onNuevaCotizacion}
            className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nueva Cotización
          </button>
          <Link
            href="/"
            className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 text-center transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Ver Catálogo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
