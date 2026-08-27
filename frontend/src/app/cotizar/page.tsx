'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { crearQuote } from '@/services/quoteService';
import { Plus, Send, AlertCircle, Sparkles, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { newProduct, validateProduct, MAX_PRODUCTOS, type ProductForm } from './types';
import { uploadToCloudinary } from './cloudinary';
import SuccessScreen from './components/SuccessScreen';
import ContactoForm from './components/ContactoForm';
import ProductoFormCard from './components/ProductoFormCard';
import ProductosTable from './components/ProductosTable';

// ── Componente principal ───────────────────────────────────────────────────────

export default function Cotizar() {
  const { profile, token } = useAuth();

  // Datos de contacto
  const [nombre,   setNombre]   = useState('');
  const [telefono, setTelefono] = useState('');
  const [email,    setEmail]    = useState('');
  const [notasCotizacion, setNotasCotizacion] = useState('');

  // Producto en edición y lista acumulada
  const [productoActual, setProductoActual] = useState<ProductForm>(newProduct());
  const [productos,      setProductos]      = useState<ProductForm[]>([]);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [quoteId, setQuoteId] = useState('');
  const [error,   setError]   = useState<string | null>(null);

  // Auto-llenar si está logueado
  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre   || '');
      setTelefono(profile.telefono || '');
      setEmail(profile.email     || '');
    }
  }, [profile]);

  // ¿El formulario del producto actual tiene datos?
  const isFormDirty =
    productoActual.nombre.trim() !== '' ||
    productoActual.descripcionLineal.trim() !== '' ||
    productoActual.accesorios.trim() !== '' ||
    productoActual.personalizacion.length > 0 ||
    productoActual.empaque !== 'ninguno' ||
    Object.values(productoActual.imageFiles).some(f => f !== null);

  const totalProductosCount = productos.length + (isFormDirty ? 1 : 0);

  // ── Manejo del producto ───────────────────────────────────────────────────

  const addProduct = () => {
    setError(null);
    if (productos.length >= MAX_PRODUCTOS) {
      setError(`Puedes agregar máximo ${MAX_PRODUCTOS} productos por cotización.`);
      return;
    }
    const err = validateProduct(productoActual, 'producto actual');
    if (err) { setError(err); return; }
    setProductos(prev => [...prev, { ...productoActual, id: Math.random().toString(36).substr(2, 9) }]);
    setProductoActual(newProduct());
  };

  const removeProduct = (id: string) => setProductos(prev => prev.filter(p => p.id !== id));

  const handleProductChange = (field: keyof ProductForm, value: ProductForm[keyof ProductForm]) =>
    setProductoActual(prev => ({ ...prev, [field]: value }));

  const handlePersonalizacionChange = (value: string, checked: boolean) =>
    setProductoActual(prev => {
      const nextPersonalizacion = checked
        ? [...new Set([...prev.personalizacion, value])]
        : prev.personalizacion.filter(i => i !== value);

      const nextComentarios = { ...prev.personalizacionComentarios };
      if (checked) {
        nextComentarios[value] = nextComentarios[value] || '';
      } else {
        delete nextComentarios[value];
      }

      return {
        ...prev,
        personalizacion: nextPersonalizacion,
        personalizacionComentarios: nextComentarios,
      };
    });

  const handlePersonalizacionComentarioChange = (key: string, value: string) =>
    setProductoActual(prev => ({
      ...prev,
      personalizacionComentarios: {
        ...prev.personalizacionComentarios,
        [key]: value,
      },
    }));

  const handleImageChange = (angle: string, file: File | null) => {
    if (!file) {
      setProductoActual(prev => ({
        ...prev,
        imageFiles: { ...prev.imageFiles, [angle]: null },
        imagePreviews: { ...prev.imagePreviews, [angle]: null },
      }));
      return;
    }
    if (!file.type.startsWith('image/')) { setError('Por favor selecciona un archivo de imagen válido.'); return; }
    const reader = new FileReader();
    reader.onloadend = () =>
      setProductoActual(prev => ({
        ...prev,
        imageFiles: { ...prev.imageFiles, [angle]: file },
        imagePreviews: { ...prev.imagePreviews, [angle]: reader.result as string },
      }));
    reader.readAsDataURL(file);
  };

  // ── Envío ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !telefono.trim() || !email.trim()) {
      setError('Por favor completa todos los campos de contacto.');
      return;
    }

    const listaProductos = [...productos];
    if (isFormDirty) {
      const err = validateProduct(productoActual, 'producto en el formulario');
      if (err) { setError(err); return; }
      listaProductos.push({ ...productoActual, id: Math.random().toString(36).substr(2, 9) });
    }

    if (listaProductos.length === 0) {
      setError('Agrega al menos un producto a la cotización antes de enviarla.');
      return;
    }

    for (let i = 0; i < listaProductos.length; i++) {
      const err = validateProduct(listaProductos[i], `Producto #${i + 1}`);
      if (err) { setError(err); return; }
    }

    setLoading(true);
    try {
      // 1. Subir imágenes a Cloudinary
      const productosFinales = [];
      for (const [index, p] of listaProductos.entries()) {
        const idProducto = p.id || `PROD-${index + 1}`;
        const uploadImage = async (angle: string): Promise<string> => {
          const file = p.imageFiles[angle];
          if (!file) return '';
          try { return await uploadToCloudinary(file); }
          catch { return ''; }
        };
        const [imagenFrontal, imagenLateral, imagenTrasera, imagenDiagonal] = await Promise.all([
          uploadImage('frontal'), uploadImage('lateral'), uploadImage('trasera'), uploadImage('diagonal'),
        ]);
        productosFinales.push({
          idProducto,
          nombre:                  p.nombre,
          descripcionLineal:       p.descripcionLineal,
          unidades:                p.unidades,
          accesorios:              p.accesorios,
          personalizacion:         p.personalizacion,
          personalizacionOtraText: p.personalizacion.includes('otra') ? p.personalizacionOtraText : '',
          personalizacionComentarios: p.personalizacionComentarios || {},
          empaque:                 p.empaque,
          empaqueOtraText:         p.empaque === 'otra' ? p.empaqueOtraText : '',
          imagenFrontal,
          imagenLateral,
          imagenTrasera,
          imagenDiagonal,
          tiempoHoras:             parseFloat(p.tiempoHoras) || 0,
          tiempoMinutos:           parseFloat(p.tiempoMinutos) || 0,
          pesoGramos:              parseFloat(p.pesoGramos) || 0,
        });
      }

      // 2. Enviar al backend para validar identidad y limpiar valores calculados
      const quoteData = {
        productos:  productosFinales,
        notasCotizacion,
        ...(token
          ? {}
          : {
              cliente: {
                nombre,
                telefono,
                email,
              },
            }),
      };

      const createdQuote = await crearQuote(quoteData, token);
      setQuoteId(createdQuote.id);
      setSuccess(true);
      setProductos([]);
      setProductoActual(newProduct());
      setNotasCotizacion('');
      if (!profile) { setNombre(''); setTelefono(''); setEmail(''); }
    } catch (err: any) {
      console.error('Error al guardar cotización:', err);
      setError(err.message || 'Ocurrió un error al enviar tu cotización. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito ─────────────────────────────────────────────────────

  if (success) {
    return <SuccessScreen quoteId={quoteId} onNuevaCotizacion={() => setSuccess(false)} />;
  }

  // ── Formulario principal ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.06),transparent_50%)] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.05),transparent_50%)] -z-10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div className="max-w-4xl mx-auto">

        {/* ── Hero Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold mb-5 tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Solicita tu presupuesto
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-outfit text-white leading-tight mb-4">
            Cotiza tu{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Diseño 3D</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Completa los datos de contacto y cada producto que necesitas imprimir.
            Nuestro equipo calculará el precio y te contactará pronto.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Error global */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SECCIÓN 1: Datos de Contacto ── */}
          <ContactoForm
            profile={profile}
            nombre={nombre} setNombre={setNombre}
            telefono={telefono} setTelefono={setTelefono}
            email={email} setEmail={setEmail}
            notasCotizacion={notasCotizacion} setNotasCotizacion={setNotasCotizacion}
          />

          {/* ── SECCIÓN 2: Producto en edición ── */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between px-1"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Diseños a Cotizar
                    <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full font-bold">
                      {productos.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">Puedes agregar múltiples piezas a la misma solicitud.</p>
                </div>
              </div>
            </motion.div>

            {/* Tarjeta del producto actual */}
            <AnimatePresence initial={false}>
              {[productoActual].map(producto => (
                <ProductoFormCard
                  key={producto.id}
                  producto={producto}
                  productosLength={productos.length}
                  onFieldChange={handleProductChange}
                  onPersonalizacionChange={handlePersonalizacionChange}
                  onPersonalizacionComentarioChange={handlePersonalizacionComentarioChange}
                  onImageChange={handleImageChange}
                />
              ))}
            </AnimatePresence>

            {/* Botón agregar otro producto */}
            <motion.button
              type="button"
              onClick={addProduct}
              disabled={productos.length >= MAX_PRODUCTOS}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-4 border-2 border-dashed border-slate-800 hover:border-cyan-500/30 rounded-2xl text-slate-500 hover:text-cyan-400 text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-500 disabled:hover:border-slate-800"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              {productos.length >= MAX_PRODUCTOS
                ? `Límite de ${MAX_PRODUCTOS} productos alcanzado`
                : 'Guardar producto y agregar otro'}
            </motion.button>

            {/* Tabla de productos ya agregados */}
            <ProductosTable productos={productos} onRemove={removeProduct} />
          </div>

          {/* ── Botón de envío ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="pt-2 pb-8"
          >
            <button
              type="submit"
              disabled={loading}
              style={{ paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Procesando tu cotización...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>
                    Finalizar cotización
                    <span className="ml-2 text-white/70 font-normal">
                      ({totalProductosCount} {totalProductosCount === 1 ? 'producto' : 'productos'})
                    </span>
                  </span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-600 mt-3">
              Al enviar aceptas que nuestro equipo se contacte contigo para confirmar detalles.
            </p>
          </motion.div>

        </form>
      </div>
    </div>
  );
}
