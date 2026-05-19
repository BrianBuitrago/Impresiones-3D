import Link from "next/link";
import { ArrowRight, Box, Cpu, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] flex items-center overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950"></div>
          {/* Aquí iría el Canvas 3D de React Three Fiber */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[80%] opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] hidden md:block"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold font-outfit text-white leading-tight mb-6">
              Tus ideas en <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">tres dimensiones</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 font-inter">
              Servicio profesional de impresión 3D en resina y filamento. 
              Alta precisión, envíos rápidos y el mejor catálogo de modelos listos para ti.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/cotizar" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg shadow-orange-500/25 flex items-center gap-2">
                Cotizar Diseño <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#catalogo" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-full font-medium transition-all border border-slate-700">
                Ver Catálogo
              </Link>
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

      {/* Catálogo Section (Placeholder) */}
      <section id="catalogo" className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Catálogo Destacado</h2>
              <p className="text-slate-400">Descubre nuestros modelos más populares listos para imprimir.</p>
            </div>
            <Link href="/catalogo" className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tarjeta de Producto 1 */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group cursor-pointer hover:border-cyan-500/50 transition-colors">
              <div className="aspect-square bg-slate-800 relative">
                {/* Imagen/3D Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  <Box className="w-12 h-12" />
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">Figura Articulada</h3>
                  <span className="text-orange-400 font-bold">$25</span>
                </div>
                <p className="text-sm text-slate-400 mb-4">Material: Resina ABS-like</p>
                <button className="w-full bg-slate-800 hover:bg-cyan-600 text-white py-2 rounded-lg font-medium transition-colors">
                  Añadir al Carrito
                </button>
              </div>
            </div>
            
            {/* Tarjeta de Producto 2 */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group cursor-pointer hover:border-cyan-500/50 transition-colors">
              <div className="aspect-square bg-slate-800 relative">
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  <Box className="w-12 h-12" />
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">Soporte Laptop</h3>
                  <span className="text-orange-400 font-bold">$15</span>
                </div>
                <p className="text-sm text-slate-400 mb-4">Material: PLA+</p>
                <button className="w-full bg-slate-800 hover:bg-cyan-600 text-white py-2 rounded-lg font-medium transition-colors">
                  Añadir al Carrito
                </button>
              </div>
            </div>

            {/* Tarjeta de Producto 3 */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group cursor-pointer hover:border-cyan-500/50 transition-colors">
              <div className="aspect-square bg-slate-800 relative">
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  <Box className="w-12 h-12" />
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">Maceta Geométrica</h3>
                  <span className="text-orange-400 font-bold">$30</span>
                </div>
                <p className="text-sm text-slate-400 mb-4">Material: PETG</p>
                <button className="w-full bg-slate-800 hover:bg-cyan-600 text-white py-2 rounded-lg font-medium transition-colors">
                  Añadir al Carrito
                </button>
              </div>
            </div>

            {/* Tarjeta de Producto 4 */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group cursor-pointer hover:border-cyan-500/50 transition-colors">
              <div className="aspect-square bg-slate-800 relative">
                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                  <Box className="w-12 h-12" />
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">Llavero Personalizado</h3>
                  <span className="text-orange-400 font-bold">$5</span>
                </div>
                <p className="text-sm text-slate-400 mb-4">Material: PLA</p>
                <button className="w-full bg-slate-800 hover:bg-cyan-600 text-white py-2 rounded-lg font-medium transition-colors">
                  Añadir al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
