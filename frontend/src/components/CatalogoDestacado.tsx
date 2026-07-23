'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Box, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/types/productos';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function CatalogoDestacado() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    fetch(`${API_BASE}/products?destacado=true`)
      .then(res => res.json())
      .then(data => setProductos(data || []))
      .catch(() => {});
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % productos.length);
  }, [productos.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + productos.length) % productos.length);
  }, [productos.length]);

  useEffect(() => {
    if (productos.length <= 1 || isPaused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(next, 4000);
    return () => clearInterval(intervalRef.current);
  }, [productos.length, isPaused, next]);

  if (productos.length === 0) return null;

  const getIndex = (offset: number) => (current + offset + productos.length) % productos.length;

  return (
    <section className="py-20 sm:py-28 bg-slate-950 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(6,182,212,0.08),transparent)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-end mb-10 sm:mb-16">
          <div>
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-2 block">Colección</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-outfit">Catálogo Destacado</h2>
            <p className="text-slate-400 text-sm sm:text-base">Modelos seleccionados con la mejor calidad de impresión.</p>
          </div>
          <Link href="/catalogo" className="hidden sm:flex text-cyan-400 hover:text-cyan-300 font-medium items-center gap-1.5 text-sm transition-colors flex-shrink-0">
            Explorar todo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div
          className="relative -mx-2 sm:-mx-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden py-4">
            <div className="flex items-stretch transition-transform duration-700 ease-out"
              style={{ transform: `translateX(calc(-${current * (100 / 3)}% + ${100 / 6}%))` }}
            >
              {productos.map((prod, idx) => {
                const offset = idx - current;
                const isCenter = offset === 0;
                const isSide = Math.abs(offset) === 1 || (productos.length > 2 && Math.abs(offset) === productos.length - 1);
                const scale = isCenter ? 1 : 0.85;
                const opacity = isCenter ? 1 : 0.4;

                return (
                  <div key={prod.id}
                    className="flex-shrink-0 px-2 sm:px-3 transition-all duration-700"
                    style={{ width: `${100 / 3}%`, scale, opacity }}
                  >
                    <div className={`bg-slate-900/70 backdrop-blur-sm border rounded-2xl overflow-hidden shadow-xl h-full transition-all duration-700 ${isCenter ? 'border-cyan-500/30 shadow-cyan-500/10' : 'border-slate-800/50'}`}>
                      <div className="aspect-[4/3] bg-slate-800/60 relative overflow-hidden">
                        {prod.imagenFrontal ? (
                          <img src={prod.imagenFrontal} alt={prod.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Box className="w-16 h-16 text-slate-700" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="text-xs bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded-full font-medium backdrop-blur-sm">
                            {prod.material}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5">
                        <h3 className="font-bold text-white text-base sm:text-lg mb-1 truncate">{prod.nombre}</h3>
                        <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">{prod.descripcion}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {productos.length > 1 && (
            <>
              <button onClick={prev}
                className="absolute left-1 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/50 rounded-full text-slate-300 hover:text-white cursor-pointer backdrop-blur-md transition-all z-20 shadow-lg">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={next}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/50 rounded-full text-slate-300 hover:text-white cursor-pointer backdrop-blur-md transition-all z-20 shadow-lg">
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2.5 mt-8">
          {productos.map((_, idx) => (
            <button key={idx} onClick={() => setCurrent(idx)}
              className={`rounded-full transition-all duration-500 cursor-pointer ${idx === current ? 'bg-cyan-400 w-7 h-2' : 'bg-slate-700 hover:bg-slate-500 w-2 h-2'}`} />
          ))}
        </div>

        <Link href="/catalogo" className="sm:hidden flex justify-center mt-6 text-cyan-400 hover:text-cyan-300 font-medium items-center gap-1.5 text-sm transition-colors">
          Explorar todo <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}