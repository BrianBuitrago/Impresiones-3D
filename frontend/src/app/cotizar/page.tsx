'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Plus,
  Trash2,
  Upload,
  Send,
  CheckCircle2,
  AlertCircle,
  Info,
  User,
  Phone,
  Mail,
  Package,
  Ruler,
  Hash,
  Wrench,
  Palette,
  Camera,
  X,
  ChevronDown,
  Sparkles,
  Box,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductForm {
  id: string;
  nombre: string;
  tamanoHorizontal: string;
  tamanoVertical: string;
  unidades: number;
  accesorios: string;
  personalizacion: string[];
  personalizacionOtraText: string;
  empaque: string;
  empaqueOtraText: string;
  imageFile: File | null;
  imagePreview: string | null;
}

const newProduct = (): ProductForm => ({
  id: Math.random().toString(36).substr(2, 9),
  nombre: '',
  tamanoHorizontal: '',
  tamanoVertical: '',
  unidades: 1,
  accesorios: '',
  personalizacion: [],
  personalizacionOtraText: '',
  empaque: 'ninguno',
  empaqueOtraText: '',
  imageFile: null,
  imagePreview: null,
});

const PERSONALIZACION_OPTIONS = [
  { value: 'cosmeticos', label: 'Cosméticos', emoji: '✨' },
  { value: 'pintura base', label: 'Pintura base', emoji: '🎨' },
  { value: 'otra', label: 'Otra personalización', emoji: '⚙️' },
];

const EMPAQUE_OPTIONS = [
  { value: 'ninguno', label: 'Sin empaque', desc: 'Entrega básica sin embalaje adicional' },
  { value: 'bolsa', label: 'Bolsa', desc: 'Bolsa de plástico o tela protectora' },
  { value: 'caja', label: 'Caja', desc: 'Caja rígida de protección' },
  { value: 'otra', label: 'Otro tipo', desc: 'Especifica el empaque que necesitas' },
];

