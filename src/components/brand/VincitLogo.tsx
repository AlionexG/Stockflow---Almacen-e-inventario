import React from 'react';
import { VincitEmblem } from './VincitEmblem';

interface VincitLogoProps {
  layout?: 'horizontal' | 'vertical' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

/**
 * Logotipo oficial de Vincit Omnia - Accesorios y Más.
 * Reproduce fielmente la identidad corporativa subida por el usuario
 * con tipografía dorada con espaciado amplio y refinado.
 */
export const VincitLogo: React.FC<VincitLogoProps> = ({
  layout = 'horizontal',
  size = 'md',
  showSubtitle = true,
  className = '',
  theme = 'auto',
}) => {
  const emblemSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  };

  const titleSizes = {
    sm: 'text-xs tracking-[0.2em]',
    md: 'text-sm tracking-[0.24em]',
    lg: 'text-xl tracking-[0.28em]',
    xl: 'text-2xl sm:text-3xl tracking-[0.32em]',
  };

  const subSizes = {
    sm: 'text-[8px] tracking-[0.25em]',
    md: 'text-[9px] tracking-[0.32em]',
    lg: 'text-[11px] tracking-[0.38em]',
    xl: 'text-xs tracking-[0.45em]',
  };

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <div className="relative mb-2">
          <VincitEmblem className={emblemSizes[size]} />
        </div>

        <div className="flex flex-col items-center">
          <h1
            className={`font-serif uppercase font-medium bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-xs ${titleSizes[size]}`}
            style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
          >
            VINCIT OMNIA
          </h1>

          {showSubtitle && (
            <p
              className={`font-sans uppercase font-medium text-amber-500/90 dark:text-amber-400/90 mt-1 ${subSizes[size]}`}
              style={{ letterSpacing: '0.35em' }}
            >
              ACCESORIOS Y MÁS
            </p>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <VincitEmblem className={emblemSizes[size]} />
        <span
          className={`font-serif uppercase font-semibold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent ${titleSizes[size]}`}
          style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
        >
          VINCIT OMNIA
        </span>
      </div>
    );
  }

  // Horizontal layout (Default, ideal for Navbar and Headers)
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div className="relative shrink-0">
        <VincitEmblem className={emblemSizes[size]} />
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span
            className={`font-serif uppercase font-semibold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent leading-tight drop-shadow-xs ${titleSizes[size]}`}
            style={{ fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif" }}
          >
            VINCIT OMNIA
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`font-sans uppercase font-semibold text-amber-600 dark:text-amber-400 leading-none mt-0.5 ${subSizes[size]}`}
            style={{ letterSpacing: '0.28em' }}
          >
            ACCESORIOS Y MÁS
          </span>
        )}
      </div>
    </div>
  );
};
