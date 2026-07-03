'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Box, ChevronLeft, ChevronRight, Pencil, X, Check,
  ShieldAlert, RefreshCw, Upload,
} from 'lucide-react';
import { fetchProductos, actualizarProducto, crearProducto, eliminarProducto } from '@/services/productService';
import type { Product, ProductFormData } from '@/types/productos';

const DEFAULT_PRODUCTOS: Product[] = [
  { id: 'default-1', nombre: 'Figura Articulada Dragón', descripcion: 'Figura de dragón con articulaciones móviles, ideal para coleccionistas.', material: 'Resina ABS-like', imagenUrl: '', categoria: 'figuras', destacado: true, orden: 1, activo: true },
  { id: 'default-2', nombre: 'Soporte para Laptop', descripcion: 'Soporte ergonómico plegable para laptop de hasta 15 pulgadas.', material: 'PLA+', imagenUrl: '', categoria: 'tecnologia', destacado: true, orden: 2, activo: true },
  { id: 'default-3', nombre: 'Maceta Geométrica', descripcion: 'Maceta con diseño geométrico moderno, incluye drenaje.', material: 'PETG', imagenUrl: '', categoria: 'hogar', destacado: true, orden: 3, activo: true },
  { id: 'default-4', nombre: 'Organizador de Escritorio', descripcion: 'Organizador multinivel para lápices, clips y notas.', material: 'PLA+', imagenUrl: '', categoria: 'organizacion', destacado: true, orden: 4, activo: true },
  { id: 'default-5', nombre: 'Base para Celular', descripcion: 'Base ajustable para celular con carga inalámbrica compatible.', material: 'PLA+', imagenUrl: '', categoria: 'tecnologia', destacado: true, orden: 5, activo: true },
  { id: 'default-6', nombre: 'Jarrón Decorativo', descripcion: 'Jarrón con textura espiral, ideal para flores secas.', material: 'PLA+', imagenUrl: '', categoria: 'hogar', destacado: true, orden: 6, activo: true },
  { id: 'default-7', nombre: 'Soporte para Audífonos', descripcion: 'Soporte de escritorio para audífonos over-ear.', material: 'PLA+', imagenUrl: '', categoria: 'tecnologia', destacado: true, orden: 7, activo: true },
  { id: 'default-8', nombre: 'Repisa Flotante', descripcion: 'Repisa decorativa con soporte oculto, soporta hasta 3kg.', material: 'PETG', imagenUrl: '', categoria: 'hogar', destacado: true, orden: 8, activo: true },
  { id: 'default-9', nombre: 'Caja para Joyas', descripcion: 'Caja con compartimentos para anillos, collares y aretes.', material: 'PLA', imagenUrl: '', categoria: 'cajas', destacado: false, orden: 9, activo: true },
  { id: 'default-10', nombre: 'Llavero Personalizado', descripcion: 'Llavero con diseño personalizable, resistente y ligero.', material: 'PLA', imagenUrl: '', categoria: 'accesorios', destacado: false, orden: 10, activo: true },
];

const uploadToCloudinary = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );
  const data = await res.json();
  return data.secure_url;
};

