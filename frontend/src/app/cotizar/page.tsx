'use client';

import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon,
  User,
  Phone,
  Mail,
  HelpCircle
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

export default function Cotizar() {
  const { user, profile } = useAuth();
  
  // Datos de contacto del cliente
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  
  // Lista de productos en la cotización
  const [productos, setProductos] = useState<ProductForm[]>([
    {
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
      imagePreview: null
    }
  ]);

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

  // Agregar nuevo producto
  const addProduct = () => {
    setProductos([
      ...productos,
      {
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
        imagePreview: null
      }
    ]);
  };

  // Remover producto
  const removeProduct = (id: string) => {
    if (productos.length > 1) {
      setProductos(productos.filter(p => p.id !== id));
    }
  };

  // Manejar cambios en campos simples de productos
  const handleProductChange = (id: string, field: keyof ProductForm, value: any) => {
    setProductos(
      productos.map(p => {
        if (p.id === id) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  // Manejar cambios en la selección múltiple de personalización
  const handlePersonalizacionChange = (id: string, value: string, checked: boolean) => {
    setProductos(
      productos.map(p => {
        if (p.id === id) {
          const current = [...p.personalizacion];
          if (checked) {
            if (!current.includes(value)) current.push(value);
          } else {
            const index = current.indexOf(value);
            if (index > -1) current.splice(index, 1);
          }
          return { ...p, personalizacion: current };
        }
        return p;
      })
    );
  };

  // Manejar subida/selección de imagen
  const handleImageChange = (id: string, file: File | null) => {
    if (!file) {
      setProductos(
        productos.map(p => {
          if (p.id === id) {
            return { ...p, imageFile: null, imagePreview: null };
          }
          return p;
        })
      );
      return;
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    // Crear preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductos(
        productos.map(p => {
          if (p.id === id) {
            return { ...p, imageFile: file, imagePreview: reader.result as string };
          }
          return p;
        })
      );
    };
    reader.readAsDataURL(file);
  };

  // Función para subir una imagen a Firebase Storage y retornar la URL
  const uploadImage = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `quotes/images/${Math.random().toString(36).substr(2, 9)}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // Enviar el formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones de contacto
    if (!nombre.trim() || !telefono.trim() || !email.trim()) {
      setError('Por favor completa todos los campos de contacto.');
      return;
    }

    // Validaciones de productos
    for (let i = 0; i < productos.length; i++) {
      const p = productos[i];
      if (!p.nombre.trim()) {
        setError(`Por favor ingresa el nombre del Producto #${i + 1}.`);
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
      if (p.unidades <= 0) {
        setError(`Las unidades del Producto #${i + 1} deben ser al menos 1.`);
        return;
      }
    }

    setLoading(true);

    try {
      // Subir imágenes y armar array de productos final
      const productosFinales = [];

      for (const p of productos) {
        let imageUrl = '';
        if (p.imageFile) {
          try {
            imageUrl = await uploadImage(p.imageFile);
          } catch (uploadErr) {
            console.error('Error al subir imagen a Storage, reintentando con base64:', uploadErr);
            // Fallback a base64 si falla Storage por reglas
            imageUrl = p.imagePreview || '';
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
          imagenUrl: imageUrl
        });
      }

      // Estructura de la cotización
      const quoteData = {
        cliente: {
          uid: profile?.uid || user?.uid || null,
          nombre,
          telefono,
          email
        },
        productos: productosFinales,
        estado: 'pendiente',
        creadoEn: new Date().toISOString(),
        porcentajeGanancia: 30, // Margen predeterminado de ganancia
        valorGananciaTotal: 0,
        precioTotalCotizacion: 0
      };

      // Guardar en Firestore
      const docRef = await addDoc(collection(db, 'quotes'), quoteData);
      
      setQuoteId(docRef.id);
      setSuccess(true);
      
      // Limpiar formulario
      setProductos([
        {
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
          imagePreview: null
        }
      ]);
    } catch (err: any) {
      console.error('Error al guardar cotización:', err);
      setError(err.message || 'Ocurrió un error al enviar tu cotización. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Decorative lights */}
        <div className="absolute inset-0 bg-slate-950 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)] -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center relative"
        >
          <div className="mx-auto w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          
          <h1 className="text-3xl font-bold font-outfit text-white mb-3">¡Cotización Recibida!</h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Hemos registrado tu solicitud exitosamente. Nuestro equipo revisará los detalles del diseño y te notificará por correo electrónico con los costos detallados de fabricación.
          </p>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 mb-8 text-left">
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider mb-1">Referencia de Cotización</span>
            <span className="text-lg font-mono text-cyan-400 font-bold select-all break-all">{quoteId}</span>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setSuccess(false)}
              className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Hacer otra Cotización
            </button>
            <a 
              href="/"
              className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700/80 text-center transition-all cursor-pointer"
            >
              Ir al Catálogo
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Radial Backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.07),transparent_50%)] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(239,68,68,0.03),transparent_50%)] -z-10" />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold font-outfit text-white leading-tight">Cotizar tu Diseño 3D</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Envíanos los detalles de tus piezas y fotos de referencia. Calcularemos los costos exactos basándonos en filamento, energía y personalización.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Alertas de error */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* TARJETA 1: Información de Contacto */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md relative shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">Información de Contacto</h2>
            </div>

            {profile && (
              <div className="mb-6 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-cyan-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Hemos precargado tus datos de perfil automáticamente. Puedes ajustarlos si lo requieres.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all" 
                    placeholder="Tu nombre completo" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Número de Teléfono</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input 
                    type="tel" 
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all" 
                    placeholder="Ej. +57 300 123 4567" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all" 
                    placeholder="tu@correo.com" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DINÁMICA DE PRODUCTOS */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Diseños / Productos a Cotizar</span>
                <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full font-semibold">{productos.length}</span>
              </h2>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-1.5 py-2 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-cyan-400 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Producto
              </button>
            </div>

            <AnimatePresence initial={false}>
              {productos.map((producto, index) => (
                <motion.div
                  key={producto.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md relative shadow-lg space-y-6"
                >
                  
                  {/* Tarjeta Header */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <span className="text-sm font-bold text-slate-400 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                      Detalle del Producto
                    </span>
                    
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

                  {/* Campos Fila 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre de la Pieza o Diseño</label>
                      <input 
                        type="text" 
                        required
                        value={producto.nombre}
                        onChange={(e) => handleProductChange(producto.id, 'nombre', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all" 
                        placeholder="Ej. Soporte para Laptop, Figura de Colección..." 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Unidades (Un.)</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={producto.unidades}
                        onChange={(e) => handleProductChange(producto.id, 'unidades', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all font-mono" 
                      />
                    </div>
                  </div>

                  {/* Campos Fila 2 (Tamaños) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tamaño Horizontal Máximo (mm)</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={producto.tamanoHorizontal}
                        onChange={(e) => handleProductChange(producto.id, 'tamanoHorizontal', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all font-mono" 
                        placeholder="Ancho / Diámetro en mm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tamaño Vertical Máximo (mm)</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={producto.tamanoVertical}
                        onChange={(e) => handleProductChange(producto.id, 'tamanoVertical', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all font-mono" 
                        placeholder="Alto en mm" 
                      />
                    </div>
                  </div>

                  {/* Accesorios y Personalización */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Accesorios Requeridos</label>
                      <textarea
                        value={producto.accesorios}
                        onChange={(e) => handleProductChange(producto.id, 'accesorios', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all resize-none" 
                        placeholder="Tornillería, resortes, imanes, etc. Déjalo en blanco si no requiere."
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Personalización del Acabado</label>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <label className="flex items-center gap-2.5 p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
                          <input 
                            type="checkbox"
                            checked={producto.personalizacion.includes('cosmeticos')}
                            onChange={(e) => handlePersonalizacionChange(producto.id, 'cosmeticos', e.target.checked)}
                            className="rounded text-cyan-500 focus:ring-cyan-500/20 bg-slate-950 border-slate-800 w-4 h-4"
                          />
                          <span className="text-xs text-slate-300">Cosméticos</span>
                        </label>
                        
                        <label className="flex items-center gap-2.5 p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
                          <input 
                            type="checkbox"
                            checked={producto.personalizacion.includes('pintura base')}
                            onChange={(e) => handlePersonalizacionChange(producto.id, 'pintura base', e.target.checked)}
                            className="rounded text-cyan-500 focus:ring-cyan-500/20 bg-slate-950 border-slate-800 w-4 h-4"
                          />
                          <span className="text-xs text-slate-300">Pintura base</span>
                        </label>

                        <label className="col-span-2 flex items-center gap-2.5 p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl cursor-pointer hover:bg-slate-950 transition-colors">
                          <input 
                            type="checkbox"
                            checked={producto.personalizacion.includes('otra')}
                            onChange={(e) => handlePersonalizacionChange(producto.id, 'otra', e.target.checked)}
                            className="rounded text-cyan-500 focus:ring-cyan-500/20 bg-slate-950 border-slate-800 w-4 h-4"
                          />
                          <span className="text-xs text-slate-300">Otra personalización</span>
                        </label>
                      </div>

                      {producto.personalizacion.includes('otra') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pt-1"
                        >
                          <input 
                            type="text"
                            required
                            value={producto.personalizacionOtraText}
                            onChange={(e) => handleProductChange(producto.id, 'personalizacionOtraText', e.target.value)}
                            placeholder="Especifica la personalización que deseas..."
                            className="w-full px-4 py-2 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-xs transition-all"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Empaque e Imagen */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Empaque Requerido</label>
                        <select
                          value={producto.empaque}
                          onChange={(e) => handleProductChange(producto.id, 'empaque', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500/50 text-sm transition-all cursor-pointer"
                        >
                          <option value="ninguno">Ninguno (Entrega básica)</option>
                          <option value="bolsa">Bolsa de embalaje</option>
                          <option value="caja">Caja de protección</option>
                          <option value="otra">Otro tipo de empaque</option>
                        </select>
                      </div>

                      {producto.empaque === 'otra' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <input 
                            type="text"
                            required
                            value={producto.empaqueOtraText}
                            onChange={(e) => handleProductChange(producto.id, 'empaqueOtraText', e.target.value)}
                            placeholder="Especifica el tipo de empaque..."
                            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-xs transition-all"
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Foto del producto */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Foto / Referencia Visual</label>
                      
                      {!producto.imagePreview ? (
                        <div className="relative border border-slate-800 hover:border-cyan-500/40 rounded-xl p-6 bg-slate-950/50 flex flex-col items-center justify-center transition-all cursor-pointer group">
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(producto.id, e.target.files ? e.target.files[0] : null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <Upload className="w-7 h-7 text-slate-500 group-hover:text-cyan-400 mb-2 transition-colors" />
                          <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors font-medium">Adjuntar imagen (JPG, PNG)</span>
                        </div>
                      ) : (
                        <div className="relative border border-slate-800 rounded-xl p-2 bg-slate-950/50 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-800 shrink-0 bg-slate-900">
                              <img src={producto.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs text-slate-300 font-medium truncate block max-w-[150px] md:max-w-[200px]">
                              {producto.imageFile?.name || 'imagen.jpg'}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleImageChange(producto.id, null)}
                            className="p-1.5 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer mr-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* BOTÓN DE ENVÍO */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Procesando Cotización...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Enviar Solicitud de Cotización ({productos.length} {productos.length === 1 ? 'producto' : 'productos'})</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
