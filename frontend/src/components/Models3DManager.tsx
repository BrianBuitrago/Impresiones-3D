'use client';

import { useRef, useState } from 'react';
import { Settings, Trash2, X } from 'lucide-react';
import { useModels3D } from '@/hooks/useModels3D';

// Panel de administración (solo visible para administrador) para subir y
// eliminar los archivos .glb que rotan al azar en el modelo 3D del inicio.
export default function Models3DManager() {
  const { modelUrls, isAdmin, uploading, error, uploadModel, deleteModel } = useModels3D();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Gestionar modelos 3D"
        title="Gestionar modelos 3D"
        className="absolute top-4 right-4 z-20 p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Modelos 3D del inicio</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              Subí archivos .glb o .stl para que roten al azar en el modelo 3D de la página de inicio.
              Si no hay ninguno subido, se muestra la figura de respaldo.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full mb-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              {uploading ? 'Subiendo...' : '+ Subir modelo .glb o .stl'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.stl"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadModel(file);
                e.target.value = '';
              }}
            />
            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

            <div className="space-y-2 mt-4">
              {modelUrls.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Todavía no subiste ningún modelo.</p>
              )}
              {modelUrls.map((url) => (
                <div key={url} className="flex items-center justify-between gap-2 bg-slate-800/50 border border-slate-800 rounded-xl px-3 py-2">
                  <span className="text-xs text-slate-300 truncate">{url.split('/').pop()}</span>
                  <button
                    type="button"
                    onClick={() => deleteModel(url)}
                    aria-label="Eliminar modelo"
                    title="Eliminar modelo"
                    className="text-red-400 hover:text-red-300 flex-shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
