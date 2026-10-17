import React, { useState } from 'react';

interface VincitEmblemProps {
  className?: string;
  size?: number | string;
  variant?: 'gold' | 'monochrome' | 'dark';
  customLogoUrl?: string;
  customLogoType?: 'image' | 'svg' | 'default';
}

/**
  * Emblema oficial de Vincit Omnia o personalizado suministrado por el usuario:
  * Permite cargar archivos SVG/imagen propios o usar el vector insignia oficial.
  */
export const VincitEmblem: React.FC<VincitEmblemProps> = ({
  className = 'w-10 h-10',
  size,
  variant = 'gold',
  customLogoUrl,
  customLogoType = 'default',
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeStyle = size ? { width: size, height: size } : undefined;

  // Si hay un logo personalizado suministrado por el usuario (URL, Base64 o SVG)
  if (customLogoUrl && !imgError) {
    return (
      <img
        src={customLogoUrl}
        alt="Logotipo de la aplicación"
        onError={() => setImgError(true)}
        className={`shrink-0 select-none object-contain ${className}`}
        style={sizeStyle}
      />
    );
  }

  // Emblema original Vincit Omnia
  if (!imgError) {
    return (
      <img
        src="/vincit-emblem.svg"
        alt="Vincit Omnia Emblem"
        onError={() => setImgError(true)}
        className={`shrink-0 select-none object-contain ${className}`}
        style={sizeStyle}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      style={sizeStyle}
    >
      <defs>
        {/* Gradiente dorado metálico de alto lujo */}
        <linearGradient id="vincitGoldGrad" x1="20" y1="10" x2="180" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="20%" stopColor="#DFB76C" />
          <stop offset="45%" stopColor="#C5A059" />
          <stop offset="70%" stopColor="#E5C77A" />
          <stop offset="85%" stopColor="#9C7328" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>

        <linearGradient id="vincitGoldAccent" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFECA0" />
          <stop offset="50%" stopColor="#C89D42" />
          <stop offset="100%" stopColor="#875E19" />
        </linearGradient>

        <filter id="vincitGoldGlow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#7A5210" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#vincitGoldGlow)">
        {/* ========================================================= */}
        {/* 1. CORONA REAL SUPERIOR (CROWN) */}
        {/* ========================================================= */}
        {/* Cruz y florón superior en el ápice */}
        <g stroke="url(#vincitGoldGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* Eje central de la cruz y orbe */}
          <line x1="100" y1="8" x2="100" y2="22" />
          <line x1="94" y1="14" x2="106" y2="14" />
          <circle cx="100" cy="23" r="2.5" fill="url(#vincitGoldGrad)" />

          {/* Perlas/adornos superiores */}
          <circle cx="68" cy="34" r="2" fill="url(#vincitGoldGrad)" />
          <circle cx="83" cy="30" r="2" fill="url(#vincitGoldGrad)" />
          <circle cx="117" cy="30" r="2" fill="url(#vincitGoldGrad)" />
          <circle cx="132" cy="34" r="2" fill="url(#vincitGoldGrad)" />
          <circle cx="152" cy="40" r="2.2" fill="url(#vincitGoldGrad)" />
          <circle cx="48" cy="40" r="2.2" fill="url(#vincitGoldGrad)" />

          {/* Silueta y filigrana de la corona */}
          {/* Arco central hacia el ápice */}
          <path d="M 88 42 C 92 30, 96 24, 100 24 C 104 24, 108 30, 112 42" fill="none" strokeWidth="2.8" />
          {/* Filigranas interiores izquierda */}
          <path d="M 92 38 C 84 32, 76 38, 72 46 C 70 50, 74 54, 80 50 C 86 46, 88 56, 86 64" fill="none" strokeWidth="2.4" />
          {/* Filigranas interiores derecha */}
          <path d="M 108 38 C 116 32, 124 38, 128 46 C 130 50, 126 54, 120 50 C 114 46, 112 56, 114 64" fill="none" strokeWidth="2.4" />

          {/* Picos exteriores curvados de la corona */}
          <path d="M 52 42 C 60 48, 64 56, 68 68" fill="none" strokeWidth="2.8" />
          <path d="M 148 42 C 140 48, 136 56, 132 68" fill="none" strokeWidth="2.8" />

          {/* Espirales laterales ornamentadas */}
          <path d="M 50 42 C 44 48, 48 56, 56 54 C 62 52, 60 62, 54 66" fill="none" strokeWidth="2.2" />
          <path d="M 150 42 C 156 48, 152 56, 144 54 C 138 52, 140 62, 146 66" fill="none" strokeWidth="2.2" />

          {/* Gema / lágrima central de la corona */}
          <path d="M 100 44 C 97 49, 97 53, 100 56 C 103 53, 103 49, 100 44 Z" fill="none" strokeWidth="2" />

          {/* Base curva de la corona que abraza el círculo */}
          <path d="M 56 70 C 76 56, 124 56, 144 70" fill="none" strokeWidth="3.2" />
        </g>

        {/* ========================================================= */}
        {/* 2. ARO CIRCULAR PRINCIPAL (MAIN RING) */}
        {/* ========================================================= */}
        <circle
          cx="100"
          cy="120"
          r="66"
          stroke="url(#vincitGoldGrad)"
          strokeWidth="3.6"
          fill="none"
        />

        {/* ========================================================= */}
        {/* 3. MONOGRAMA "V" CENTRAL ESTILIZADO DE DOBLE TRAZO */}
        {/* ========================================================= */}
        {/* Brazo izquierdo de la V */}
        <path
          d="M 72 82 L 96 148 C 98 152, 102 152, 104 148 L 128 82"
          stroke="url(#vincitGoldGrad)"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Trazo interno de la V (efecto relieve / doble cinta) */}
        <path
          d="M 82 82 L 100 134 L 118 82"
          stroke="url(#vincitGoldGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* ========================================================= */}
        {/* 4. MEDIAS LUNAS / ARCOS LATERALES INFERIORES */}
        {/* ========================================================= */}
        {/* Arco curvo envolvente izquierdo */}
        <path
          d="M 37 122 C 40 148, 62 174, 96 182"
          stroke="url(#vincitGoldGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arco curvo envolvente derecho */}
        <path
          d="M 163 122 C 160 148, 138 174, 104 182"
          stroke="url(#vincitGoldGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Línea que conecta el vértice de la V hacia los lados del aro */}
        <path
          d="M 44 144 C 68 154, 90 162, 100 154 C 110 162, 132 154, 156 144"
          stroke="url(#vincitGoldGrad)"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* ========================================================= */}
        {/* 5. GOTA / JOYA DE PEDRERÍA INFERIOR (TEARDROP GEM) */}
        {/* ========================================================= */}
        <g stroke="url(#vincitGoldGrad)" strokeWidth="3" fill="none">
          <path
            d="M 100 156 C 94 168, 92 178, 96 186 C 98 190, 102 190, 104 186 C 108 178, 106 168, 100 156 Z"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {/* Centro de la gema con destello */}
          <circle cx="100" cy="180" r="1.8" fill="url(#vincitGoldAccent)" />
        </g>
      </g>
    </svg>
  );
};
