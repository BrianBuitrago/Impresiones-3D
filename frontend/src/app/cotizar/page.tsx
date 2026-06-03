'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
  Sparkles,
  Box,
  ArrowRight,
  ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ProductForm {
  id: string;
  nombre: string;
  descripcionLineal: string;
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
  tiempoHoras: string;
  tiempoMinutos: string;
  pesoGramos: string;
  costoDiseno: string;
  costoAccesorios: string;
  costoPersonalizado: string;
  costoEmpaque: string;
}

const newProduct = (): ProductForm => ({
  id: Math.random().toString(36).substr(2, 9),
  nombre: '',
  descripcionLineal: '',
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
  tiempoHoras: '',
  tiempoMinutos: '',
  pesoGramos: '',
  costoDiseno: '',
  costoAccesorios: '',
  costoPersonalizado: '',
  costoEmpaque: '',
});

const PERSONALIZACION_OPTIONS = [
  { value: 'cosmeticos',   label: 'Cosméticos',            emoji: '✨' },
  { value: 'pintura base', label: 'Pintura base',          emoji: '🎨' },
  { value: 'otra',         label: 'Otra personalización',  emoji: '⚙️' },
];

const EMPAQUE_OPTIONS = [
  { value: 'ninguno', label: 'Sin empaque', desc: 'Entrega básica sin embalaje adicional' },
  { value: 'bolsa',   label: 'Bolsa',       desc: 'Bolsa de plástico o tela protectora'  },
  { value: 'caja',    label: 'Caja',        desc: 'Caja rígida de protección'             },
  { value: 'otra',    label: 'Otro tipo',   desc: 'Especifica el empaque que necesitas'  },
];

const MAX_PRODUCTOS = 5;
// Valores por defecto para evitar `undefined` en entornos donde faltan las env vars
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dobul5gbb';
const CLOUDINARY_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'impresiones3d_unsigned';

