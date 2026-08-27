'use client';

import { useEffect, useRef, useState } from 'react';
import { User, Phone, Mail, Info, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/context/AuthContext';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, type CountryCode } from '../countryCodes';

const flagUrl = (iso2: string) => `https://flagcdn.com/24x18/${iso2}.png`;

interface ContactoFormProps {
  profile: UserProfile | null;
  nombre: string;
  setNombre: (v: string) => void;
  telefono: string;
  setTelefono: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  notasCotizacion: string;
  setNotasCotizacion: (v: string) => void;
}

export default function ContactoForm({
  profile,
  nombre, setNombre,
  telefono, setTelefono,
  email, setEmail,
  notasCotizacion, setNotasCotizacion,
}: ContactoFormProps) {
  // El teléfono se maneja como código de país + número local, pero hacia afuera
  // sigue siendo un solo string ("telefono") como siempre esperó el resto del form.
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [localNumber, setLocalNumber] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!telefono) { setLocalNumber(''); return; }
    const match = COUNTRY_CODES.find(c => telefono.startsWith(c.code));
    if (match) {
      setCountryCode(match.code);
      setLocalNumber(telefono.slice(match.code.length).trim());
    } else {
      setLocalNumber(telefono);
    }
  }, [telefono]);

  // Cierra el desplegable de país al hacer clic afuera
  useEffect(() => {
    if (!countryOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [countryOpen]);

  const updateTelefono = (code: string, local: string) => {
    setTelefono(local.trim() ? `${code} ${local.trim()}` : '');
  };

  const selectedCountry: CountryCode = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  return (
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
          <div className="flex gap-2">
            <div className="relative shrink-0" ref={countryRef}>
              <button
                type="button"
                onClick={() => setCountryOpen(v => !v)}
                aria-label="Código de país"
                aria-expanded={countryOpen}
                className="flex items-center gap-1.5 h-full px-2.5 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 text-sm outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 cursor-pointer transition-all"
              >
                <img src={flagUrl(selectedCountry.iso2)} alt="" width={20} height={15} className="rounded-sm shrink-0" />
                <span>{selectedCountry.code}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {countryOpen && (
                <div className="absolute z-20 top-full left-0 mt-1.5 w-64 max-h-72 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1.5">
                  {COUNTRY_CODES.map(c => (
                    <button
                      key={c.code + c.country}
                      type="button"
                      onClick={() => {
                        setCountryCode(c.code);
                        updateTelefono(c.code, localNumber);
                        setCountryOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm cursor-pointer transition-colors ${
                        c.code === countryCode ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <img src={flagUrl(c.iso2)} alt="" width={20} height={15} className="rounded-sm shrink-0" />
                      <span className="flex-1 truncate">{c.country}</span>
                      <span className="text-slate-500 text-xs">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="tel"
                value={localNumber}
                onChange={e => { setLocalNumber(e.target.value); updateTelefono(countryCode, e.target.value); }}
                required
                placeholder="300 123 4567"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 text-sm transition-all"
              />
            </div>
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
  );
}
