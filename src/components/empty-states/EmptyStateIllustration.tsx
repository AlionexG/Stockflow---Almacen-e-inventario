import React from 'react';

interface IllustrationProps {
  className?: string;
  size?: number;
}

/**
 * Ilustración vectorial para la pestaña de Inventario
 * Caja de almacenamiento premium de Vincit Omnia con corona dorada,
 * etiquetas de stock, gemas y brillo sutil.
 */
export const InventoryIllustration: React.FC<IllustrationProps> = ({
  className = '',
  size = 180,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Gradiente dorado Vincit */}
        <linearGradient id="invGold" x1="40" y1="20" x2="200" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="35%" stopColor="#D97706" />
          <stop offset="70%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Gradiente esmeralda tecnológico */}
        <linearGradient id="invEmerald" x1="60" y1="50" x2="180" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>

        {/* Gradiente fondo suave */}
        <radialGradient id="invGlow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.18" />
          <stop offset="70%" stopColor="#10B981" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>

        {/* Sombra suave */}
        <filter id="invShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Halo de luz de fondo */}
      <circle cx="120" cy="120" r="100" fill="url(#invGlow)" />

      {/* Anillo de órbita punteado */}
      <circle
        cx="120"
        cy="120"
        r="88"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        className="dark:stroke-slate-700/60"
      />

      {/* Sombra base del paquete / caja */}
      <ellipse cx="120" cy="188" rx="65" ry="14" fill="#0F172A" fillOpacity="0.1" />

      {/* Cuerpo de la Caja / Contenedor de Inventario (Vista isométrica) */}
      <g filter="url(#invShadow)">
        {/* Lado izquierdo de la caja */}
        <path
          d="M65 110L120 140V182L65 152V110Z"
          fill="#1E293B"
          className="dark:fill-slate-800"
        />
        {/* Lado derecho de la caja */}
        <path
          d="M120 140L175 110V152L120 182V140Z"
          fill="#0F172A"
          className="dark:fill-slate-900"
        />
        {/* Tapa superior de la caja (abierta / interior elegante) */}
        <path
          d="M120 78L175 110L120 140L65 110L120 78Z"
          fill="#334155"
          className="dark:fill-slate-700"
        />
      </g>

      {/* Almohadilla de terciopelo interior */}
      <path
        d="M120 86L163 110L120 134L77 110L120 86Z"
        fill="#047857"
        fillOpacity="0.8"
      />

      {/* Joya / Producto icónico central resplandeciente */}
      <g transform="translate(0, -6)">
        {/* Diamante / Gema central */}
        <polygon
          points="120,80 138,98 120,118 102,98"
          fill="url(#invGold)"
          stroke="#FEF3C7"
          strokeWidth="1.5"
        />
        <polygon
          points="120,80 120,118 138,98"
          fill="#F59E0B"
          fillOpacity="0.5"
        />
        {/* Mini brillo en la gema */}
        <circle cx="116" cy="94" r="2" fill="#FFFFFF" />
      </g>

      {/* Cinta dorada y detalles de la caja */}
      <path
        d="M120 78L120 140"
        stroke="url(#invGold)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M65 110L175 110"
        stroke="url(#invGold)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
      />

      {/* Corona decorativa Vincit Omnia en la parte superior flotante */}
      <g transform="translate(102, 38)">
        <path
          d="M3 24L7 9L18 19L29 9L33 24H3Z"
          fill="url(#invGold)"
          stroke="#F59E0B"
          strokeWidth="1"
        />
        {/* Perlas de la corona */}
        <circle cx="7" cy="8" r="2.5" fill="#FEF08A" />
        <circle cx="18" cy="18" r="2.5" fill="#FEF08A" />
        <circle cx="29" cy="8" r="2.5" fill="#FEF08A" />
      </g>

      {/* Etiqueta de inventario flotante a la izquierda */}
      <g transform="translate(42, 68)" className="animate-bounce" style={{ animationDuration: '3s' }}>
        <rect
          x="0"
          y="0"
          width="46"
          height="24"
          rx="6"
          fill="#FFFFFF"
          className="dark:fill-slate-800"
          stroke="#E2E8F0"
          strokeWidth="1"
          filter="url(#invShadow)"
        />
        {/* Líneas de código de barras simulado */}
        <line x1="8" y1="7" x2="8" y2="17" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="13" y1="7" x2="13" y2="17" stroke="#0F172A" strokeWidth="1.5" className="dark:stroke-slate-200" />
        <line x1="17" y1="7" x2="17" y2="17" stroke="#94A3B8" strokeWidth="1" />
        <line x1="21" y1="7" x2="21" y2="17" stroke="#0F172A" strokeWidth="2.5" className="dark:stroke-slate-200" />
        <line x1="26" y1="7" x2="26" y2="17" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="31" y1="7" x2="31" y2="17" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="7" x2="36" y2="17" stroke="#94A3B8" strokeWidth="1" />
      </g>

      {/* Badge flotante + con botón a la derecha */}
      <g transform="translate(170, 78)">
        <circle cx="18" cy="18" r="16" fill="url(#invEmerald)" filter="url(#invShadow)" />
        <path d="M18 11V25M11 18H25" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Estrellitas / destellos decorativos */}
      <path
        d="M50 48L52 42L54 48L60 50L54 52L52 58L50 52L44 50L50 48Z"
        fill="#FBBF24"
        opacity="0.9"
      />
      <path
        d="M188 150L189.5 145L191 150L196 151.5L191 153L189.5 158L188 153L183 151.5L188 150Z"
        fill="#34D399"
        opacity="0.8"
      />
    </svg>
  );
};