export default function Catalogo() {
  const { user, profile, token } = useAuth();
  const router = useRouter();
  const isAdmin = profile?.rol === 'administrador';

  const [productos, setProductos] = useState<Product[]>(DEFAULT_PRODUCTOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductFormData | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  const loadProductos = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return; }
    try {
      const prods = await fetchProductos();
      if (prods.length > 0) setProductos(prods);
    } catch {
      // Fallback to defaults
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) setLoading(false);
    else loadProductos();
  }, [isAdmin, loadProductos]);

  const handlePrev = () => setCurrentIndex(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIndex(prev => Math.min(productos.length - 1, prev + 1));

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditForm({
      nombre: p.nombre, descripcion: p.descripcion, material: p.material,
      imagenUrl: p.imagenUrl, categoria: p.categoria,
      destacado: p.destacado, orden: p.orden, activo: p.activo,
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;
    try {
      if (editingId.startsWith('default-')) {
        const newId = await crearProducto(editForm, token!);
        setProductos(prev => prev.map(p => p.id === editingId ? { ...p, id: newId, ...editForm } : p));
      } else {
        await actualizarProducto(editingId, editForm, token!);
        setProductos(prev => prev.map(p => p.id === editingId ? { ...p, ...editForm } : p));
      }
      cancelEdit();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    if (id.startsWith('default-')) {
      setProductos(prev => prev.filter(p => p.id !== id));
      if (currentIndex >= productos.length - 1) setCurrentIndex(prev => Math.max(0, prev - 1));
      return;
    }
    try {
      await eliminarProducto(id, token!);
      setProductos(prev => prev.filter(p => p.id !== id));
      if (currentIndex >= productos.length - 1) setCurrentIndex(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editForm) return;
    setUploadingImg(true);
    try {
      const url = await uploadToCloudinary(file);
      setEditForm(prev => prev ? { ...prev, imagenUrl: url } : prev);
    } catch {
      setError('Error al subir imagen');
    } finally {
      setUploadingImg(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.05),transparent)] -z-10" />
      <div className="max-w-7xl mx-auto relative">

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold font-outfit text-white">Catálogo</h1>
            <p className="text-slate-400 mt-1 max-w-xl">Explora nuestra galería de modelos listos para imprimir.</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => { setEditMode(!editMode); cancelEdit(); }}
                className={`py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${editMode ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                <Pencil className="w-3.5 h-3.5" /> {editMode ? 'Ver Catálogo' : 'Modificar Catálogo'}
              </button>
            )}
            <button onClick={loadProductos} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-colors" title="Recargar">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {productos.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Box className="w-16 h-16 mx-auto mb-4 text-slate-700" />
            <p className="text-lg font-medium">Catálogo vacío</p>
          </div>
        ) : (
          <>
            <div className="relative px-0 sm:px-12">
              <div className="overflow-hidden rounded-3xl">
                <div className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
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
                            {editMode && (
                              <div className="absolute top-3 right-3 z-10">
                                <button onClick={() => startEdit(prod)}
                                  className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-cyan-400 hover:text-white cursor-pointer backdrop-blur-sm transition-colors">
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="p-6 sm:p-8 flex flex-col justify-center">
                            {editingId === prod.id && editForm ? (
                              <div className="space-y-3">
                                <input type="text" value={editForm.nombre} onChange={e => setEditForm(prev => prev ? { ...prev, nombre: e.target.value } : prev)}
                                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-lg font-bold outline-none focus:border-cyan-500/50" />
                                <textarea value={editForm.descripcion} onChange={e => setEditForm(prev => prev ? { ...prev, descripcion: e.target.value } : prev)}
                                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 text-sm outline-none focus:border-cyan-500/50 resize-none" rows={3} />
                                <input type="text" value={editForm.material} onChange={e => setEditForm(prev => prev ? { ...prev, material: e.target.value } : prev)}
                                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50" placeholder="Material" />
                                <div className="flex gap-2">
                                  <label className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-400 text-sm cursor-pointer hover:border-cyan-500/50 transition-colors">
                                    <Upload className="w-4 h-4" />
                                    {uploadingImg ? 'Subiendo...' : 'Cambiar Imagen'}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                  </label>
                                  {editForm.imagenUrl && (
                                    <input type="text" value={editForm.imagenUrl} onChange={e => setEditForm(prev => prev ? { ...prev, imagenUrl: e.target.value } : prev)}
                                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-[10px] outline-none focus:border-cyan-500/50" placeholder="URL de imagen" />
                                  )}
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <button onClick={saveEdit} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Guardar
                                  </button>
                                  <button onClick={cancelEdit} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-center gap-1">
                                    <X className="w-3.5 h-3.5" /> Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 font-outfit">{prod.nombre}</h3>
                                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">{prod.descripcion}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  <span className="text-xs bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 px-3 py-1 rounded-full font-medium">{prod.material}</span>
                                  <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full capitalize">{prod.categoria}</span>
                                </div>
                                <button onClick={() => router.push(`/cotizar?producto=${prod.id}`)}
                                  className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                                  Solicitar Cotización
                                </button>
                                {editMode && (
                                  <button onClick={() => handleDelete(prod.id)}
                                    className="mt-2 py-2 px-4 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 rounded-xl text-xs cursor-pointer transition-colors self-start">
                                    Eliminar producto
                                  </button>
                                )}
                              </>
                            )}
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

            <p className="text-center text-xs text-slate-500 mt-3">
              {currentIndex + 1} / {productos.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
