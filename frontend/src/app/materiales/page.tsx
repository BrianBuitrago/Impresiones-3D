import React from 'react';
import { Box, CheckCircle } from 'lucide-react';

export default function Materiales() {
  const materials = [
    {
      name: 'PLA+ (Ácido Poliláctico)',
      description: 'El material más popular para impresión FDM. Derivado del almidón de maíz, ecológico y biodegradable bajo condiciones industriales.',
      pros: ['Alta facilidad de impresión', 'Buena resistencia mecánica', 'Bajo costo', 'Gran variedad de colores'],
      use: 'Prototipos visuales, soportes no industriales, figuras, organizadores.',
    },
    {
      name: 'Resina ABS-Like (SLA/LCD)',
      description: 'Material líquido fotosensible curado por luz ultravioleta. Ofrece detalles y acabados de nivel microscópico, imitando al plástico ABS.',
      pros: ['Detalle ultra preciso (capas de 0.05mm)', 'Superficie lisa sin líneas de capa', 'Excelente para miniaturas'],
      use: 'Miniaturas para juegos de rol, joyería, prototipos dentales, piezas de ingeniería con alta tolerancia.',
    },
    {
      name: 'PETG (Tereftalato de Polietileno Glicol)',
      description: 'Combina la facilidad del PLA con la alta resistencia del ABS. Es apto para contacto alimenticio y resistente al agua y químicos.',
      pros: ['Resistencia al impacto superior', 'Impermeable', 'Estabilidad térmica frente al sol'],
      use: 'Piezas funcionales expuestas a la intemperie, botellas, piezas mecánicas de mediana carga.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold font-outfit text-white mb-4 text-center">Nuestros Materiales</h1>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">Conoce las propiedades de los insumos que utilizamos para imprimir tus piezas y elige el ideal para tu proyecto.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {materials.map((mat, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="p-3 bg-cyan-500/10 w-fit rounded-xl mb-6">
                  <Box className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{mat.name}</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">{mat.description}</p>
                
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Ventajas:</h4>
                <ul className="space-y-2 mb-6">
                  {mat.pros.map((pro, pIdx) => (
                    <li key={pIdx} className="text-xs text-slate-300 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-800/80">
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Uso recomendado:</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{mat.use}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