/**
 * Ilustración vectorial para la pestaña de Ventas Realizadas
 * Factura digital con check de pago exitoso, bolsa de compras elegante
 * y curva ascendente de ganancia neta.
 */
export const SalesIllustration: React.FC<IllustrationProps> = ({
  className = '',
  size = 180,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="salesSky" x1="40" y1="30" x2="200" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        <linearGradient id="salesGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="salesGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <radialGradient id="salesGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.16" />
          <stop offset="70%" stopColor="#10B981" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </radialGradient>

        <filter id="salesShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.16" />
        </filter>
      </defs>

      {/* Halo de luz de fondo */}
      <circle cx="120" cy="120" r="100" fill="url(#salesGlow)" />

      {/* Círculo guía */}
      <circle
        cx="120"
        cy="120"
        r="88"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        className="dark:stroke-slate-700/60"
      />

      {/* Sombra base */}
      <ellipse cx="120" cy="192" rx="68" ry="12" fill="#0F172A" fillOpacity="0.1" />

      {/* Bolsa de Compras Premium Vincit Omnia */}
      <g filter="url(#salesShadow)">
        {/* Asas de la bolsa */}
        <path
          d="M86 95C86 78 98 64 114 64C130 64 142 78 142 95"
          stroke="url(#salesGold)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cuerpo de la bolsa de compras */}
        <path
          d="M68 95L76 182H164L172 95H68Z"
          fill="#1E293B"
          className="dark:fill-slate-800"
          stroke="#334155"
          strokeWidth="1"
        />
        {/* Pliegue frontal elegante */}
        <path
          d="M80 95L86 182H154L160 95H80Z"
          fill="#0F172A"
          className="dark:fill-slate-900"
        />
        {/* Franja decorativa dorada en la bolsa */}
        <line x1="76" y1="116" x2="164" y2="116" stroke="url(#salesGold)" strokeWidth="2" />
        <circle cx="120" cy="144" r="14" fill="#0284C7" fillOpacity="0.2" stroke="url(#salesGold)" strokeWidth="1.5" />
        <text
          x="120"
          y="148"
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill="#F59E0B"
          fontFamily="serif"
        >
          V
        </text>
      </g>

      {/* Recibo / Factura digital flotando a la derecha con checkmark */}
      <g transform="translate(136, 68)" filter="url(#salesShadow)">
        <rect
          x="0"
          y="0"
          width="62"
          height="84"
          rx="8"
          fill="#FFFFFF"
          className="dark:fill-slate-800"
          stroke="#E2E8F0"
          strokeWidth="1"
        />
        {/* Líneas del recibo */}
        <rect x="8" y="12" width="28" height="4" rx="2" fill="#0284C7" />
        <rect x="8" y="22" width="46" height="3" rx="1.5" fill="#CBD5E1" className="dark:fill-slate-600" />
        <rect x="8" y="30" width="36" height="3" rx="1.5" fill="#E2E8F0" className="dark:fill-slate-700" />
        <rect x="8" y="38" width="42" height="3" rx="1.5" fill="#E2E8F0" className="dark:fill-slate-700" />
        <line x1="8" y1="48" x2="54" y2="48" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="8" y="55" width="22" height="3" rx="1.5" fill="#64748B" />
        <rect x="34" y="54" width="20" height="5" rx="2" fill="#10B981" />

        {/* Sello de ¡PAGADO / VENDIDO! */}
        <circle cx="48" cy="74" r="12" fill="url(#salesGreen)" />
        <path d="M43 74L46.5 77.5L53 71" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Tarjeta de pago / celular flotando a la izquierda */}
      <g transform="translate(38, 114)" filter="url(#salesShadow)">
        <rect
          x="0"
          y="0"
          width="50"
          height="32"
          rx="6"
          fill="url(#salesSky)"
        />
        {/* Chip dorado */}
        <rect x="8" y="10" width="9" height="7" rx="1.5" fill="url(#salesGold)" />
        {/* Línea de contacto sin contacto */}
        <path d="M22 10C24 12 24 15 22 17" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="38" cy="22" r="4" fill="#38BDF8" fillOpacity="0.8" />
      </g>

      {/* Gráfica ascendente flotante */}
      <path
        d="M48 65L74 48L96 56L122 34"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="122" cy="34" r="4" fill="#10B981" />
    </svg>
  );
};

