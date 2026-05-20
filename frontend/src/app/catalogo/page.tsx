import React from 'react';
import { Box, ShoppingCart } from 'lucide-react';

export default function Catalogo() {
  const products = [
    { name: 'Figura Articulada', price: '$25', material: 'Resina ABS-like' },
    { name: 'Soporte Laptop', price: '$15', material: 'PLA+' },
    { name: 'Maceta Geométrica', price: '$30', material: 'PETG' },
    { name: 'Llavero Personalizado', price: '$5', material: 'PLA' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold font-outfit text-white mb-4">Catálogo Completo</h1>
        <p className="text-slate-400 mb-12 max-w-xl">Encuentra una variedad de modelos prediseñados listos para imprimir en el material y color de tu elección.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod, idx) => (
            <div key={idx} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 group cursor-pointer hover:border-cyan-500/50 transition-colors">
              <div className="aspect-square bg-slate-800 relative flex items-center justify-center">
                <Box className="w-12 h-12 text-slate-600" />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{prod.name}</h3>
                  <span className="text-orange-400 font-bold">{prod.price}</span>
                </div>
                <p className="text-sm text-slate-400 mb-4">Material: {prod.material}</p>
                <button className="w-full bg-slate-800 hover:bg-cyan-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Añadir al Carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
