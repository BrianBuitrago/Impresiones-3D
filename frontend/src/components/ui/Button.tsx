import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Spinner from './Spinner';

/**
 * Botón reutilizable — para código NUEVO. No reemplaza los ~112 botones que
 * ya existen sueltos por el proyecto (cada uno con su propia combinación de
 * clases de Tailwind); migrarlos todos de una es un cambio grande y
 * cosmético que no se justificaba hacer de golpe. Las variantes de acá
 * calcan los estilos que ya se repiten más seguido en el código existente
 * (relevado antes de escribir esto), para que un botón nuevo con Button y
 * uno viejo con className a mano se vean iguales.
 */

export type ButtonVariant =
  | 'primary'       // bg-cyan-600 sólido — acción principal (Guardar, Agregar…)
  | 'success'       // bg-emerald-600 sólido — confirmar
  | 'danger'        // bg-red-600 sólido — destructivo, alto énfasis
  | 'success-soft'  // fondo emerald translúcido + borde — confirmar, énfasis medio (ej. "Aceptada")
  | 'danger-soft'   // fondo red translúcido + borde — eliminar, énfasis medio (el más común para "Eliminar")
  | 'secondary'     // bg-slate-800 + borde — Cancelar / acción secundaria
  | 'ghost';        // sin fondo, solo hover — botones de solo-ícono (cerrar, recargar…)

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-cyan-600 hover:bg-cyan-500 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  'success-soft': 'bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-400',
  'danger-soft': 'bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400',
  secondary: 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white',
};

// Variantes "sólidas" usan un spinner blanco al cargar (texto blanco sobre
// fondo de color); las demás usan un spinner del color de su texto.
const LOADING_SPINNER_COLOR: Record<ButtonVariant, 'white' | 'cyan' | 'red'> = {
  primary: 'white',
  success: 'white',
  danger: 'white',
  'success-soft': 'cyan',
  'danger-soft': 'red',
  secondary: 'cyan',
  ghost: 'cyan',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'py-1.5 px-3 text-xs gap-1.5',
  md: 'py-2.5 px-5 text-sm gap-2',
  lg: 'py-3 px-6 text-sm gap-2',
  icon: 'p-2 aspect-square gap-0',
};

const SPINNER_SIZE: Record<ButtonSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'sm',
  icon: 'sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra un Spinner en vez del ícono/contenido y deshabilita el botón. */
  loading?: boolean;
  /** Ícono (de lucide-react u otro) a la izquierda del texto. Para size="icon", es el único contenido. */
  icon?: ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = false,
    disabled,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-bold rounded-xl cursor-pointer',
        'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading ? (
        <Spinner size={SPINNER_SIZE[size]} color={LOADING_SPINNER_COLOR[variant]} />
      ) : (
        icon
      )}
      {size !== 'icon' && children}
    </button>
  );
});

export default Button;