/**
 * Ilustración vectorial para la pestaña de Créditos y Cuotas Pendientes
 * Calendario con cronograma de pagos, avisos de WhatsApp / SMS y reloj
 */
export const CreditSalesIllustration: React.FC<IllustrationProps> = ({
  className = '',
  size = 180,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="credAmber" x1="30" y1="30" x2="210" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <linearGradient id="credEmerald" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <radialGradient id="credGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.18" />
          <stop offset="70%" stopColor="#0284C7" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
        </radialGradient>

        <filter id="credShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.16" />
        </filter>
      </defs>

      {/* Halo de luz de fondo */}
      <circle cx="120" cy="120" r="100" fill="url(#credGlow)" />
      <circle
        cx="120"
        cy="120"
        r="88"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        className="dark:stroke-slate-700/60"
      />
      <ellipse cx="120" cy="194" rx="66" ry="12" fill="#0F172A" fillOpacity="0.1" />

      {/* Calendario de cuotas central */}
      <g filter="url(#credShadow)">
        {/* Base del calendario */}
        <rect
          x="65"
          y="68"
          width="110"
          height="115"
          rx="14"
          fill="#FFFFFF"
          className="dark:fill-slate-800"
          stroke="#E2E8F0"
          strokeWidth="1"
        />

        {/* Encabezado del calendario */}
        <path
          d="M65 82C65 74.268 71.268 68 79 68H161C168.732 68 175 74.268 175 82V96H65V82Z"
          fill="url(#credAmber)"
        />

        {/* Ganchos / espiral del calendario */}
        <rect x="88" y="60" width="8" height="16" rx="4" fill="#334155" />
        <rect x="144" y="60" width="8" height="16" rx="4" fill="#334155" />

        {/* Texto / días del calendario */}
        <text
          x="120"
          y="86"
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill="#FFFFFF"
          letterSpacing="1"
        >
          CUOTAS & PLAZOS
        </text>

        {/* Cuadrícula de cuotas con check y pendientes */}
        {/* Cuota 1 (Pagada) */}
        <g transform="translate(77, 108)">
          <rect x="0" y="0" width="26" height="24" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
          <path d="M8 12L11 15L18 8" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Cuota 2 (Pagada) */}
        <g transform="translate(107, 108)">
          <rect x="0" y="0" width="26" height="24" rx="6" fill="#ECFDF5" stroke="#A7F3D0" />
          <path d="M8 12L11 15L18 8" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Cuota 3 (Próxima / Activa) */}
        <g transform="translate(137, 108)">
          <rect x="0" y="0" width="26" height="24" rx="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
          <text x="13" y="16" textAnchor="middle" fontSize="10" fontWeight="black" fill="#B45309">
            #3
          </text>
        </g>

        {/* Barra de progreso de pago */}
        <rect x="77" y="146" width="86" height="8" rx="4" fill="#F1F5F9" className="dark:fill-slate-700" />
        <rect x="77" y="146" width="58" height="8" rx="4" fill="url(#credEmerald)" />
        <text x="120" y="168" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748B">
          70% LIQUIDADO
        </text>
      </g>

      {/* Globo de mensaje de WhatsApp a la derecha */}
      <g transform="translate(162, 54)" filter="url(#credShadow)">
        <circle cx="18" cy="18" r="16" fill="#25D366" />
        {/* Teléfono / chat WhatsApp */}
        <path
          d="M18 10C13.58 10 10 13.58 10 18C10 19.5 10.42 20.9 11.16 22.1L10 26L14.06 24.92C15.22 25.6 16.56 26 18 26C22.42 26 26 22.42 26 18C26 13.58 22.42 10 18 10Z"
          fill="#FFFFFF"
        />
      </g>

      {/* Globo de mensaje de SMS a la izquierda */}
      <g transform="translate(36, 120)" filter="url(#credShadow)">
        <rect x="0" y="0" width="38" height="28" rx="8" fill="#0284C7" />
        <path d="M12 28L18 23H32C35.3 23 38 20.3 38 17V6C38 2.7 35.3 0 32 0H6C2.7 0 0 2.7 0 6V17C0 20.3 2.7 23 6 23H8L12 28Z" fill="#0284C7" />
        <circle cx="11" cy="11.5" r="2" fill="#FFFFFF" />
        <circle cx="19" cy="11.5" r="2" fill="#FFFFFF" />
        <circle cx="27" cy="11.5" r="2" fill="#FFFFFF" />
      </g>

      {/* Monedas doradas apiladas en la esquina inferior */}
      <g transform="translate(48, 160)">
        <ellipse cx="16" cy="18" rx="14" ry="5" fill="#B45309" />
        <ellipse cx="16" cy="14" rx="14" ry="5" fill="#D97706" />
        <ellipse cx="16" cy="10" rx="14" ry="5" fill="url(#credAmber)" />
      </g>
    </svg>
  );
};

