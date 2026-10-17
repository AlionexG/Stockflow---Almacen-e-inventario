import React, { useRef, useState, useEffect } from 'react';
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
  Calculator,
  Download,
  LogOut,
  Truck,
  Settings,
  CloudCheck,
  WifiOff,
  Wifi,
  RefreshCw,
  Sun,
  Moon,
  History,
  ChevronLeft,
  ChevronRight,
  Store,
  Share2,
} from 'lucide-react';
import { GoogleSheetsConfig, AppSettings } from '../types';
import { VincitEmblem } from './brand/VincitEmblem';

interface NavbarProps {
  currentTab: 'dashboard' | 'products' | 'batches' | 'sales' | 'expenses' | 'history';
  onSelectTab: (tab: 'dashboard' | 'products' | 'batches' | 'sales' | 'expenses' | 'history') => void;
  user: any | null;
  sheetsConfig: GoogleSheetsConfig;
  settings: AppSettings;
  lowStockCount?: number;
  isOnline?: boolean;
  hasPendingSync?: boolean;
  onTriggerSync?: () => void;
  onOpenSettings: () => void;
  onOpenCalculator: () => void;
  onOpenReports: () => void;
  onToggleDarkMode?: () => void;
  onOpenCustomerCatalog?: () => void;
  onOpenShareCatalog?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  sheetsConfig,
  settings,
  lowStockCount = 0,
  isOnline = true,
  hasPendingSync = false,
  onTriggerSync,
  onOpenSettings,
  onOpenCalculator,
  onOpenReports,
  onToggleDarkMode,
  onOpenCustomerCatalog,
  onOpenShareCatalog,
}) => {
  const mobileNavRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollBounds = () => {
    if (!mobileNavRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = mobileNavRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    checkScrollBounds();
    const handleResize = () => checkScrollBounds();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll active tab button into view on tab change
  useEffect(() => {
    if (mobileNavRef.current) {
      const activeBtn = mobileNavRef.current.querySelector<HTMLElement>(`[data-tab="${currentTab}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      setTimeout(checkScrollBounds, 250);
    }
  }, [currentTab]);

  const handleScrollNav = (direction: 'left' | 'right') => {
    if (!mobileNavRef.current) return;
    const amount = direction === 'left' ? -130 : 130;
    mobileNavRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScrollBounds, 200);
  };

  interface NavTabItem {
    id: 'dashboard' | 'products' | 'batches' | 'sales' | 'expenses' | 'history' | 'settings' | 'catalog';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    onClick?: () => void;
  }

  const navTabs: NavTabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Inventario', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'batches', label: 'Lotes', icon: Truck },
    { id: 'sales', label: 'Ventas', icon: ShoppingCart },
    { id: 'expenses', label: 'Gastos', icon: Receipt },
    { id: 'history', label: 'Historial', icon: History },
    {
      id: 'catalog',
      label: 'Catálogo',
      icon: Store,
      onClick: onOpenShareCatalog || onOpenCustomerCatalog,
    },
    { id: 'settings', label: 'Configuración', icon: Settings, onClick: onOpenSettings },
  ];

  // Theme accent colors
  const getThemeGradient = (theme: AppSettings['theme']) => {
    switch (theme) {
      case 'amber':
        return 'from-amber-500 to-yellow-600 shadow-amber-500/20';
      case 'indigo':
        return 'from-indigo-600 to-blue-500 shadow-indigo-500/20';
      case 'purple':
        return 'from-purple-600 to-pink-500 shadow-purple-500/20';
      case 'rose':
        return 'from-rose-500 to-pink-600 shadow-rose-500/20';
      case 'sky':
        return 'from-sky-500 to-cyan-600 shadow-sky-500/20';
      case 'slate':
        return 'from-slate-800 to-slate-700 shadow-slate-500/20';
      case 'custom':
        return 'from-amber-500 to-amber-600 shadow-amber-500/20';
      case 'emerald':
      default:
        return 'from-emerald-600 to-teal-500 shadow-emerald-500/20';
    }
  };

  const getThemeText = (theme: AppSettings['theme']) => {
    switch (theme) {
      case 'amber':
        return 'text-amber-600 dark:text-amber-400';
      case 'indigo':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'purple':
        return 'text-purple-600 dark:text-purple-400';
      case 'rose':
        return 'text-rose-600 dark:text-rose-400';
      case 'sky':
        return 'text-sky-600 dark:text-sky-400';
      case 'slate':
        return 'text-slate-900 dark:text-slate-100';
      case 'custom':
        return 'text-theme-accent';
      case 'emerald':
      default:
        return 'text-emerald-600 dark:text-emerald-400';
    }
  };

  const isDarkMode = !!settings.darkMode;

  // Icon sizing configuration based on settings.iconSize (sm, md, lg, xl, 2xl)
  const getEmblemContainerClass = (iconSize?: AppSettings['iconSize']) => {
    switch (iconSize) {
      case 'sm':
        return 'w-9 h-9';
      case 'md':
        return 'w-10 h-10';
      case 'xl':
        return 'w-14 h-14 sm:w-16 sm:h-16';
      case '2xl':
        return 'w-16 h-16 sm:w-20 sm:h-20';
      case 'lg':
      default:
        // By default, made significantly larger as requested: 12x12 (48px) instead of previous 40px
        return 'w-12 h-12 sm:w-13 sm:h-13';
    }
  };

  const getEmblemSizeClass = (iconSize?: AppSettings['iconSize']) => {
    switch (iconSize) {
      case 'sm':
        return 'w-6 h-6';
      case 'md':
        return 'w-7 h-7';
      case 'xl':
        return 'w-11 h-11 sm:w-13 sm:h-13';
      case '2xl':
        return 'w-13 h-13 sm:w-16 sm:h-16';
      case 'lg':
      default:
        // Enlarged default: 36px/40px icon
        return 'w-9 h-9 sm:w-10 sm:h-10';
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full max-w-full overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors duration-200">
        <div className="max-w-7xl 2xl:max-w-[1560px] mx-auto px-2.5 sm:px-6 lg:px-8 min-h-[3.75rem] sm:min-h-[4.25rem] py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Logo & App Brand con Emblema Vincit Omnia o personalizado */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 sm:gap-3.5 cursor-pointer group select-none min-w-0 shrink"
          >
            {/* Contenedor del Emblema / Icono */}
            <div className={`${getEmblemContainerClass(settings.iconSize)} shrink-0 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/70 border border-amber-500/50 p-1.5 flex items-center justify-center shadow-lg shadow-amber-500/15 group-hover:scale-105 group-hover:border-amber-400 group-hover:shadow-amber-500/25 transition-all duration-200`}>
              <VincitEmblem
                className={getEmblemSizeClass(settings.iconSize)}
                customLogoUrl={settings.customLogoUrl}
                customLogoType={settings.customLogoType}
              />
            </div>

            {/* Tipografía de Marca Oficial con amplio espacio y truncado elegante */}
            <div className="flex flex-col justify-center min-w-0 flex-1 max-w-[210px] min-[380px]:max-w-[270px] min-[480px]:max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-none">
              <span
                className="font-serif uppercase font-bold text-sm sm:text-lg lg:text-xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent tracking-[0.08em] sm:tracking-[0.16em] leading-tight drop-shadow-xs truncate block"
                style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                title={settings.appName || 'VINCIT OMNIA'}
              >
                {settings.appName || 'VINCIT OMNIA'}
              </span>
              <p
                className="text-[8.5px] sm:text-[10px] text-amber-600/90 dark:text-amber-400/80 uppercase tracking-[0.14em] sm:tracking-[0.22em] font-semibold leading-tight mt-0.5 truncate block"
                title={settings.appSubtitle || 'ACCESORIOS Y MÁS'}
              >
                {settings.appSubtitle || 'ACCESORIOS Y MÁS'}
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Links */}
          <nav className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80 transition-colors">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'dashboard'
                  ? `bg-white dark:bg-slate-900 ${getThemeText(settings.theme)} shadow-xs`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onSelectTab('products')}
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                currentTab === 'products'
                  ? `bg-white dark:bg-slate-900 ${getThemeText(settings.theme)} shadow-xs`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>Inventario</span>
              {lowStockCount > 0 && (
                <span
                  className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs animate-pulse"
                  title={`${lowStockCount} producto(s) con bajo stock`}
                >
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('batches')}
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'batches'
                  ? `bg-white dark:bg-slate-900 ${getThemeText(settings.theme)} shadow-xs`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span>Lotes<span className="hidden xl:inline"> de Envío</span></span>
            </button>

            <button
              onClick={() => onSelectTab('sales')}
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'sales'
                  ? `bg-white dark:bg-slate-900 ${getThemeText(settings.theme)} shadow-xs`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span>Ventas</span>
            </button>

            <button
              onClick={() => onSelectTab('expenses')}
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'expenses'
                  ? `bg-white dark:bg-slate-900 ${getThemeText(settings.theme)} shadow-xs`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              <span>Gastos</span>
            </button>

            <button
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'history'
                  ? `bg-white dark:bg-slate-900 ${getThemeText(settings.theme)} shadow-xs`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>Historial</span>
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Botón Rápido Modo Oscuro / Claro */}
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="p-2 rounded-xl text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600 transition-transform hover:-rotate-12" />
                )}
              </button>
            )}

            {/* Quick Calculator Shortcut */}
            <button
              onClick={onOpenCalculator}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
              title="Simulador de Ganancias y Envíos"
            >
              <Calculator className="w-4 h-4" />
            </button>

            {/* Quick Reports Shortcut */}
            <button
              onClick={onOpenReports}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
              title="Reportes Excel y PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Status de Conexión: Offline o Sincronización Diferida */}
            {!isOnline ? (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs"
                title="Modo sin conexión: Uso completo local garantizado. Los cambios se guardan en el dispositivo."
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Offline (Local)</span>
              </div>
            ) : hasPendingSync ? (
              <button
                type="button"
                onClick={onTriggerSync}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors shadow-2xs"
                title="Hay cambios locales pendientes de sincronizar con Google Sheets. Clic para sincronizar ahora."
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-spin" />
                <span className="hidden sm:inline">Sync diferido</span>
              </button>
            ) : null}

            {/* Google Sheets Connection Quick Pill */}
            {sheetsConfig.spreadsheetId && (
              <button
                onClick={onOpenSettings}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                title="Google Sheets Sincronizado"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sheets Activo</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>
            )}

            {/* Catálogo Clientes Button - Solo en tablets y PC (oculto en móviles para evitar duplicidad con la barra inferior) */}
            {onOpenShareCatalog && (
              <button
                type="button"
                onClick={onOpenShareCatalog}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs active:scale-95 transition-all cursor-pointer"
                title="Compartir o Ver Catálogo Digital de Clientes"
              >
                <Store className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Catálogo Clientes</span>
              </button>
            )}

            {/* Centralized Configuration Button - Solo en tablets y PC (oculto en móviles para evitar duplicidad con la barra inferior) */}
            <button
              onClick={onOpenSettings}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-700 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Configuración de la App, Google y Temas"
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>Configuración</span>
            </button>

            {/* User profile avatar indicator */}
            {user && (
              <button
                onClick={onOpenSettings}
                className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center overflow-hidden text-xs border border-emerald-400"
                title={`Conectado como ${user.email}`}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Usuario'} className="w-full h-full object-cover" />
                ) : (
                  user.email?.charAt(0).toUpperCase()
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Desplazable horizontalmente para ver todos los botones sin ensanchar la pantalla */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 w-full max-w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] transition-colors select-none">
        <div className="relative w-full max-w-full overflow-hidden flex items-center">
          {/* Indicador sutil de scroll hacia la izquierda */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScrollNav('left')}
              className="absolute left-0 z-20 h-full px-1.5 flex items-center justify-center bg-gradient-to-r from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 dark:to-transparent text-slate-500 hover:text-amber-500 transition-colors pointer-events-auto"
              aria-label="Desplazar menú a la izquierda"
              title="Más opciones a la izquierda"
            >
              <ChevronLeft className="w-4 h-4 drop-shadow-xs" />
            </button>
          )}

          {/* Lista de navegación desplazable horizontalmente */}
          <nav
            ref={mobileNavRef}
            onScroll={checkScrollBounds}
            className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 overflow-x-auto no-scrollbar scroll-smooth overscroll-x-contain touch-pan-x w-full"
            style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
          >
            {navTabs.map((tab) => {
              const isActive = currentTab === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={`mobile-tab-${tab.id}`}
                  data-tab={tab.id}
                  onClick={() => {
                    if (tab.onClick) {
                      tab.onClick();
                    } else {
                      onSelectTab(tab.id as any);
                    }
                  }}
                  style={isActive ? {
                    color: 'var(--theme-accent)',
                    backgroundColor: 'var(--theme-accent-subtle)',
                    borderColor: 'var(--theme-accent-border)',
                  } : undefined}
                  className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl transition-all shrink-0 min-w-[64px] text-center cursor-pointer active:scale-95 ${
                    isActive
                      ? 'font-bold border shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="relative">
                    <IconComp className="w-4 h-4" />
                    {tab.badge !== undefined && (
                      <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] leading-tight whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Indicador sutil de scroll hacia la derecha */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScrollNav('right')}
              className="absolute right-0 z-20 h-full px-1.5 flex items-center justify-center bg-gradient-to-l from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 dark:to-transparent text-slate-500 hover:text-amber-500 transition-colors pointer-events-auto"
              aria-label="Desplazar menú a la derecha"
              title="Más opciones a la derecha"
            >
              <ChevronRight className="w-4 h-4 drop-shadow-xs" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
