import type { CalcEntry } from '@/app/admin/components/shared';

/** Todo lo que calcProduct necesita del estado del panel para calcular un producto. */
export interface PricingContext {
  calcValues: { [key: number]: CalcEntry };
  precioKwhHora: number;
  precioKwhMinuto: number;
  precioFilamentoKg: number;
}

const DEFAULT_CALC_ENTRY: CalcEntry = {
  tiempoHoras: '0',
  tiempoMinutos: '0',
  pesoGramos: '0',
  costoDiseno: '0',
  costoAccesorios: '0',
  costoEmpaque: '0',
  costoPersonalizado: '0',
  horasPostProcesado: '0',
  costoProcesado: '0',
  porcentajeImprevistos: '0',
  kwH: '0',
  kwMin: '0',
  ganancia: '30',
};

// ── Cálculos matemáticos por producto ─────────────────────────────────────
//
//  precioKwhMinuto   = constante propia (Precios), no derivada de precioKwhHora
//  costoEnergia/u    = duracion(min) × precioKwhMinuto
//  costoFilamento/u  = filamento(g)  × (precioFilamentoKg / 1000)
//  costoFabricacion/u= costoEnergia  + costoFilamento
//  precioConGanancia/u = costoFabricacion × (1 + ganancia/100)
//  precioTotal/u     = precioConGanancia + valorEmpaque + valorPersonalizacion
//  subtotalFabTotal  = precioConGanancia × unidades  (sin empaque ni personaliz.)
//  gananciaTotal     = (precioConGanancia - costoFabricacion) × unidades
//  precioTotal Prod  = precioTotal/u × unidades

export function calcProduct(idx: number, unidades: number, ctx: PricingContext) {
  const { calcValues, precioKwhHora, precioKwhMinuto, precioFilamentoKg } = ctx;
  const v = calcValues[idx] || DEFAULT_CALC_ENTRY;

  const tiempoHoras      = parseFloat(v.tiempoHoras) || 0;
  const tiempoMinutos    = parseFloat(v.tiempoMinutos) || 0;
  const duracion         = tiempoHoras * 60 + tiempoMinutos;
  const filamento        = parseFloat(v.pesoGramos) || 0;
  const costoDiseno      = parseFloat(v.costoDiseno) || 0;
  const costoAccesorios  = parseFloat(v.costoAccesorios) || 0;
  const valorEmpaque     = parseFloat(v.costoEmpaque) || 0;
  const valorPersonalizacion = parseFloat(v.costoPersonalizado) || 0;
  const horasProcesado   = parseFloat(v.horasPostProcesado) || 0;
  const costoProcesado   = parseFloat(v.costoProcesado) || 0;
  const imprevistos      = parseFloat(v.porcentajeImprevistos) || 0;
  const kwH              = parseFloat(v.kwH) || 0;
  const kwMin            = parseFloat(v.kwMin) || 0;
  const ganancia          = parseFloat(v.ganancia) || 0;

  // precioKwhMinuto viene del estado global (constante propia en Precios), no de precioKwhHora/60
  const costoEnergiaUnitario      = (kwH > 0 || kwMin > 0)
    ? (kwH * tiempoHoras + kwMin * tiempoMinutos / 60) * precioKwhHora
    : duracion * precioKwhMinuto;
  const costoFilamentoUnitario    = filamento * (precioFilamentoKg / 1000);
  // El subtotal de fabricación incluye empaque y personalización (igual que la hoja de cálculo
  // original del negocio), para que imprevistos y ganancia se apliquen también sobre esos costos.
  const costoFabricacionUnitario  = costoEnergiaUnitario + costoFilamentoUnitario + costoDiseno + costoAccesorios + costoProcesado + valorEmpaque + valorPersonalizacion;

  const valorImprevistos          = costoFabricacionUnitario * (imprevistos / 100);
  const baseConImprevistos        = costoFabricacionUnitario + valorImprevistos;
  const gananciaUnitaria          = baseConImprevistos * (ganancia / 100);

  const precioUnitario            = costoFabricacionUnitario + gananciaUnitaria;
  const precioTotalUnitario       = precioUnitario;

  const subtotalEnergia           = costoEnergiaUnitario * unidades;
  const subtotalMaterial          = costoFilamentoUnitario * unidades;
  const subtotalFabricacionTotal  = costoFabricacionUnitario * unidades;
  const gananciaTotal             = gananciaUnitaria * unidades;
  const precioTotalProducto       = precioTotalUnitario * unidades;

  return {
    tiempoHoras, tiempoMinutos, duracion, filamento, costoDiseno, costoAccesorios,
    valorEmpaque, valorPersonalizacion, ganancia,
    horasProcesado, costoProcesado, imprevistos, valorImprevistos,
    precioKwhMinuto,
    costoEnergiaUnitario,
    costoFilamentoUnitario,
    costoFabricacionUnitario,
    precioUnitario,
    precioConGananciaUnitario: precioUnitario,
    precioTotalUnitario,
    subtotalEnergia,
    subtotalMaterial,
    subtotalFabricacionTotal,
    gananciaTotal,
    precioTotalProducto,
  };
}

