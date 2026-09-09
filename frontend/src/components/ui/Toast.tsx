'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastData {
  message: string;
  variant?: ToastVariant;
}

interface ToastProps extends ToastData {
  onDismiss: () => void;
  durationMs?: number;
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  error: 'bg-red-500/10 border-red-500/25 text-red-400',
  info: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400',
};

const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

/**
 * Notificación flotante no bloqueante — reemplaza al alert() nativo (que
 * congela la pestaña hasta que el usuario le da OK) para feedback breve
 * tipo "listo"/"no se pudo". Se auto-cierra sola; el usuario también puede
 * cerrarla a mano. Para errores persistentes que necesitan quedar visibles
 * hasta que el usuario actúe, seguí usando el banner de error de siempre
 * (con su propio setError), esto es solo para avisos de un momento.
 */
export default function Toast({ message, variant = 'info', onDismiss, durationMs = 5000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [onDismiss, durationMs]);

  const Icon = VARIANT_ICONS[variant];

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto z-[200] flex justify-end pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className={`pointer-events-auto w-full sm:max-w-sm p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 ${VARIANT_CLASSES[variant]}`}
        role="status"
      >
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm flex-1">{message}</p>
        <button
          onClick={onDismiss}
          aria-label="Cerrar notificación"
          className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}

/** Wrapper con AnimatePresence listo para usar: <ToastContainer toast={toast} onDismiss={...} /> */
export function ToastContainer({ toast, onDismiss }: { toast: ToastData | null; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {toast && <Toast key={toast.message} message={toast.message} variant={toast.variant} onDismiss={onDismiss} />}
    </AnimatePresence>
  );
}
