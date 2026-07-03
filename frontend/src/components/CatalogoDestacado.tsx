'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/types/productos';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function CatalogoDestacado() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/products?destacado=true`)
      .then(res => res.json())
      .then(data => setProductos(data || []))
      .catch(() => {});
  }, []);

  if (productos.length === 0) return null;

  const handlePrev = () => setCurrentIndex(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIndex(prev => Math.min(productos.length - 1, prev + 1));

  return (
    <section className="py-24 bg-slate-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Catálogo Destacado</h2>
            <p className="text-slate-400">Descubre nuestros modelos más populares listos para imprimir.</p>
          </div>
          <Link href="/catalogo" className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 flex-shrink-0">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative px-0 sm:px-12">
          <div className="overflow-hidden rounded-3xl">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {productos.map((prod) => (
                <div key={prod.id} className="min-w-full px-2 sm:px-4">
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="aspect-square bg-slate-800/80 relative flex items-center justify-center overflow-hidden">
                        {prod.imagenUrl ? (
                          <img src={prod.imagenUrl} alt={prod.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Box className="w-24 h-24 text-slate-600" />
                        )}
                      </div>
                      <div className="p-6 sm:p-8 flex flex-col justify-center">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 font-outfit">{prod.nombre}</h3>
                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">{prod.descripcion}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-xs bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 px-3 py-1 rounded-full font-medium">{prod.material}</span>
                          <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full capitalize">{prod.categoria}</span>
                        </div>
                        <Link
                          href="/cotizar"
                          className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                        >
                          Solicitar Cotización <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {productos.length > 1 && (
            <>
              <button onClick={handlePrev} disabled={currentIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm transition-all z-10 ml-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={handleNext} disabled={currentIndex >= productos.length - 1}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm transition-all z-10 mr-1">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          {productos.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${idx === currentIndex ? 'bg-cyan-400 w-6' : 'bg-slate-700 hover:bg-slate-500'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}