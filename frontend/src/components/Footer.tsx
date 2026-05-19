import Link from "next/link";
import { Printer, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Marca */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-6 h-6 text-cyan-400" />
              <span className="text-xl font-bold text-slate-100">Impresiones 3D</span>
            </div>
            <p className="text-slate-400 text-sm">
              Materializamos tus ideas con precisión. Alta calidad en cada capa.
            </p>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Catálogo</Link></li>
              <li><Link href="/cotizar" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Cotizar Modelo</Link></li>
              <li><Link href="/materiales" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Materiales</Link></li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2">
              <li><Link href="/faq" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Preguntas Frecuentes</Link></li>
              <li><Link href="/envios" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Políticas de Envío</Link></li>
              <li><Link href="/terminos" className="text-slate-400 hover:text-cyan-400 text-sm transition-colors">Términos y Condiciones</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-slate-200 font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 text-cyan-500" />
                <span>Ciudad, País</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <Phone className="w-4 h-4 text-cyan-500" />
                <span>+1 234 567 890</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 text-sm">
                <Mail className="w-4 h-4 text-cyan-500" />
                <span>contacto@impresiones3d.com</span>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Impresiones 3D. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
