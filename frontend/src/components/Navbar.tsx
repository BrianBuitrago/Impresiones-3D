'use client';

import Link from "next/link";
import { Printer, ShoppingCart, User, LogOut, ShieldAlert } from "lucide-react";
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
              <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                <Printer className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 font-sans">
                Impresiones 3D
              </span>
            </Link>
          </div>

          {/* Links Principales */}
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium text-sm">Catálogo</Link>
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
          <div className="flex items-center space-x-4">
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