// ── Subida a Cloudinary (sin backend, sin firma) ──────────────────────────────

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_PRESET;

  if (!cloudName || !preset) {
    console.error('Cloudinary env missing:', { cloudName, preset });
    throw new Error('Configuración de Cloudinary incompleta. Revisa variables de entorno.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  formData.append('folder', 'quotes');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al subir imagen a Cloudinary');
  }

  const data = await res.json();
  return data.secure_url as string;
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function Cotizar() {
  const { profile, user } = useAuth();

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
    productoActual.tamanoHorizontal.trim() !== '' ||
    productoActual.tamanoVertical.trim() !== '' ||
    productoActual.accesorios.trim() !== '' ||
    productoActual.personalizacion.length > 0 ||
    productoActual.empaque !== 'ninguno' ||
    productoActual.imageFile !== null;

  const totalProductosCount = productos.length + (isFormDirty ? 1 : 0);

  // ── Manejo del producto ───────────────────────────────────────────────────

  const validateProduct = (p: ProductForm, label = 'producto') => {
    if (!p.nombre.trim())                                            return `Ingresa el nombre del ${label}.`;
    if (!p.tamanoHorizontal || parseFloat(p.tamanoHorizontal) <= 0) return `El tamaño horizontal del ${label} debe ser mayor a 0.`;
    if (!p.tamanoVertical   || parseFloat(p.tamanoVertical)   <= 0) return `El tamaño vertical del ${label} debe ser mayor a 0.`;
    if (p.unidades < 1)                                              return `Las unidades del ${label} deben ser al menos 1.`;
    if (p.tiempoHoras && parseFloat(p.tiempoHoras) < 0)            return `Las horas de impresión del ${label} no pueden ser negativas.`;
    if (p.tiempoMinutos && parseFloat(p.tiempoMinutos) < 0)        return `Los minutos de impresión del ${label} no pueden ser negativos.`;
    if (p.pesoGramos && parseFloat(p.pesoGramos) < 0)              return `El peso en gramos del ${label} no puede ser negativo.`;
    if (p.costoDiseno && parseFloat(p.costoDiseno) < 0)            return `El costo de diseño del ${label} no puede ser negativo.`;
    if (p.costoAccesorios && parseFloat(p.costoAccesorios) < 0)    return `El costo de accesorios del ${label} no puede ser negativo.`;
    if (p.costoPersonalizado && parseFloat(p.costoPersonalizado) < 0) return `El costo personalizado del ${label} no puede ser negativo.`;
    if (p.costoEmpaque && parseFloat(p.costoEmpaque) < 0)          return `El costo de empaque del ${label} no puede ser negativo.`;
    if (p.personalizacion.includes('otra') && !p.personalizacionOtraText.trim())
      return `Describe la personalización "Otra" del ${label}.`;
    if (p.empaque === 'otra' && !p.empaqueOtraText.trim())
      return `Describe el empaque "Otro" del ${label}.`;
    return null;
  };

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
    setProductoActual(prev => ({
      ...prev,
      personalizacion: checked
        ? [...new Set([...prev.personalizacion, value])]
        : prev.personalizacion.filter(i => i !== value),
    }));

  const handleImageChange = (file: File | null) => {
    if (!file) { setProductoActual(prev => ({ ...prev, imageFile: null, imagePreview: null })); return; }
    if (!file.type.startsWith('image/')) { alert('Por favor selecciona un archivo de imagen válido.'); return; }
    const reader = new FileReader();
    reader.onloadend = () =>
      setProductoActual(prev => ({ ...prev, imageFile: file, imagePreview: reader.result as string }));
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
        let imagenUrl = '';
        if (p.imageFile) {
          try {
            imagenUrl = await uploadToCloudinary(p.imageFile);
          } catch {
            // Si falla la imagen, continuamos sin ella
            imagenUrl = '';
          }
        }
        productosFinales.push({
          idProducto,
          ID_Producto: idProducto,
          nombre:                  p.nombre,
          descripcionLineal:       p.descripcionLineal,
          Descripcion_Lineal:      p.descripcionLineal || p.nombre,
          tamanoHorizontal:        parseFloat(p.tamanoHorizontal),
          tamanoVertical:          parseFloat(p.tamanoVertical),
          unidades:                p.unidades,
          Cantidad_Piezas:         p.unidades,
          accesorios:              p.accesorios,
          personalizacion:         p.personalizacion,
          personalizacionOtraText: p.personalizacion.includes('otra') ? p.personalizacionOtraText : '',
          empaque:                 p.empaque,
          empaqueOtraText:         p.empaque === 'otra' ? p.empaqueOtraText : '',
          imagenUrl,
          tiempoHoras:             parseFloat(p.tiempoHoras) || 0,
          tiempoMinutos:           parseFloat(p.tiempoMinutos) || 0,
          pesoGramos:              parseFloat(p.pesoGramos) || 0,
          costoDiseno:             parseFloat(p.costoDiseno) || 0,
          costoAccesorios:         parseFloat(p.costoAccesorios) || 0,
          costoPersonalizado:      parseFloat(p.costoPersonalizado) || 0,
          costoEmpaque:            parseFloat(p.costoEmpaque) || 0,
          Tiempo_Horas:            parseFloat(p.tiempoHoras) || 0,
          Tiempo_Minutos:          parseFloat(p.tiempoMinutos) || 0,
          Peso_Gramos:             parseFloat(p.pesoGramos) || 0,
          'Costo_Diseño':          parseFloat(p.costoDiseno) || 0,
          Costo_Accesorios:        parseFloat(p.costoAccesorios) || 0,
          Costo_Personalizado:     parseFloat(p.costoPersonalizado) || 0,
          Costo_Empaque:           parseFloat(p.costoEmpaque) || 0,
          Subtotal_Energia:        0,
          Subtotal_Material:       0,
          Subtotal_Fabricacion:    0,
          Precio_Unitario_Con_Ganancia: 0,
          Precio_Lineal_Total:      0,
          costoDisenoUnitario:      parseFloat(p.costoDiseno) || 0,
          costoAccesoriosUnitario:  parseFloat(p.costoAccesorios) || 0,
          valorPersonalizacionUnitario: parseFloat(p.costoPersonalizado) || 0,
          valorEmpaqueUnitario:     parseFloat(p.costoEmpaque) || 0,
        });
      }

      // 2. Guardar en Firestore directamente
      const fecha = new Date();
      const cantidadTotalPiezas = productosFinales.reduce((acc, p) => acc + (p.unidades || 0), 0);
      const quoteData = {
        cliente: {
          nombre,
          telefono,
          email,
          uid: user?.uid || null,
        },
        productos:  productosFinales,
        estado:     'pendiente',
        creadoEn:   serverTimestamp(),
        actualizadoEn: serverTimestamp(),
        Fecha: fecha.toISOString(),
        ID_Cliente: user?.uid || null,
        porcentajeGanancia: 30,
        Porcentaje_Ganancia: 30,
        // Campos para que el admin calcule luego
        subtotalFabricacionTotal: 0,
        valorGananciaTotal:       0,
        precioTotal:              0,
        precioTotalCotizacion:    0,
        cantidadTotalPiezas,
        notasCotizacion,
        Subtotal_Fabricacion_Total: 0,
        Valor_Ganancia_Total:       0,
        Precio_Total:               0,
        Precio_Total_Cotizacion:    0,
        Cantidad_Total_Piezas:      cantidadTotalPiezas,
        Notas_Cotizacion:           notasCotizacion,
      };

      const docRef = await addDoc(collection(db, 'quotes'), quoteData);

      setQuoteId(docRef.id);
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
          <div className="absolute -top-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent rounded-full" />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 rounded-full flex items-center justify-center mb-6 border border-cyan-500/20"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>

          <h1 className="text-3xl font-extrabold text-white mb-3 font-outfit">¡Cotización Enviada!</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Hemos registrado tu solicitud. Nuestro equipo revisará los detalles y te
            notificará por correo con los costos de fabricación detallados.
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-8 text-left">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-widest mb-2">Número de Referencia</span>
            <span className="text-lg font-mono text-cyan-400 font-bold select-all break-all">{quoteId}</span>
            <p className="text-xs text-slate-500 mt-2">Guarda este número para hacer seguimiento de tu cotización.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setSuccess(false)}
              className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nueva Cotización
            </button>
            <Link
              href="/"
              className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 text-center transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Ver Catálogo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative bg-slate-900/50 border border-slate-800/80 rounded-3xl p-7 md:p-9 backdrop-blur-md shadow-xl overflow-hidden"
          >
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
                <span>Datos precargados de tu cuenta. Puedes modificarlos si lo requieres.</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Nombre */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Nombre Completo <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
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
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="tel"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    required
                    placeholder="+57 300 123 4567"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Correo */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Correo Electrónico <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Notas de cotización
              </label>
              <textarea
                value={notasCotizacion}
                onChange={e => setNotasCotizacion(e.target.value)}
                rows={3}
                placeholder="Agrega fechas objetivo, restricciones, acabado esperado o cualquier detalle general..."
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all resize-none"
              />
            </div>
          </motion.div>

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
                        ['#06b6d4','#818cf8','#34d399','#f59e0b','#f43f5e'][productos.length % 5]
                      }, transparent)`,
                    }}
                  />

                  {/* Header de la tarjeta */}
                  <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-800/60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-extrabold text-slate-300">
                        {productos.length + 1}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">
                          {producto.nombre || `Producto #${productos.length + 1}`}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {producto.unidades} unidad{producto.unidades !== 1 ? 'es' : ''} ·{' '}
                          {producto.tamanoHorizontal && producto.tamanoVertical
                            ? `${producto.tamanoHorizontal} × ${producto.tamanoVertical} mm`
                            : 'Sin dimensiones'}
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
                          onChange={e => handleProductChange('nombre', e.target.value)}
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
                            onChange={e => handleProductChange('unidades', parseInt(e.target.value) || 1)}
                            className="w-full pl-9 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Descripción lineal
                      </label>
                      <textarea
                        value={producto.descripcionLineal}
                        onChange={e => handleProductChange('descripcionLineal', e.target.value)}
                        rows={2}
                        placeholder="Describe el uso, forma o detalle principal de esta pieza..."
                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all resize-none"
                      />
                    </div>

                    {/* Fila 2: Dimensiones */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Ruler className="w-4 h-4 text-slate-500" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Dimensiones de la Pieza <span className="text-red-400">*</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="block text-[11px] text-slate-500 font-semibold">Tamaño Horizontal — Ancho (mm)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              value={producto.tamanoHorizontal}
                              onChange={e => handleProductChange('tamanoHorizontal', e.target.value)}
                              placeholder="Ej. 150"
                              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all font-mono"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-xs font-semibold pointer-events-none">mm</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] text-slate-500 font-semibold">Tamaño Vertical — Alto (mm)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              value={producto.tamanoVertical}
                              onChange={e => handleProductChange('tamanoVertical', e.target.value)}
                              placeholder="Ej. 80"
                              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all font-mono"
                            />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 text-xs font-semibold pointer-events-none">mm</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fila 3: Tiempos, peso y costos */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Tiempo - Horas
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={producto.tiempoHoras}
                          onChange={e => handleProductChange('tiempoHoras', e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Tiempo - Minutos
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={producto.tiempoMinutos}
                          onChange={e => handleProductChange('tiempoMinutos', e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Peso (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={producto.pesoGramos}
                          onChange={e => handleProductChange('pesoGramos', e.target.value)}
                          placeholder="0"
                          className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Costos directos
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min="0"
                            value={producto.costoDiseno}
                            onChange={e => handleProductChange('costoDiseno', e.target.value)}
                            placeholder="Diseño"
                            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-xs font-mono"
                          />
                          <input
                            type="number"
                            min="0"
                            value={producto.costoAccesorios}
                            onChange={e => handleProductChange('costoAccesorios', e.target.value)}
                            placeholder="Accesorios"
                            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-xs font-mono"
                          />
                          <input
                            type="number"
                            min="0"
                            value={producto.costoPersonalizado}
                            onChange={e => handleProductChange('costoPersonalizado', e.target.value)}
                            placeholder="Personalizado"
                            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-xs font-mono"
                          />
                          <input
                            type="number"
                            min="0"
                            value={producto.costoEmpaque}
                            onChange={e => handleProductChange('costoEmpaque', e.target.value)}
                            placeholder="Empaque"
                            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-xs font-mono"
                          />
                        </div>
                      </div>
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
                                onChange={e => handlePersonalizacionChange(opt.value, e.target.checked)}
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
                              onChange={e => handleProductChange('personalizacionOtraText', e.target.value)}
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
                                onClick={() => handleProductChange('empaque', opt.value)}
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
                                onChange={e => handleProductChange('empaqueOtraText', e.target.value)}
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
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Foto / Referencia Visual</label>
                          <span className="text-[10px] text-slate-600 italic">(Opcional)</span>
                        </div>

                        {!producto.imagePreview ? (
                          <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-cyan-500/40 rounded-xl p-8 bg-slate-950/30 transition-all cursor-pointer group">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleImageChange(e.target.files?.[0] ?? null)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Upload className="w-8 h-8 text-slate-600 group-hover:text-cyan-400 mb-3 transition-colors" />
                            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors font-semibold text-center">
                              Arrastra o haz clic para adjuntar
                            </span>
                            <span className="text-[10px] text-slate-600 mt-1">JPG, PNG, WEBP — máx. 10 MB</span>
                          </label>
                        ) : (
                          <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                            <img src={producto.imagePreview} alt="Preview" className="w-full h-36 object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                              <span className="text-xs text-slate-300 font-medium truncate max-w-[160px]">
                                {producto.imageFile?.name || 'imagen.jpg'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleImageChange(null)}
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
            {productos.length > 0 && (
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
                              {p.imagePreview ? (
                                <img src={p.imagePreview} alt="mini" className="w-10 h-10 object-cover rounded-lg border border-slate-800 shrink-0" />
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
                          <td className="px-5 py-3 font-mono">{p.tamanoHorizontal} × {p.tamanoVertical} mm</td>
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
                              onClick={() => removeProduct(p.id)}
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
            )}
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
