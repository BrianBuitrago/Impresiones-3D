import Link from "next/link";
import { Printer, ShoppingCart, User } from "lucide-react";

export default function Navbar() {
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
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                Impresiones 3D
              </span>
            </Link>
          </div>

          {/* Links Principales */}
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Catálogo</Link>
            <Link href="/cotizar" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Cotizar Diseño</Link>
            <Link href="/nosotros" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">Nosotros</Link>
          </div>

          {/* Iconos de Acción */}
          <div className="flex items-center space-x-4">
            <button className="text-slate-300 hover:text-cyan-400 transition-colors p-2">
              <ShoppingCart className="w-5 h-5" />
            </button>
            <button className="text-slate-300 hover:text-cyan-400 transition-colors p-2">
              <User className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
