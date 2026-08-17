'use client';

import Image from 'next/image';
import { Trash2, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { MAX_PRODUCTOS, type ProductForm } from '../types';

interface ProductosTableProps {
  productos: ProductForm[];
  onRemove: (id: string) => void;
}

export default function ProductosTable({ productos, onRemove }: ProductosTableProps) {
  if (productos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Productos agregados</h3>
          <p className="text-xs text-slate-500">{productos.length} de {MAX_PRODUCTOS} productos en esta cotización.</p>
        </div>
        <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1">
          Listos para enviar
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-950/60 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3 font-bold">Producto</th>
              <th className="px-5 py-3 font-bold">Tamaño</th>
              <th className="px-5 py-3 font-bold">Unidades</th>
              <th className="px-5 py-3 font-bold">Personalización</th>
              <th className="px-5 py-3 font-bold">Empaque</th>
              <th className="px-5 py-3 text-right font-bold">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {productos.map((p, index) => (
              <tr key={p.id} className="text-xs text-slate-300">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {p.imagePreviews.frontal || Object.values(p.imagePreviews).find(v => v) ? (
                      <Image src={p.imagePreviews.frontal || Object.values(p.imagePreviews).find(v => v) || ''} alt="mini" unoptimized width={40} height={40} className="w-10 h-10 object-cover rounded-lg border border-slate-800 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-700 shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="block font-semibold text-white truncate max-w-[150px]">{p.nombre}</span>
                      <span className="text-[10px] text-slate-500">Producto #{index + 1}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 font-mono">{p.tamanoHorizontal} × {p.tamanoVertical} cm</td>
                <td className="px-5 py-3 font-bold text-cyan-300">{p.unidades}</td>
                <td className="px-5 py-3">
                  {p.personalizacion.length > 0
                    ? p.personalizacion.map(i => i === 'otra' ? p.personalizacionOtraText : i).join(', ')
                    : 'Sin personalización'}
                </td>
                <td className="px-5 py-3 capitalize">
                  {p.empaque === 'otra' ? p.empaqueOtraText : p.empaque}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(p.id)}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
