import React from 'react';
import { Truck, Calendar } from 'lucide-react';

export default function Envios() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold font-outfit text-white mb-4 text-center">Políticas de Envíos</h1>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">Información detallada sobre métodos de entrega, plazos y cobertura de distribución.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">Métodos de Envío</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Trabajamos con las principales agencias de encomiendas del país para garantizar entregas rápidas y seguras. Todos los paquetes se envían protegidos contra golpes.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">Plazos de Entrega</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Una vez finalizada la impresión (normalmente 24-48 horas), el envío terrestre tarda entre 1 a 3 días hábiles en llegar a tu domicilio o sucursal seleccionada.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/25 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Seguimiento de Pedidos</h3>
          <p className="text-sm text-slate-300 text-center leading-relaxed max-w-2xl mx-auto">
            Tan pronto como tu paquete sea entregado a la transportadora, te enviaremos un correo electrónico con el número de guía e instrucciones para que puedas rastrear su estado en tiempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
