'use client';

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Pencil } from "lucide-react";
import { useEditableSetting } from "@/hooks/useEditableSetting";
import { useLogo } from "@/hooks/useLogo";
import SettingsEditModal from "@/components/ui/SettingsEditModal";
import { FOOTER_SETTINGS_ID, FOOTER_DEFAULTS, FOOTER_FIELD_LABELS, type FooterData } from "@/types/footer";

export default function Footer() {
  const { isAdmin, data, editing, form, setForm, startEdit, cancelEdit, saveEdit } =
    useEditableSetting<FooterData>(FOOTER_SETTINGS_ID, FOOTER_DEFAULTS);
  const { logoUrl } = useLogo();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-12 pb-8 relative">
      {isAdmin && !editing && (
        <button onClick={startEdit} aria-label="Editar pie de página"
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white cursor-pointer transition-colors z-10">
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {isAdmin && editing && (
        <SettingsEditModal title="Editar Footer" onSave={saveEdit} onCancel={cancelEdit}>
          {(['tagline', 'direccion', 'email', 'copyright', 'tiktokUrl', 'facebookUrl', 'whatsappUrl'] as const).map(field => (
            <div key={field}>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">{FOOTER_FIELD_LABELS[field]}</label>
              <input type="text" value={form[field]} onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-sm outline-none focus:border-cyan-500/50" />
            </div>
          ))}
        </SettingsEditModal>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image src={logoUrl} alt="RepliCars3D" width={24} height={24} className="object-contain" />
              <span className="text-xl font-bold text-slate-100">RepliCars3D</span>
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
                <Mail className="w-4 h-4 text-cyan-500" />
                <span>{data.email}</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-200 font-semibold mb-4">Redes Sociales</h3>
            <ul className="space-y-3">
              <li>
                <a href={data.tiktokUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-cyan-500"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  TikTok
                </a>
              </li>
              <li>
                <a href={data.facebookUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-cyan-500"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
              </li>
              <li>
                <a href={data.whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-cyan-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
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