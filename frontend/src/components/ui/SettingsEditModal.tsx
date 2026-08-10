'use client';

import { Check, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface SettingsEditModalProps {
  title: string;
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
}

export default function SettingsEditModal({
  title,
  onSave,
  onCancel,
  children,
  maxWidthClassName = 'max-w-lg',
}: SettingsEditModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full ${maxWidthClassName} max-h-[90vh] overflow-y-auto`}>
        <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
        <div className="space-y-4">{children}</div>
        <div className="flex gap-3 mt-6">
          <button onClick={onSave} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" /> Guardar
          </button>
          <button onClick={onCancel} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5">
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
