'use client';

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, User, LogOut, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-1 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                <Image src="/logo.png" alt="Impresiones 3D" width={28} height={28} className="object-contain" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 font-sans">
                Impresiones 3D
              </span>
            </Link>
          </div>

          {/* Links Principales */}
          <div className="hidden md:flex space-x-8">
            <Link href="/catalogo" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium text-sm">Catálogo</Link>
            <Link href="/cotizar" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium text-sm">Cotizar Diseño</Link>
            <Link href="/nosotros" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium text-sm">Nosotros</Link>
            {(profile?.rol === 'administrador' || profile?.rol === 'colaborador') && (
              <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors font-medium text-sm flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                Panel Admin
              </Link>
            )}
          </div>

          {/* Iconos de Acción / Auth */}
          <div className="flex items-center space-x-3">
            {/* Redes Sociales */}
            <div className="hidden md:flex items-center gap-2 pr-3 border-r border-slate-800">
              <a href="https://www.tiktok.com/@3dprints881" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors" title="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
              <a href="https://facebook.com/3DPrints" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors" title="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://wa.me/573212805755" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors" title="WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
            <button className="text-slate-300 hover:text-cyan-400 transition-colors p-2 cursor-pointer">
              <ShoppingCart className="w-5 h-5" />
            </button>

            {user ? (
              // Menú desplegable para usuario logueado
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors p-2 text-sm font-medium border border-slate-800 rounded-xl bg-slate-950/40 px-3 cursor-pointer"
                >
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="max-w-[100px] truncate">{profile?.nombre || user.displayName || 'Usuario'}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-500">Rol asignado</p>
                      <p className="text-sm font-semibold capitalize text-cyan-400">{profile?.rol || 'Cliente'}</p>
                    </div>
                    {(profile?.rol === 'administrador' || profile?.rol === 'colaborador') && (
                      <Link 
                        href="/admin" 
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        Panel de Administración
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Botón de Iniciar Sesión para invitados
              <Link 
                href="/login" 
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 transition-all"
              >
                <User className="w-4 h-4" />
                Ingresar
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
