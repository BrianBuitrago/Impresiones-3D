import React from 'react';
import { Target, Award, Users } from 'lucide-react';

export default function Nosotros() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold font-outfit text-white mb-6 text-center">Sobre Nosotros</h1>
        <p className="text-lg text-slate-300 text-center mb-12 max-w-2xl mx-auto">
          Somos un equipo apasionado por la manufactura aditiva y el modelado 3D, comprometidos con hacer realidad tus proyectos más complejos con máxima fidelidad.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-sm">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Misión</h3>
            <p className="text-sm text-slate-400">Brindar un servicio accesible y profesional de impresión 3D a empresas, diseñadores y entusiastas de la tecnología.</p>
          </div>
          
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-sm">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Calidad</h3>
            <p className="text-sm text-slate-400">Utilizamos insumos premium y calibramos nuestras máquinas constantemente para garantizar resultados excepcionales.</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-sm">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Comunidad</h3>
            <p className="text-sm text-slate-400">Apoyamos a estudiantes y desarrolladores locales con asesoría gratuita en preparación de archivos 3D.</p>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Nuestra Tecnología</h2>
          <p className="text-slate-300 text-center leading-relaxed">
            Contamos con impresoras 3D de tecnología FDM para piezas robustas y de gran tamaño en filamentos como PLA+, PETG y ABS. Para miniaturas, prototipos dentales o joyas, disponemos de impresoras de resina LCD/SLA de resolución 8K de última generación, logrando texturas suaves y detalles microscópicos.
          </p>
        </div>
      </div>
    </div>
  );
}
