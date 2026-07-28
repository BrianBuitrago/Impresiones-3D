'use client';

import React, { useEffect, useState } from 'react';
import { Target, Award, Users, Pencil, X, Check, Eye, Lightbulb } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

const SETTINGS_ID = 'nosotros';

interface NosotrosData {
  headerTitulo: string;
  headerSubtitulo: string;
  misionTitulo: string;
  misionTexto: string;
  visionTitulo: string;
  visionTexto: string;
  calidadTitulo: string;
  calidadTexto: string;
  comunidadTitulo: string;
  comunidadTexto: string;
  tecnologiaTitulo: string;
  tecnologiaTexto: string;
}

const DEFAULTS: NosotrosData = {
  headerTitulo: 'Sobre Nosotros',
  headerSubtitulo: 'Somos un equipo apasionado por la manufactura aditiva y el modelado 3D, comprometidos con hacer realidad tus proyectos más complejos con máxima fidelidad.',
  misionTitulo: 'Misión',
  misionTexto: 'Brindar un servicio accesible y profesional de impresión 3D a empresas, diseñadores y entusiastas de la tecnología.',
  visionTitulo: 'Visión',
  visionTexto: 'Ser referentes en la industria de manufactura aditiva en Colombia, innovando constantemente para ofrecer soluciones de impresión 3D de clase mundial.',
  calidadTitulo: 'Calidad',
  calidadTexto: 'Utilizamos insumos premium y calibramos nuestras máquinas constantemente para garantizar resultados excepcionales.',
  comunidadTitulo: 'Comunidad',
  comunidadTexto: 'Apoyamos a estudiantes y desarrolladores locales con asesoría gratuita en preparación de archivos 3D.',
  tecnologiaTitulo: 'Nuestra Tecnología',
  tecnologiaTexto: 'Contamos con impresoras 3D de tecnología FDM para piezas robustas y de gran tamaño en filamentos como PLA+, PETG y ABS. Para miniaturas, prototipos dentales o joyas, disponemos de impresoras de resina LCD/SLA de resolución 8K de última generación, logrando texturas suaves y detalles microscópicos.',
};

export default function Nosotros() {
  const { profile } = useAuth();
  const isAdmin = profile?.rol === 'administrador';
  const [data, setData] = useState<NosotrosData>(DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<NosotrosData>(DEFAULTS);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db!, 'settings', SETTINGS_ID));
        if (snap.exists()) setData(snap.data() as NosotrosData);
      } catch { /* usa defaults */ }
    })();
  }, []);

  const startEdit = () => { setForm({ ...data }); setEditing(true); };
  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    try {
      await setDoc(doc(db!, 'settings', SETTINGS_ID), form);
      setData({ ...form });
      setEditing(false);
    } catch { /* error */ }
  };

  const fields: { key: keyof NosotrosData; label: string; multiline?: boolean }[] = [
    { key: 'headerTitulo', label: 'Header Título' },
    { key: 'headerSubtitulo', label: 'Header Subtítulo', multiline: true },
    { key: 'misionTitulo', label: 'Misión Título' },
    { key: 'misionTexto', label: 'Misión Texto', multiline: true },
    { key: 'visionTitulo', label: 'Visión Título' },
    { key: 'visionTexto', label: 'Visión Texto', multiline: true },
    { key: 'calidadTitulo', label: 'Calidad Título' },
    { key: 'calidadTexto', label: 'Calidad Texto', multiline: true },
    { key: 'comunidadTitulo', label: 'Comunidad Título' },
    { key: 'comunidadTexto', label: 'Comunidad Texto', multiline: true },
    { key: 'tecnologiaTitulo', label: 'Tecnología Título' },
    { key: 'tecnologiaTexto', label: 'Tecnología Texto', multiline: true },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8 relative">
      {isAdmin && !editing && (
        <button onClick={startEdit}
          className="fixed top-24 right-4 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-colors z-10">
          <Pencil className="w-4 h-4" />
        </button>
      )}

      {isAdmin && editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">Editar Nosotros</h3>
            <div className="space-y-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">{f.label}</label>
                  {f.multiline ? (
                    <textarea value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50 resize-none" rows={3} />
                  ) : (
                    <input type="text" value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" /> Guardar
              </button>
              <button onClick={cancelEdit} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold font-outfit text-white mb-6 text-center">{data.headerTitulo}</h1>
        <p className="text-lg text-slate-300 text-center mb-12 max-w-2xl mx-auto">
          {data.headerSubtitulo}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-sm">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{data.misionTitulo}</h3>
            <p className="text-sm text-slate-400">{data.misionTexto}</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-sm">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{data.visionTitulo}</h3>
            <p className="text-sm text-slate-400">{data.visionTexto}</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-sm">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{data.calidadTitulo}</h3>
            <p className="text-sm text-slate-400">{data.calidadTexto}</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-sm">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{data.comunidadTitulo}</h3>
            <p className="text-sm text-slate-400">{data.comunidadTexto}</p>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4 text-center">{data.tecnologiaTitulo}</h2>
          <p className="text-slate-300 text-center leading-relaxed">
            {data.tecnologiaTexto}
          </p>
        </div>
      </div>
    </div>
  );
}