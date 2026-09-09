export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type SpinnerColor = 'cyan' | 'white' | 'red';

// Mismo look que ya se repetía suelto en ~15 archivos (anillo tenue del color +
// borde superior sólido, girando). Antes había variaciones menores de opacidad
// del anillo (/20 vs /30) según el archivo; acá quedan unificadas en /20.
const SIZE_CLASSES: Record<SpinnerSize, string> = {
  xs: 'w-3.5 h-3.5 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-6 h-6 border-2',
  xl: 'w-8 h-8 border-[3px]',
  '2xl': 'w-10 h-10 border-4',
};

const COLOR_CLASSES: Record<SpinnerColor, string> = {
  cyan: 'border-cyan-500/20 border-t-cyan-500',
  white: 'border-white/20 border-t-white',
  red: 'border-red-500/20 border-t-red-500',
};

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
}

export default function Spinner({ size = 'sm', color = 'cyan', className = '' }: SpinnerProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} ${COLOR_CLASSES[color]} rounded-full animate-spin ${className}`.trim()}
      role="status"
      aria-label="Cargando"
    />
  );
}
