'use client';

import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxProps {
  images: { url: string; label?: string }[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function ImageLightbox({ images, index, onClose, onNavigate }: ImageLightboxProps) {
  const goPrev = useCallback(() => onNavigate((index - 1 + images.length) % images.length), [index, images.length, onNavigate]);
  const goNext = useCallback(() => onNavigate((index + 1) % images.length), [index, images.length, onNavigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, goPrev, goNext]);

  const current = images[index];
  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-white cursor-pointer transition-colors z-10"
          aria-label="Cerrar galería"
        >
          <X className="w-5 h-5" />
        </button>

        {images.length > 1 && (
          <span className="absolute top-4 left-4 text-xs font-bold text-slate-300 bg-slate-900/80 border border-slate-700 rounded-full px-3 py-1.5">
            {index + 1} / {images.length}
          </span>
        )}

        {images.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 sm:left-6 p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-full text-white cursor-pointer transition-colors"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <motion.div
          key={current.url}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          className="max-w-4xl w-full flex flex-col items-center gap-3"
        >
          <img
            src={current.url}
            alt={current.label || `Foto ${index + 1}`}
            className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl border border-slate-800"
          />
          {current.label && (
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{current.label}</span>
          )}
        </motion.div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 sm:right-6 p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-full text-white cursor-pointer transition-colors"
            aria-label="Foto siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
