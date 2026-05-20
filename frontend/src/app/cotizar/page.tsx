'use client';

import React from 'react';
import { Upload, Send } from 'lucide-react';

export default function Cotizar() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
        <h1 className="text-3xl font-bold font-outfit text-white mb-2 text-center">Cotizar Diseño 3D</h1>
        <p className="text-slate-400 text-center mb-8">Sube tu archivo STL/OBJ o descríbenos tu idea para darte un presupuesto a medida.</p>
        
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Completo</label>
              <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="Tu nombre" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Correo Electrónico</label>
              <input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="tu@correo.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Material Recomendado</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors">
                <option value="pla">PLA+ (Resistente y económico)</option>
                <option value="resin">Resina (Alta precisión / Detalles)</option>
                <option value="petg">PETG (Funcional / Exterior)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Resolución de Capa</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors">
                <option value="0.2">0.20mm (Estándar)</option>
                <option value="0.12">0.12mm (Detallado)</option>
                <option value="0.05">0.05mm (Ultra detalle - Resina)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Subir Archivo 3D (STL, OBJ, STEP, 3MF)</label>
            <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40">
              <Upload className="w-10 h-10 text-cyan-400 mb-3" />
              <p className="text-sm text-slate-300 font-medium">Arrastra tu archivo aquí o haz clic para buscar</p>
              <p className="text-xs text-slate-500 mt-1">Máximo 50MB</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descripción del Proyecto / Instrucciones Especiales</label>
            <textarea rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors" placeholder="Describe el tamaño deseado, color, uso de la pieza..." />
          </div>

          <button type="button" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
            Enviar Solicitud <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
