'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, IdCard, Calendar, Award, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { user, registerWithEmail, loading } = useAuth();
  const router = useRouter();

  // Campos de registro
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [edad, setEdad] = useState<number | ''>('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones del cliente
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSubmitting(true);

    try {
      const userData = {
        nombre,
        cedula,
        edad: Number(edad),
        fecha_nacimiento: fechaNacimiento,
        telefono,
        email,
        password,
        confirm_password: confirmPassword
      };

      await registerWithEmail(userData);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-4 py-12 overflow-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl"
      >
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-cyan-500/5">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold font-sans tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-400">
              Crear tu Cuenta
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Regístrate y cotiza tus modelos 3D al instante
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Nombre Completo */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="nombre">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    id="nombre"
                    type="text"
                    required
                    placeholder="Juan Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Cédula */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="cedula">
                  Cédula
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <input
                    id="cedula"
                    type="text"
                    required
                    placeholder="1234567890"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Edad */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="edad">
                  Edad
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Award className="w-5 h-5" />
                  </div>
                  <input
                    id="edad"
                    type="number"
                    required
                    min="0"
                    placeholder="25"
                    value={edad}
                    onChange={(e) => setEdad(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Fecha Nacimiento */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="fecha_nacimiento">
                  Fecha de Nacimiento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    id="fecha_nacimiento"
                    type="date"
                    required
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="telefono">
                  Teléfono
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    id="telefono"
                    type="tel"
                    required
                    placeholder="0999999999"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="email">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="juan@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="confirm_password">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="confirm_password"
                    type="password"
                    required
                    placeholder="Confirmación"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 rounded-xl text-slate-200 placeholder-slate-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 mt-6 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/15 hover:shadow-cyan-500/25 transition-all cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Registrarse'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center text-sm text-slate-400">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
