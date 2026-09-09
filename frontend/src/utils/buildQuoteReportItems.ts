import type { ReportItem } from '@/types/reportes';
import { calcProduct, type PricingContext } from './quotePricing';

export interface AssignConfig {
  assignMode: 'all' | 'perItem';
  assignAllUid: string;
  perItemAssignments: Record<number, string>;
  perItemEmpaqueAssignments: Record<number, string>;
  perItemPersonalizacionAssignments: Record<number, string>;
  perItemTrabajos: Record<number, Array<{ tempId: string; descripcion: string; valor: number; colaboradorUid: string }>>;
}

/**
 * Reparte los productos de una cotización aceptada entre colaboradores según
 * las asignaciones del modal de aceptación (AssignColaboradorDialog): un
 * item por producto (descontando lo que se paga aparte por empaque/
 * personalización), más un item por cada "trabajo" (sub-tarea) agregado a
 * mano. Pura — no llama a la API ni toca estado de React; el caller usa el
 * resultado para crear los reportes correspondientes.
 */
export function buildQuoteReportItems(
  selectedQuote: any,
  assignConfig: AssignConfig,
  pricingCtx: PricingContext,
): Map<string, ReportItem[]> {
  const {
    assignMode, assignAllUid, perItemAssignments,
    perItemEmpaqueAssignments, perItemPersonalizacionAssignments, perItemTrabajos,
  } = assignConfig;
  const itemsPorColaborador = new Map<string, ReportItem[]>();

  for (let idx = 0; idx < selectedQuote.productos.length; idx++) {
    const rawUid = assignMode === 'all' ? assignAllUid : (perItemAssignments[idx] || '');
    const uid = rawUid || '__sin_asignar__';
    const p = selectedQuote.productos[idx];
    const c = calcProduct(idx, p.unidades, pricingCtx);
    const nombreProducto = p.descripcionLineal || p.nombre || 'Producto';

    // Empaque/caja y personalización/pintura se pagan por separado (a quien
    // corresponda, o "sin asignar" si lo hizo el dueño) y se descuentan del
    // pago del producto completo para no pagarlos dos veces.
    const montoEmpaque = c.valorEmpaque * (p.unidades || 1);
    const montoPersonalizacion = c.valorPersonalizacion * (p.unidades || 1);
    let valorProducto = c.precioTotalProducto;

    if (montoEmpaque > 0) {
      const empaqueUid = perItemEmpaqueAssignments[idx] || '__sin_asignar__';
      const empaqueItem: ReportItem = {
        categoria: 'cajas',
        descripcion: `${nombreProducto} - Empaque`,
        cantidad: p.unidades || 1,
        valor: montoEmpaque,
        actividad: 'Empaque',
        clienteNombre: selectedQuote.cliente?.nombre || '',
        clienteTelefono: selectedQuote.cliente?.telefono || '',
        origen: 'web',
      };
      if (!itemsPorColaborador.has(empaqueUid)) itemsPorColaborador.set(empaqueUid, []);
      itemsPorColaborador.get(empaqueUid)!.push(empaqueItem);
      valorProducto -= montoEmpaque;
    }

    if (montoPersonalizacion > 0) {
      const personalizacionUid = perItemPersonalizacionAssignments[idx] || '__sin_asignar__';
      const personalizacionItem: ReportItem = {
        categoria: 'pintura',
        descripcion: `${nombreProducto} - Personalización/Pintura`,
        cantidad: p.unidades || 1,
        valor: montoPersonalizacion,
        actividad: 'Personalización/Pintura',
        clienteNombre: selectedQuote.cliente?.nombre || '',
        clienteTelefono: selectedQuote.cliente?.telefono || '',
        origen: 'web',
      };
      if (!itemsPorColaborador.has(personalizacionUid)) itemsPorColaborador.set(personalizacionUid, []);
      itemsPorColaborador.get(personalizacionUid)!.push(personalizacionItem);
      valorProducto -= montoPersonalizacion;
    }

    const item: ReportItem = {
      categoria: p.categoria || 'cotización-web',
      descripcion: nombreProducto,
      cantidad: p.unidades || 1,
      valor: valorProducto,
      actividad: 'Cotización web aceptada',
      clienteNombre: selectedQuote.cliente?.nombre || '',
      clienteTelefono: selectedQuote.cliente?.telefono || '',
      origen: 'web',
      productoDetalle: {
        nombre: p.nombre,
        pesoGramos: c.filamento,
        tiempoHoras: c.tiempoHoras,
        tiempoMinutos: c.tiempoMinutos,
        costoDiseno: c.costoDiseno,
        costoAccesorios: c.costoAccesorios,
        costoEmpaque: c.valorEmpaque,
        costoPersonalizacion: c.valorPersonalizacion,
        filamentoUsado: c.filamento,
        valorUnitario: c.precioTotalUnitario,
      },
    };
    if (!itemsPorColaborador.has(uid)) itemsPorColaborador.set(uid, []);
    itemsPorColaborador.get(uid)!.push(item);

    // Trabajos (sub-items) for this product
    const trabajos = perItemTrabajos[idx] || [];
    for (const t of trabajos) {
      if (!t.colaboradorUid || !t.descripcion.trim() || t.valor <= 0) continue;
      const trabajoItem: ReportItem = {
        categoria: p.categoria || 'cotización-web',
        descripcion: `${p.descripcionLineal || p.nombre || 'Producto'} - ${t.descripcion}`,
        cantidad: 1,
        valor: t.valor,
        actividad: t.descripcion,
        clienteNombre: selectedQuote.cliente?.nombre || '',
        clienteTelefono: selectedQuote.cliente?.telefono || '',
        origen: 'web',
      };
      if (!itemsPorColaborador.has(t.colaboradorUid)) itemsPorColaborador.set(t.colaboradorUid, []);
      itemsPorColaborador.get(t.colaboradorUid)!.push(trabajoItem);
    }
  }

  return itemsPorColaborador;
}
