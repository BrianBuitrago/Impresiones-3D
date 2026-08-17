'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  FileText, Mail, Phone, IdCard, Calendar, Eye, ImageIcon, User, LogIn,
} from 'lucide-react';
import { formatCOP, estadoBadgeClass } from '@/app/admin/components/shared';
import { fetchMyQuotes } from '@/services/quoteService';
import ImageLightbox from '@/components/ui/ImageLightbox';

const subEstadoBadgeClass = (subEstado: string) => {
  switch (subEstado) {
    case 'entregado':            return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
    case 'pendiente de entrega':  return 'bg-cyan-500/10   border-cyan-500/25   text-cyan-400';
    case 'stand by':              return 'bg-amber-500/10  border-amber-500/25  text-amber-400';
    default:                      return 'bg-slate-800     border-slate-700     text-slate-400';
  }
};

const getProductImages = (producto: any) =>
  (['imagenFrontal', 'imagenLateral', 'imagenTrasera', 'imagenDiagonal'] as const)
    .map((f, i) => ({ url: producto[f], label: ['Frontal', 'Lateral', 'Trasera', 'Diagonal'][i] }))
    .filter(img => img.url);

export default function MisCotizacionesPage() {
  const { user, profile, token, loading } = useAuth();

  const [quotes, setQuotes] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: { url: string; label?: string }[]; index: number } | null>(null);

  useEffect(() => {
    if (!token) { setFetching(false); return; }
    (async () => {
      setFetching(true);
      setError(null);
      try {
        setQuotes(await fetchMyQuotes(token));
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar tus cotizaciones.');
      } finally {
        setFetching(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full text-center p-8 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-2xl">
          <div className="inline-flex p-4 bg-cyan-500/10 rounded-2xl text-cyan-400 mb-5"><User className="w-10 h-10" /></div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Iniciá sesión</h2>
          <p className="text-slate-400 text-sm mb-6">Para ver tus cotizaciones necesitás tener una cuenta e iniciar sesión.</p>
          <Link href="/login"
            className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Ingresar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-outfit">
            <FileText className="w-8 h-8 text-cyan-400" />
            Mis Cotizaciones
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Hola {profile?.nombre || user.displayName || ''}, acá podés ver el estado y el detalle de tus cotizaciones.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">{error}</div>
        )}

        {fetching ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl py-20 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Cargando tus cotizaciones...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-slate-900/10 border border-slate-800 border-dashed rounded-3xl p-20 text-center text-slate-500">
            <FileText className="w-14 h-14 mx-auto mb-4 text-slate-800" />
            <p className="text-base font-bold text-slate-400">todavía no tenés cotizaciones</p>
            <p className="text-xs text-slate-600 mt-1">
              Las cotizaciones que solicités con esta cuenta van a aparecer acá.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {quotes.map(q => (
              <div key={q.id} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-1">{q.id}</span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {q.Fecha || q.creadoEn || 'sin fecha'}</span>
                      {q.cliente?.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {q.cliente.email}</span>}
                      {q.cliente?.telefono && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {q.cliente.telefono}</span>}
                      {q.cliente?.cedula && <span className="flex items-center gap-1"><IdCard className="w-3.5 h-3.5" /> {q.cliente.cedula}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${estadoBadgeClass(q.estado)}`}>
                      {q.estado}
                    </span>
                    {q.subEstado && (
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${subEstadoBadgeClass(q.subEstado)}`}>
                        {q.subEstado}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {(q.productos || []).map((p: any, idx: number) => {
                    const imgs = getProductImages(p);
                    return (
                      <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
                        {imgs.length > 0 ? (
                          <div className="flex -space-x-2 shrink-0">
                            {imgs.slice(0, 4).map((img, i) => (
                              <button key={img.url} type="button" onClick={() => setLightbox({ images: imgs, index: i })}
                                className="w-14 h-14 rounded-lg overflow-hidden border-2 border-slate-900 bg-slate-950 hover:border-cyan-500/60 hover:z-10 relative transition-all cursor-pointer">
                                <Image src={img.url} alt={img.label} fill sizes="56px" className="object-cover" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-5 h-5 text-slate-700" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{p.nombre}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {p.tamanoHorizontal} × {p.tamanoVertical} cm · {p.unidades} unidad{p.unidades !== 1 ? 'es' : ''}
                              {p.personalizacion?.length > 0 ? ` · ${p.personalizacion.join(', ')}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-500 uppercase block">precio unitario</span>
                            <span className="text-sm font-bold text-slate-200">{formatCOP(p.precioUnitario || p.Precio_Unitario || 0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex gap-6 text-xs text-slate-400">
                    <span>Subtotal: <span className="font-bold text-slate-200">{formatCOP(q.subtotalFabricacionTotal || q.Subtotal_Fabricacion_Total || 0)}</span></span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">total</span>
                    <span className="text-xl font-extrabold text-emerald-400">{formatCOP(q.precioTotalCotizacion || q.precioTotal || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={i => setLightbox(prev => (prev ? { ...prev, index: i } : prev))}
        />
      )}
    </div>
  );
}
