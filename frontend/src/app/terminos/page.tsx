import React from 'react';
import { FileText } from 'lucide-react';

export default function Terminos() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl font-bold font-outfit text-white">Términos y Condiciones</h1>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
          <p>
            Bienvenido a Impresiones 3D. Al utilizar nuestros servicios de impresión 3D o adquirir productos de nuestro catálogo, aceptas regirte por los siguientes términos y condiciones.
          </p>

          <h3 className="text-lg font-semibold text-white mt-8 mb-2">1. Propiedad Intelectual</h3>
          <p>
            El cliente declara poseer los derechos de propiedad intelectual o contar con las licencias correspondientes para cualquier modelo 3D enviado para cotización y posterior impresión. No asumimos responsabilidad alguna por violaciones de derechos de autor de terceros derivadas de archivos proporcionados por el cliente.
          </p>

          <h3 className="text-lg font-semibold text-white mt-8 mb-2">2. Tolerancia e Imprecisiones</h3>
          <p>
            La manufactura aditiva (impresión 3D) tiene márgenes de tolerancia geométrica inherentes a la tecnología. Pequeñas desviaciones en dimensiones (comúnmente ±0.2% o ±0.2mm) o detalles superficiales mínimos no son considerados defectos de fábrica, sino parte del proceso de manufactura.
          </p>

          <h3 className="text-lg font-semibold text-white mt-8 mb-2">3. Cancelación y Reembolsos</h3>
          <p>
            Debido a la naturaleza personalizada de la impresión 3D bajo demanda, una vez iniciado el proceso de impresión de tus piezas, no se aceptarán cancelaciones ni reembolsos, a menos que el producto presente fallas graves de adherencia, fisuras estructurales evidentes o roturas derivadas del envío.
          </p>
        </div>
      </div>
    </div>
  );
}
