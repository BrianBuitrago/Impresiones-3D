export interface ProductForm {
  id: string;
  nombre: string;
  descripcionLineal: string;
  unidades: number;
  accesorios: string;
  personalizacion: string[];
  personalizacionOtraText: string;
  personalizacionComentarios: Record<string, string>;
  empaque: string;
  empaqueOtraText: string;
  imageFiles: Record<string, File | null>;
  imagePreviews: Record<string, string | null>;
  tiempoHoras: string;
  tiempoMinutos: string;
  pesoGramos: string;
}

export const newProduct = (): ProductForm => ({
  id: Math.random().toString(36).substr(2, 9),
  nombre: '',
  descripcionLineal: '',
  unidades: 1,
  accesorios: '',
  personalizacion: [],
  personalizacionOtraText: '',
  personalizacionComentarios: {},
  empaque: 'ninguno',
  empaqueOtraText: '',
  imageFiles: { frontal: null, lateral: null, trasera: null, diagonal: null },
  imagePreviews: { frontal: null, lateral: null, trasera: null, diagonal: null },
  tiempoHoras: '',
  tiempoMinutos: '',
  pesoGramos: '',
});

export const PERSONALIZACION_OPTIONS = [
  { value: 'pintura base', label: 'Pintura base',          emoji: '🎨' },
  { value: 'otra',         label: 'Otra personalización',  emoji: '⚙️' },
];

export const EMPAQUE_OPTIONS = [
  { value: 'ninguno', label: 'Sin empaque', desc: 'Entrega básica sin embalaje adicional' },
  { value: 'bolsa',   label: 'Bolsa',       desc: 'Bolsa de plástico o tela protectora'  },
  { value: 'caja',    label: 'Caja',        desc: 'Caja rígida de protección'             },
  { value: 'otra',    label: 'Otro tipo',   desc: 'Especifica el empaque que necesitas'  },
];

export const MAX_PRODUCTOS = 5;

export const validateProduct = (p: ProductForm, label = 'producto'): string | null => {
  if (!p.nombre.trim())                                            return `Ingresa el nombre del ${label}.`;
  if (p.unidades < 1)                                              return `Las unidades del ${label} deben ser al menos 1.`;
  if (p.tiempoHoras && parseFloat(p.tiempoHoras) < 0)            return `Las horas de impresión del ${label} no pueden ser negativas.`;
  if (p.tiempoMinutos && parseFloat(p.tiempoMinutos) < 0)        return `Los minutos de impresión del ${label} no pueden ser negativos.`;
  if (p.pesoGramos && parseFloat(p.pesoGramos) < 0)              return `El peso en gramos del ${label} no puede ser negativo.`;
  if (p.personalizacion.includes('otra') && !p.personalizacionOtraText.trim())
    return `Describe la personalización "Otra" del ${label}.`;
  if (p.empaque === 'otra' && !p.empaqueOtraText.trim())
    return `Describe el empaque "Otro" del ${label}.`;
  return null;
};
