'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const faqs = [
    {
      q: '¿Qué formatos de archivo aceptan para cotizaciones?',
      a: 'Aceptamos principalmente archivos .STL, .OBJ y .3MF. Si tienes un archivo CAD como .STEP, .IGES o .F3D, también podemos procesarlo y convertirlo.',
    },
    {
      q: '¿Cuál es la diferencia entre impresión FDM y de Resina (SLA)?',
      a: 'La tecnología FDM usa filamento de plástico fundido capa por capa; es ideal para piezas resistentes, funcionales y de gran tamaño. La tecnología de Resina usa luz UV para curar resina líquida; es ideal para miniaturas, joyería u objetos con detalles minúsculos y superficies extremadamente lisas.',
    },
    {
      q: '¿Cuánto tiempo tarda en estar lista mi impresión?',
      a: 'El tiempo promedio de producción es de 24 a 48 horas para piezas pequeñas o medianas. Para pedidos por volumen o piezas gigantescas que requieran múltiples días de impresión continua, te informaremos del tiempo estimado en tu cotización.',
    },
    {
      q: '¿Hacen envíos a todo el país?',
      a: 'Sí, realizamos envíos nacionales asegurados a través de las principales transportadoras. El costo se calcula según la dirección de entrega.',
    },
    {
      q: '¿Tienen garantía si la pieza se rompe en el envío?',
      a: 'Absolutamente. Empacamos todas nuestras piezas con abundante plástico de burbujas y empaques rígidos. Si tu pieza llega dañada debido al transporte, contáctanos en las primeras 24 horas de haberla recibido adjuntando una foto del paquete y te la volveremos a imprimir sin costo adicional.',
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <HelpCircle className="w-8 h-8 text-cyan-400" />
          <h1 className="text-4xl font-bold font-outfit text-white">Preguntas Frecuentes</h1>
        </div>
        <p className="text-slate-400 text-center mb-12">Encuentra respuestas rápidas sobre nuestros servicios, tiempos de entrega y especificaciones técnicas.</p>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
              <button 
                onClick={() => toggle(idx)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-slate-900/60 transition-colors"
              >
                <span className="font-semibold text-white pr-4">{faq.q}</span>
                {openIdx === idx ? <ChevronUp className="w-5 h-5 text-cyan-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />}
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-slate-800/50 pt-4 bg-slate-950/20">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
