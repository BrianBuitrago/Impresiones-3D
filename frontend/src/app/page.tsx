import Link from "next/link";
import { ArrowRight, Box, Cpu, ShieldCheck } from "lucide-react";
import Hero3D from "@/components/Hero3D";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex items-center overflow-hidden py-12 md:py-0">
        {/* Fondo decorativo con gradiente */}
        <div className="absolute inset-0 bg-slate-950 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950 to-slate-950"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Texto y Botones (Columna izquierda) */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-outfit text-white leading-tight mb-6">
                Tus ideas en <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  tres dimensiones
                </span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 font-inter leading-relaxed max-w-xl">
                Servicio profesional de impresión 3D en resina y filamento. 
                Alta precisión, envíos rápidos y el mejor catálogo de modelos listos para ti.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/cotizar" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-8 py-4 rounded-full font-medium transition-all shadow-lg shadow-orange-500/25 flex items-center gap-2"
                >
                  Cotizar Diseño <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  href="/catalogo" 
                  className="bg-slate-800/80 hover:bg-slate-700 text-white px-8 py-4 rounded-full font-medium transition-all border border-slate-700 backdrop-blur-sm"
                >
                  Ver Catálogo
                </Link>
              </div>
            </div>

            {/* Visualizador 3D Interactivo (Columna derecha) */}
            <div className="lg:col-span-5 w-full h-[350px] sm:h-[450px] lg:h-[500px] relative bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-md overflow-hidden shadow-2xl shadow-cyan-500/5">
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs text-cyan-400 font-medium font-inter">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Interactúa con el modelo 3D
              </div>
              <Hero3D />
            </div>

          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-20 bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6">
                <Box className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Alta Precisión</h3>
              <p className="text-slate-400">Modelos detallados con tolerancias mínimas utilizando la mejor resina y filamento PLA del mercado.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Garantía de Calidad</h3>
              <p className="text-slate-400">Si tu pieza presenta defectos de impresión, te la volvemos a imprimir sin costo adicional.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6">
                <Cpu className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Diseño a Medida</h3>
              <p className="text-slate-400">¿No tienes el modelo 3D? Nuestro equipo de ingenieros y diseñadores lo modelan por ti.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo Destacado */}
      <section className="py-24 bg-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Catálogo Destacado</h2>
              <p className="text-slate-400">Descubre nuestros modelos más populares listos para imprimir.</p>
            </div>
            <Link href="/catalogo" className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 flex-shrink-0">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            <div className="flex gap-6 flex-shrink-0">
              {[
                { nombre: "Figura Articulada", material: "Resina ABS-like" },
                { nombre: "Soporte Laptop", material: "PLA+" },
                { nombre: "Maceta Geométrica", material: "PETG" },
                { nombre: "Llavero Personalizado", material: "PLA" },
                { nombre: "Caja Organizadora", material: "PLA+" },
                { nombre: "Miniatura Dragón", material: "Resina Estándar" },
                { nombre: "Portalápices", material: "PETG" },
                { nombre: "Máscara Decorativa", material: "PLA" },
                { nombre: "Base Monitor", material: "PLA+" },
                { nombre: "Lámpara LED", material: "PETG" },
              ].map((producto, i) => (
                <div key={i} className="w-64 flex-shrink-0 snap-start bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group cursor-pointer hover:border-cyan-500/50 transition-colors">
                  <div className="aspect-square bg-slate-800 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                      <Box className="w-12 h-12" />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">{producto.nombre}</h3>
                    <p className="text-sm text-slate-400 mb-4">Material: {producto.material}</p>
                    <Link
                      href="/cotizar"
                      className="block w-full text-center bg-slate-800 hover:bg-cyan-600 text-white py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Solicitar Cotización
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