/**
 * Ilustración vectorial para la pestaña de Gastos Operativos
 * Billetera de control contable, desglose de fletes y empaques con calculadora
 */
export const ExpensesIllustration: React.FC<IllustrationProps> = ({
  className = '',
  size = 180,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="expRose" x1="40" y1="30" x2="200" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="70%" stopColor="#BE123C" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>

        <linearGradient id="expAmber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <radialGradient id="expGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.16" />
          <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>

        <filter id="expShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.16" />
        </filter>
      </defs>

      <circle cx="120" cy="120" r="100" fill="url(#expGlow)" />
      <circle
        cx="120"
        cy="120"
        r="88"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        className="dark:stroke-slate-700/60"
      />
      <ellipse cx="120" cy="192" rx="66" ry="12" fill="#0F172A" fillOpacity="0.1" />

      {/* Libro Mayor / Carpeta de Registro de Gastos */}
      <g filter="url(#expShadow)">
        {/* Base de la libreta contable */}
        <rect
          x="70"
          y="72"
          width="100"
          height="110"
          rx="12"
          fill="#1E293B"
          className="dark:fill-slate-800"
          stroke="#334155"
          strokeWidth="1"
        />

        {/* Lomo elegante encuadernado */}
        <rect x="70" y="72" width="18" height="110" rx="4" fill="url(#expRose)" />
        <line x1="79" y1="82" x2="79" y2="172" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.7" />

        {/* Tarjeta de recibo insertada */}
        <rect
          x="96"
          y="84"
          width="66"
          height="88"
          rx="6"
          fill="#FFFFFF"
          className="dark:fill-slate-900"
        />

        {/* Filas de conceptos de gastos */}
        {/* Empaque */}
        <rect x="104" y="94" width="24" height="4" rx="2" fill="#F43F5E" />
        <rect x="136" y="94" width="18" height="4" rx="2" fill="#64748B" />
        {/* Flete */}
        <rect x="104" y="104" width="30" height="4" rx="2" fill="#F59E0B" />
        <rect x="140" y="104" width="14" height="4" rx="2" fill="#64748B" />
        {/* Ads */}
        <rect x="104" y="114" width="20" height="4" rx="2" fill="#0284C7" />
        <rect x="134" y="114" width="20" height="4" rx="2" fill="#64748B" />

        <line x1="104" y1="126" x2="154" y2="126" stroke="#E2E8F0" strokeWidth="1" />

        {/* Total restado */}
        <text x="104" y="140" fontSize="9" fontWeight="bold" fill="#64748B">
          TOTAL
        </text>
        <text x="154" y="140" textAnchor="end" fontSize="11" fontWeight="black" fill="#E11D48">
          -$0.00
        </text>

        {/* Marca de verificación o sello */}
        <rect x="104" y="148" width="50" height="14" rx="4" fill="#F1F5F9" className="dark:fill-slate-800" />
        <text x="129" y="158" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#94A3B8">
          100% CUADRADO
        </text>
      </g>

      {/* Calculadora flotante a la derecha */}
      <g transform="translate(154, 110)" filter="url(#expShadow)">
        <rect
          x="0"
          y="0"
          width="44"
          height="58"
          rx="8"
          fill="#0F172A"
          stroke="#475569"
          strokeWidth="1"
        />
        {/* Pantalla digital */}
        <rect x="6" y="6" width="32" height="12" rx="3" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="0.8" />
        <text x="34" y="15" textAnchor="end" fontSize="8" fontWeight="bold" fill="#34D399" fontFamily="monospace">
          0.00
        </text>
        {/* Botones de calculadora */}
        <circle cx="12" cy="26" r="3" fill="#334155" />
        <circle cx="22" cy="26" r="3" fill="#334155" />
        <circle cx="32" cy="26" r="3" fill="#F59E0B" />

        <circle cx="12" cy="36" r="3" fill="#334155" />
        <circle cx="22" cy="36" r="3" fill="#334155" />
        <circle cx="32" cy="36" r="3" fill="#F43F5E" />

        <circle cx="12" cy="46" r="3" fill="#334155" />
        <rect x="19" y="43" width="16" height="6" rx="3" fill="#10B981" />
      </g>

      {/* Caja de empaques / suministros flotante a la izquierda */}
      <g transform="translate(42, 60)" filter="url(#expShadow)">
        <rect x="0" y="0" width="38" height="32" rx="6" fill="#F59E0B" />
        <path d="M0 8H38M19 8V32" stroke="#B45309" strokeWidth="1.5" />
        <circle cx="19" cy="5" r="2" fill="#FEF3C7" />
      </g>
    </svg>
  );
};

