'use client';

import Image from 'next/image';
import { Hash, Palette, Package, Camera, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERSONALIZACION_OPTIONS, EMPAQUE_OPTIONS, type ProductForm } from '../types';

const ANGLE_LABELS: Record<string, string> = { frontal: 'Frontal', lateral: 'Lateral', trasera: 'Trasera', diagonal: 'Diagonal' };

interface ProductoFormCardProps {
  producto: ProductForm;
  productosLength: number;
  onFieldChange: (field: keyof ProductForm, value: ProductForm[keyof ProductForm]) => void;
  onPersonalizacionChange: (value: string, checked: boolean) => void;
  onPersonalizacionComentarioChange: (key: string, value: string) => void;
  onImageChange: (angle: string, file: File | null) => void;
}

export default function ProductoFormCard({
  producto,
  productosLength,
  onFieldChange,
  onPersonalizacionChange,
  onPersonalizacionComentarioChange,
  onImageChange,
}: ProductoFormCardProps) {
  return (
    <motion.div
      key={producto.id}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative bg-slate-900/50 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-xl overflow-hidden"
    >
      {/* Barra de color superior */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-60"
        style={{
          background: `linear-gradient(to right, transparent, ${
            ['#06b6d4','#818cf8','#34d399','#f59e0b','#f43f5e'][productosLength % 5]
          }, transparent)`,
        }}
      />

      {/* Header de la tarjeta */}
      <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-extrabold text-slate-300">
            {productosLength + 1}
          </div>
          <div>
            <span className="text-sm font-bold text-white">
              {producto.nombre || `Producto #${productosLength + 1}`}
            </span>
            <p className="text-[11px] text-slate-500">
              {producto.unidades} unidad{producto.unidades !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-7 space-y-7">

        {/* Fila 1: Nombre + Unidades */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="md:col-span-3 space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Nombre de la Pieza o Diseño <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={producto.nombre}
              onChange={e => onFieldChange('nombre', e.target.value)}
              placeholder="Ej. Soporte para laptop, figura de colección..."
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Unidades <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="number"
                min="1"
                value={producto.unidades}
                onChange={e => onFieldChange('unidades', parseInt(e.target.value) || 1)}
                className="w-full pl-9 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all font-mono text-center"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Descripción de los productos
          </label>
          <textarea
            value={producto.descripcionLineal}
            onChange={e => onFieldChange('descripcionLineal', e.target.value)}
            rows={2}
            placeholder="Describe el uso, forma o detalle principal de esta pieza..."
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all resize-none"
          />
        </div>

        {/* Fila 4: Personalización */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-500" />
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Personalización del Acabado
            </label>
            <span className="text-[10px] text-slate-600 italic">(Selección múltiple)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PERSONALIZACION_OPTIONS.map(opt => {
              const isChecked = producto.personalizacion.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                    isChecked
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={e => onPersonalizacionChange(opt.value, e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'bg-cyan-500 border-cyan-500' : 'border-slate-700 bg-transparent'}`}>
                    {isChecked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <span className="text-sm">{opt.emoji}</span>
                    <span className="text-xs font-semibold ml-1.5">{opt.label}</span>
                  </div>
                </label>
              );
            })}
          </div>

          {producto.personalizacion.length > 0 && (
            <div className="space-y-3 pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Comentarios por personalización</span>
              <div className="grid gap-3">
                {producto.personalizacion.map(selected => {
                  if (selected === 'otra') {
                    return (
                      <motion.div
                        key={selected}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <input
                          type="text"
                          value={producto.personalizacionOtraText}
                          onChange={e => onFieldChange('personalizacionOtraText', e.target.value)}
                          placeholder="Describe cómo quieres la personalización adicional..."
                          className="w-full px-4 py-3 bg-slate-950/80 border border-cyan-500/30 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
                        />
                      </motion.div>
                    );
                  }

                  const option = PERSONALIZACION_OPTIONS.find(opt => opt.value === selected);
                  return (
                    <motion.div
                      key={selected}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <textarea
                        value={producto.personalizacionComentarios[selected] || ''}
                        onChange={e => onPersonalizacionComentarioChange(selected, e.target.value)}
                        rows={2}
                        placeholder={`Describe cómo quieres ${option?.label.toLowerCase()}...`}
                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all resize-none"
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input adicional para "Otra" */}
          <AnimatePresence>
            {producto.personalizacion.includes('otra') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="text"
                  value={producto.personalizacionOtraText}
                  onChange={e => onFieldChange('personalizacionOtraText', e.target.value)}
                  placeholder="Describe la personalización adicional que necesitas..."
                  className="w-full px-4 py-3 bg-slate-950/80 border border-cyan-500/30 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fila 5: Empaque + Foto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Empaque */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-500" />
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Empaque</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EMPAQUE_OPTIONS.map(opt => {
                const isSel = producto.empaque === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onFieldChange('empaque', opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSel
                        ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-xs font-bold">{opt.label}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {producto.empaque === 'otra' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    type="text"
                    value={producto.empaqueOtraText}
                    onChange={e => onFieldChange('empaqueOtraText', e.target.value)}
                    placeholder="Especifica el tipo de empaque..."
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-indigo-500/30 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-sm transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fotos de referencia */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-500" />
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fotos de Referencia</label>
              <span className="text-[10px] text-slate-600 italic">(Opcional)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['frontal', 'lateral', 'trasera', 'diagonal'].map(angle => {
                const preview = producto.imagePreviews[angle];
                return (
                  <div key={angle}>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 block">{ANGLE_LABELS[angle]}</span>
                    {!preview ? (
                      <label className="relative flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-cyan-500/40 rounded-lg p-3 bg-slate-950/30 transition-all cursor-pointer group min-h-[90px]">
                        <input type="file" accept="image/*" onChange={e => onImageChange(angle, e.target.files?.[0] ?? null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <Upload className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 mb-1.5 transition-colors" />
                        <span className="text-[9px] text-slate-500 group-hover:text-slate-300 transition-colors text-center">Subir</span>
                      </label>
                    ) : (
                      <div className="relative h-20 border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                        <Image src={preview} alt={ANGLE_LABELS[angle]} fill unoptimized sizes="150px" className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                        <button type="button" onClick={() => onImageChange(angle, null)} aria-label="Quitar imagen" className="absolute top-1 right-1 p-1 bg-slate-900/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-md transition-all cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1.5 text-[8px] text-slate-400 font-medium">{ANGLE_LABELS[angle]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
