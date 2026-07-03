'use client';

import Link from "next/link";
import { Printer, Mail, MapPin, Phone, Pencil, X, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

const SETTINGS_ID = 'footer';

interface FooterData {
  tagline: string;
  direccion: string;
  telefono: string;
  email: string;
  copyright: string;
}

const DEFAULTS: FooterData = {
  tagline: 'Materializamos tus ideas con precisión. Alta calidad en cada capa.',
  direccion: 'Ciudad, País',
  telefono: '+1 234 567 890',
  email: 'contacto@impresiones3d.com',
  copyright: 'Impresiones 3D. Todos los derechos reservados.',
};

export default function Footer() {
  const { profile } = useAuth();
  const isAdmin = profile?.rol === 'administrador';
  const [data, setData] = useState<FooterData>(DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FooterData>(DEFAULTS);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db!, 'settings', SETTINGS_ID));
        if (snap.exists()) setData(snap.data() as FooterData);
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

  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-12 pb-8 relative">
      {isAdmin && !editing && (
        <button onClick={startEdit}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-colors z-10">
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {isAdmin && editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">Editar Footer</h3>
            <div className="space-y-4">
              {(['tagline', 'direccion', 'telefono', 'email', 'copyright'] as const).map(field => (
                <div key={field}>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">{field}</label>
                  <input type="text" value={form[field]} onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-6 h-6 text-cyan-400" />
              <span className="text-xl font-bold text-slate-100">Impresiones 3D</span>
            </div>
            <p className="text-slate-400 text-sm">{data.tagline}</p>
          </div>
          <div>
            <h3 className="text-slate-200 font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><Link href="/catalogo" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Catálogo</Link></li>
              <li><Link href="/cotizar" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Cotizar Modelo</Link></li>
              <li><Link href="/materiales" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Materiales</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-200 font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2">
              <li><Link href="/faq" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Preguntas Frecuentes</Link></li>
              <li><Link href="/envios" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Políticas de Envío</Link></li>
              <li><Link href="/terminos" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Términos y Condiciones</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-200 font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 text-cyan-500" />
                <span>{data.direccion}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <Phone className="w-4 h-4 text-cyan-500" />
                <span>{data.telefono}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <Mail className="w-4 h-4 text-cyan-500" />
                <span>{data.email}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} {data.copyright}</p>
        </div>
      </div>
    </footer>
  );
}