/**
 * Ilustración vectorial para Lotes de Envío y Fletes
 * Avión / Camión con contenedor y cálculo proporcional de flete
 */
export const ShippingBatchesIllustration: React.FC<IllustrationProps> = ({
  className = '',
  size = 180,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-300 hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shipEmerald" x1="40" y1="30" x2="200" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="60%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>

        <linearGradient id="shipGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <radialGradient id="shipGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.16" />
          <stop offset="70%" stopColor="#0284C7" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
        </radialGradient>

        <filter id="shipShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F172A" floodOpacity="0.16" />
        </filter>
      </defs>

      <circle cx="120" cy="120" r="100" fill="url(#shipGlow)" />
      <circle
        cx="120"
        cy="120"
        r="88"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        className="dark:stroke-slate-700/60"
      />
      <ellipse cx="120" cy="192" rx="66" ry="12" fill="#0F172A" fillOpacity="0.1" />

      {/* Contenedor de Envío / Camión Courier */}
      <g filter="url(#shipShadow)">
        {/* Cabina del camión */}
        <path
          d="M145 120H172C175.3 120 178 122.7 178 126V162H145V120Z"
          fill="#0F172A"
          className="dark:fill-slate-900"
        />
        {/* Ventana cabina */}
        <path
          d="M152 126H168C170.2 126 172 127.8 172 130V140H152V126Z"
          fill="#38BDF8"
          fillOpacity="0.8"
        />

        {/* Remolque / Caja grande del lote */}
        <rect
          x="62"
          y="98"
          width="83"
          height="64"
          rx="6"
          fill="url(#shipEmerald)"
        />

        {/* Franjas del contenedor logístico */}
        <line x1="76" y1="104" x2="76" y2="156" stroke="#064E3B" strokeWidth="2" />
        <line x1="90" y1="104" x2="90" y2="156" stroke="#064E3B" strokeWidth="2" />
        <line x1="104" y1="104" x2="104" y2="156" stroke="#064E3B" strokeWidth="2" />
        <line x1="118" y1="104" x2="118" y2="156" stroke="#064E3B" strokeWidth="2" />
        <line x1="132" y1="104" x2="132" y2="156" stroke="#064E3B" strokeWidth="2" />

        {/* Sello del lote */}
        <rect x="78" y="116" width="50" height="20" rx="4" fill="#FFFFFF" fillOpacity="0.95" />
        <text x="103" y="129" textAnchor="middle" fontSize="9" fontWeight="black" fill="#065F46">
          LOTE #1
        </text>

        {/* Ruedas del transporte */}
        <circle cx="85" cy="166" r="10" fill="#0F172A" stroke="#475569" strokeWidth="3" />
        <circle cx="85" cy="166" r="4" fill="#94A3B8" />

        <circle cx="125" cy="166" r="10" fill="#0F172A" stroke="#475569" strokeWidth="3" />
        <circle cx="125" cy="166" r="4" fill="#94A3B8" />

        <circle cx="162" cy="166" r="10" fill="#0F172A" stroke="#475569" strokeWidth="3" />
        <circle cx="162" cy="166" r="4" fill="#94A3B8" />
      </g>

      {/* Avión de importación aérea volando en la parte superior */}
      <g transform="translate(132, 44)" filter="url(#shipShadow)">
        <path
          d="M24 16L40 4L36 2L18 10L6 7L3 9L12 13L9 16L4 15L2 17L7 19L9 24L11 22L10 17L19 14L24 16Z"
          fill="url(#shipGold)"
        />
        {/* Estela de vuelo */}
        <path
          d="M0 12C-10 10 -25 8 -42 8"
          stroke="#CBD5E1"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          strokeLinecap="round"
        />
      </g>

      {/* Badge con fórmula: Flete Total ÷ Piezas = Costo/u */}
      <g transform="translate(42, 48)" filter="url(#shipShadow)">
        <rect x="0" y="0" width="76" height="26" rx="8" fill="#FFFFFF" className="dark:fill-slate-800" stroke="#E2E8F0" strokeWidth="1" />
        <text x="38" y="16" textAnchor="middle" fontSize="9" fontWeight="black" fill="#0F172A" className="dark:fill-slate-200">
          Flete ÷ Piezas
        </text>
      </g>
    </svg>
  );
};