export function getQuoteTotals(selectedQuote: any, ctx: PricingContext) {
  if (!selectedQuote) return { subtotalFabricacion: 0, ganancia: 0, total: 0 };
  let subtotalFabricacion = 0, ganancia = 0, total = 0;
  selectedQuote.productos.forEach((p: any, idx: number) => {
    const c = calcProduct(idx, p.unidades, ctx);
    subtotalFabricacion += c.subtotalFabricacionTotal;
    ganancia            += c.gananciaTotal;
    total               += c.precioTotalProducto;
  });
  return { subtotalFabricacion, ganancia, total };
}

// Recalcula todos los campos de precio de un producto de la cotización a partir de calcProduct
export function mapProductoConCalculo(p: any, idx: number, ctx: PricingContext) {
  const c = calcProduct(idx, p.unidades, ctx);
  const { precioKwhHora, precioFilamentoKg } = ctx;
  return {
    ...p,
    idProducto: p.idProducto || `PROD-${String(idx + 1).padStart(3, '0')}`,
    descripcionLineal: p.descripcionLineal || p.nombre,
    tiempoHoras: c.tiempoHoras,
    tiempoMinutos: c.tiempoMinutos,
    pesoGramos: c.filamento,
    costoDisenoUnitario: c.costoDiseno,
    costoAccesoriosUnitario: c.costoAccesorios,
    duracionImpresionUnidad: c.duracion,
    filamentoUsadoUnidad: c.filamento,
    valorEmpaqueUnitario: c.valorEmpaque,
    valorPersonalizacionUnitario: c.valorPersonalizacion,
    horasPostProcesado: c.horasProcesado,
    costoProcesado: c.costoProcesado,
    porcentajeImprevistos: c.imprevistos,
    valorImprevistos: Math.round(c.valorImprevistos * 100) / 100,
    porcentajeGanancia: c.ganancia,
    precioKwhHora,
    precioKwhMinuto: Math.round(c.precioKwhMinuto * 100) / 100,
    precioFilamentoKg,
    precioFilamentoGramo: Math.round((precioFilamentoKg / 1000) * 100) / 100,
    costoFabricacionUnitario: Math.round(c.costoFabricacionUnitario * 100) / 100,
    precioUnitario: Math.round(c.precioUnitario * 100) / 100,
    precioConGananciaUnitario: Math.round(c.precioConGananciaUnitario * 100) / 100,
    precioTotalUnitario: Math.round(c.precioTotalUnitario * 100) / 100,
    subtotalFabricacionTotal: Math.round(c.subtotalFabricacionTotal * 100) / 100,
    gananciaTotal: Math.round(c.gananciaTotal * 100) / 100,
    precioTotal: Math.round(c.precioTotalProducto * 100) / 100,
    subtotalEnergia: Math.round(c.subtotalEnergia * 100) / 100,
    subtotalMaterial: Math.round(c.subtotalMaterial * 100) / 100,
    precioLinealTotal: Math.round(c.precioTotalProducto * 100) / 100,
  };
}