export default function Cotizar() {
  const { user, profile } = useAuth();

  // Datos de contacto del cliente
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // Lista de productos en la cotización
  const [productos, setProductos] = useState<ProductForm[]>([newProduct()]);

  // Estados del envío
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [quoteId, setQuoteId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-llenar datos si el usuario está logueado
  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre || '');
      setTelefono(profile.telefono || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  // ── Funciones de manejo de productos ──────────────────────────────────────

  const addProduct = () => {
    setProductos(prev => [...prev, newProduct()]);
  };

  const removeProduct = (id: string) => {
    if (productos.length > 1) {
      setProductos(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleProductChange = (id: string, field: keyof ProductForm, value: any) => {
    setProductos(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handlePersonalizacionChange = (id: string, value: string, checked: boolean) => {
    setProductos(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = [...p.personalizacion];
        if (checked) {
          if (!updated.includes(value)) updated.push(value);
        } else {
          const idx = updated.indexOf(value);
          if (idx > -1) updated.splice(idx, 1);
        }
        return { ...p, personalizacion: updated };
      })
    );
  };

  const handleImageChange = (id: string, file: File | null) => {
    if (!file) {
      setProductos(prev =>
        prev.map(p => (p.id === id ? { ...p, imageFile: null, imagePreview: null } : p))
      );
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductos(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, imageFile: file, imagePreview: reader.result as string }
            : p
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `quotes/images/${Math.random().toString(36).substr(2, 9)}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // ── Envío del formulario ──────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !telefono.trim() || !email.trim()) {
      setError('Por favor completa todos los campos de contacto.');
      return;
    }

    for (let i = 0; i < productos.length; i++) {
      const p = productos[i];
      if (!p.nombre.trim()) {
        setError(`Ingresa el nombre del Producto #${i + 1}.`);
        return;
      }
      if (!p.tamanoHorizontal || parseFloat(p.tamanoHorizontal) <= 0) {
        setError(`El tamaño horizontal del Producto #${i + 1} debe ser mayor a 0.`);
        return;
      }
      if (!p.tamanoVertical || parseFloat(p.tamanoVertical) <= 0) {
        setError(`El tamaño vertical del Producto #${i + 1} debe ser mayor a 0.`);
        return;
      }
      if (p.unidades < 1) {
        setError(`Las unidades del Producto #${i + 1} deben ser al menos 1.`);
        return;
      }
      if (p.personalizacion.includes('otra') && !p.personalizacionOtraText.trim()) {
        setError(`Describe la personalización "Otra" del Producto #${i + 1}.`);
        return;
      }
      if (p.empaque === 'otra' && !p.empaqueOtraText.trim()) {
        setError(`Describe el empaque "Otro" del Producto #${i + 1}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const productosFinales = [];
      for (const p of productos) {
        let imagenUrl = '';
        if (p.imageFile) {
          try {
            imagenUrl = await uploadImage(p.imageFile);
          } catch {
            imagenUrl = p.imagePreview || '';
          }
        }
        productosFinales.push({
          nombre: p.nombre,
          tamanoHorizontal: parseFloat(p.tamanoHorizontal),
          tamanoVertical: parseFloat(p.tamanoVertical),
          unidades: p.unidades,
          accesorios: p.accesorios,
          personalizacion: p.personalizacion,
          personalizacionOtraText: p.personalizacion.includes('otra') ? p.personalizacionOtraText : '',
          empaque: p.empaque,
          empaqueOtraText: p.empaque === 'otra' ? p.empaqueOtraText : '',
          imagenUrl,
        });
      }

      const quoteData = {
        cliente: {
          uid: profile?.uid || user?.uid || null,
          nombre,
          telefono,
          email,
        },
        productos: productosFinales,
        estado: 'pendiente',
        creadoEn: new Date().toISOString(),
        porcentajeGanancia: 30,
        valorGananciaTotal: 0,
        precioTotalCotizacion: 0,
      };

      const docRef = await addDoc(collection(db, 'quotes'), quoteData);
      setQuoteId(docRef.id);
      setSuccess(true);
      setProductos([newProduct()]);
      if (!profile) {
        setNombre('');
        setTelefono('');
        setEmail('');
      }
    } catch (err: any) {
      console.error('Error al guardar cotización:', err);
      setError(err.message || 'Ocurrió un error al enviar tu cotización. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito ─────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_65%)] -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-xl w-full bg-slate-900/50 border border-slate-800/80 rounded-3xl p-10 backdrop-blur-xl shadow-2xl text-center relative"
        >
          {/* Glow top */}
          <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent rounded-full" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-full flex items-center justify-center mb-6 border border-cyan-500/20"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>

          <h1 className="text-3xl font-extrabold text-white mb-3 font-outfit">
            ¡Cotización Enviada!
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Hemos registrado tu solicitud. Nuestro equipo revisará los detalles y te
            notificará por correo electrónico con los costos de fabricación detallados.
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-8 text-left">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest mb-2">
              Número de Referencia
            </span>
            <span className="text-lg font-mono text-cyan-400 font-bold select-all break-all">
              {quoteId}
            </span>
            <p className="text-xs text-slate-500 mt-2">
              Guarda este número para hacer seguimiento de tu cotización.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setSuccess(false)}
              className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nueva Cotización
            </button>
            <a
              href="/"
              className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 text-center transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Ver Catálogo <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Formulario principal ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.06),transparent_50%)] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.05),transparent_50%)] -z-10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div className="max-w-4xl mx-auto">

        {/* ── Hero Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-bold mb-5 tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Solicita tu presupuesto
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-outfit text-white leading-tight mb-4">
            Cotiza tu{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Diseño 3D
            </span>
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Completa los detalles de tus piezas. Calcularemos los costos exactos
            basados en filamento, energía y personalización.
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative bg-slate-900/50 border border-slate-800/80 rounded-3xl p-7 md:p-9 backdrop-blur-md shadow-xl overflow-hidden"
          >
            {/* Accent line */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            <div className="flex items-center gap-3 mb-7">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Información de Contacto</h2>
                <p className="text-xs text-slate-500">
                  {profile
                    ? 'Tus datos se han precargado automáticamente desde tu perfil.'
                    : 'Ingresa tus datos para que podamos contactarte con la cotización.'}
                </p>
              </div>
            </div>

            {profile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-3.5 bg-cyan-500/5 border border-cyan-500/15 rounded-xl text-xs text-cyan-300 flex items-center gap-2.5"
              >
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Datos precargados de tu cuenta. Puedes modificarlos si lo requieres.
                </span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Nombre */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Nombre Completo <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    placeholder="Tu nombre completo"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Teléfono <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                    placeholder="+57 300 123 4567"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Correo Electrónico <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── SECCIÓN 2: Productos ── */}
          <div className="space-y-5">
            {/* Encabezado de sección */}
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

              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-2 py-2.5 px-4 bg-slate-900 border border-slate-700 hover:border-cyan-500/40 hover:bg-slate-800 rounded-xl text-cyan-400 text-xs font-bold transition-all cursor-pointer group"
              >
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
                Agregar Producto
              </button>
            </motion.div>

            {/* Tarjetas de productos */}
            <AnimatePresence initial={false}>
              {productos.map((producto, index) => (
                <motion.div
                  key={producto.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="relative bg-slate-900/50 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-xl overflow-hidden"
                >
                  {/* Accent colorido superior por índice */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px] opacity-60"
                    style={{
                      background: `linear-gradient(to right, transparent, ${
                        ['#06b6d4', '#818cf8', '#34d399', '#f59e0b', '#f43f5e'][index % 5]
                      }, transparent)`,
                    }}
                  />

                  {/* Header de la tarjeta */}
                  <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-extrabold text-slate-300">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">
                          {producto.nombre || `Producto #${index + 1}`}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {producto.unidades} unidad{producto.unidades !== 1 ? 'es' : ''} ·{' '}
                          {producto.tamanoHorizontal && producto.tamanoVertical
                            ? `${producto.tamanoHorizontal} × ${producto.tamanoVertical} mm`
                            : 'Sin dimensiones'}
                        </p>
                      </div>
                    </div>

                    {productos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(producto.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Cuerpo de la tarjeta */}
                  <div className="p-7 space-y-7">

                    {/* ── Fila 1: Nombre + Unidades ── */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <div className="md:col-span-3 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Nombre de la Pieza o Diseño <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={producto.nombre}
                          onChange={(e) => handleProductChange(producto.id, 'nombre', e.target.value)}
                          placeholder="Ej. Soporte para laptop, figura de colección..."
                          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Unidades <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                            <Hash className="w-4 h-4" />
                          </span>
                          <input
                            type="number"
                            required
                            min="1"
                            value={producto.unidades}
                            onChange={(e) =>
                              handleProductChange(producto.id, 'unidades', parseInt(e.target.value) || 1)
                            }
                            className="w-full pl-9 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Fila 2: Dimensiones ── */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Ruler className="w-4 h-4 text-slate-500" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Dimensiones de la Pieza <span className="text-red-400">*</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="block text-[11px] text-slate-500 font-semibold">
                            Tamaño Horizontal (Ancho en mm)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              required
                              min="1"
                              value={producto.tamanoHorizontal}
                              onChange={(e) =>
                                handleProductChange(producto.id, 'tamanoHorizontal', e.target.value)
                              }
                              placeholder="Ej. 150"
                              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all font-mono"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-xs font-semibold pointer-events-none">
                              mm
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] text-slate-500 font-semibold">
                            Tamaño Vertical (Alto en mm)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              required
                              min="1"
                              value={producto.tamanoVertical}
                              onChange={(e) =>
                                handleProductChange(producto.id, 'tamanoVertical', e.target.value)
                              }
                              placeholder="Ej. 80"
                              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all font-mono"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-xs font-semibold pointer-events-none">
                              mm
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Fila 3: Accesorios ── */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-slate-500" />
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Accesorios Requeridos
                        </label>
                        <span className="text-[10px] text-slate-600 italic">(Opcional)</span>
                      </div>
                      <textarea
                        value={producto.accesorios}
                        onChange={(e) => handleProductChange(producto.id, 'accesorios', e.target.value)}
                        rows={2}
                        placeholder="Ej. Tornillos M3, imanes de neodimio, resortes... Deja en blanco si no requiere."
                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all resize-none"
                      />
                    </div>

                    {/* ── Fila 4: Personalización ── */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-slate-500" />
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Personalización del Acabado
                        </label>
                        <span className="text-[10px] text-slate-600 italic">(Selección múltiple)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PERSONALIZACION_OPTIONS.map((opt) => {
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
                                onChange={(e) =>
                                  handlePersonalizacionChange(producto.id, opt.value, e.target.checked)
                                }
                                className="sr-only"
                              />
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isChecked
                                    ? 'bg-cyan-500 border-cyan-500'
                                    : 'border-slate-700 bg-transparent'
                                }`}
                              >
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
                              required
                              value={producto.personalizacionOtraText}
                              onChange={(e) =>
                                handleProductChange(producto.id, 'personalizacionOtraText', e.target.value)
                              }
                              placeholder="Describe la personalización adicional que necesitas..."
                              className="w-full px-4 py-3 bg-slate-950/80 border border-cyan-500/30 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ── Fila 5: Empaque + Foto ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                      {/* Empaque */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-500" />
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Tipo de Empaque
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {EMPAQUE_OPTIONS.map((opt) => {
                            const isSelected = producto.empaque === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleProductChange(producto.id, 'empaque', opt.value)}
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <span className="block text-xs font-bold">{opt.label}</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">
                                  {opt.desc}
                                </span>
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
                                required
                                value={producto.empaqueOtraText}
                                onChange={(e) =>
                                  handleProductChange(producto.id, 'empaqueOtraText', e.target.value)
                                }
                                placeholder="Especifica el tipo de empaque..."
                                className="w-full px-4 py-2.5 bg-slate-950/80 border border-indigo-500/30 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 text-sm transition-all"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Foto de referencia */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-slate-500" />
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Foto / Referencia Visual
                          </label>
                          <span className="text-[10px] text-slate-600 italic">(Opcional)</span>
                        </div>

                        {!producto.imagePreview ? (
                          <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-cyan-500/40 rounded-xl p-8 bg-slate-950/30 transition-all cursor-pointer group">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageChange(producto.id, e.target.files ? e.target.files[0] : null)
                              }
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Upload className="w-8 h-8 text-slate-600 group-hover:text-cyan-400 mb-3 transition-colors" />
                            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors font-semibold text-center">
                              Arrastra o haz clic para adjuntar
                            </span>
                            <span className="text-[10px] text-slate-600 mt-1">
                              JPG, PNG, WEBP — máx. 10 MB
                            </span>
                          </label>
                        ) : (
                          <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                            <img
                              src={producto.imagePreview}
                              alt="Preview"
                              className="w-full h-36 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                              <span className="text-xs text-slate-300 font-medium truncate max-w-[160px]">
                                {producto.imageFile?.name || 'imagen.jpg'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleImageChange(producto.id, null)}
                                className="p-1.5 bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Botón agregar al final */}
            <motion.button
              type="button"
              onClick={addProduct}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-4 border-2 border-dashed border-slate-800 hover:border-cyan-500/30 rounded-2xl text-slate-500 hover:text-cyan-400 text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              Agregar otro diseño a esta cotización
            </motion.button>
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
              className="w-full py-4.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-base"
              style={{ paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
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
                    Enviar Solicitud de Cotización
                    <span className="ml-2 text-white/70 font-normal">
                      ({productos.length} {productos.length === 1 ? 'producto' : 'productos'})
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
