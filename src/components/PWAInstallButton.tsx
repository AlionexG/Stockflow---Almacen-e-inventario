import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, Copy, Check, Sparkles, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'card' | 'settings' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'settings',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('stockflow_pwa_banner_dismissed') === 'true';
      setIsDismissed(dismissed);
    }
  }, []);

  // If already running inside an installed PWA standalone window, do not display install banners
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>StockFlow ya está instalado como App nativa (PWA / WebAPK) en este dispositivo.</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await install();
        if (!success) {
          setShowGuideModal(true);
        }
      } catch {
        setShowGuideModal(true);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If native deferred prompt is not yet ready, show step-by-step instructions
      setShowGuideModal(true);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDismissBanner = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stockflow_pwa_banner_dismissed', 'true');
    }
  };

  // Render for Dashboard Dismissible Banner (Mobile friendly)
  if (variant === 'banner') {
    if (isDismissed) return null;

    return (
      <>
        <div className={`relative overflow-hidden p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-900/10 dark:from-amber-500/20 dark:via-slate-900/40 dark:to-slate-900/60 border border-amber-500/30 dark:border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${className}`}>
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Instalar StockFlow en tu Teléfono
                </h4>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  {isAndroid ? 'Android WebAPK' : isIOS ? 'iOS Safari' : 'PWA Nativa'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                Instala la app para usarla en pantalla completa, con icono dorado oficial en tu cajón de apps y soporte sin internet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstallable ? 'Instalar App Ahora' : 'Ver Cómo Instalar'}</span>
            </button>

            <button
              type="button"
              onClick={handleDismissBanner}
              title="Cerrar aviso"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showGuideModal && renderModal()}
      </>
    );
  }

  // Render for Settings Tab
  if (variant === 'settings') {
    return (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/5 dark:from-amber-500/10 dark:to-slate-900/40 rounded-2xl border border-amber-500/30">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-500" />
                Instalar StockFlow como App Móvil
              </h4>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                PWA / WebAPK Oficial
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isInstallable
                ? '¡Listo para instalar! Tu navegador detectó el paquete oficial. Pulsa el botón para añadir la app a tu sistema.'
                : 'Usa la app a pantalla completa, con icono propio en el menú de aplicaciones y sin barra de navegación.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isInstallable ? (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isInstalling ? 'Instalando...' : 'Instalar App Ahora'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Instrucciones de Instalación</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal de Instrucciones para Android / iOS */}
        {showGuideModal && renderModal()}
      </div>
    );
  }

  // Render generic fallback button
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Instalar StockFlow en tu teléfono o computadora"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
          isInstallable
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 ring-2 ring-amber-400/30'
            : 'bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>

      {showGuideModal && renderModal()}
    </>
  );

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Instalar StockFlow en Teléfonos
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Diferencia entre «Instalar Aplicación» y «Acceso Directo»
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuideModal(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-300">
            {/* Si el navegador ya tiene el botón directo disponible */}
            {isInstallable && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-amber-200 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Tu navegador está listo para instalar la app ahora</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-sm cursor-pointer transition-all"
                >
                  Abrir diálogo oficial de instalación
                </button>
              </div>
            )}

            {/* AVISO IMPORTANTE SOBRE NAVEGADORES INTERNOS (WhatsApp / Instagram / Vista previa) */}
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-2">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[11px]">¿Por qué antes solo salía «Agregar acceso directo»?</p>
                  <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                    1. En <strong>Android</strong>, la instalación oficial de una aplicación se llama <strong>«Instalar aplicación»</strong> en el menú de Google Chrome.<br />
                    2. Si abres el link dentro del visor interno de <strong>WhatsApp, Instagram o Facebook</strong>, esas apps bloquean las descargas de aplicaciones del sistema. Debes tocar los tres puntos (⋮) y elegir <strong>«Abrir en Chrome»</strong>.
                  </p>
                </div>
              </div>

              {/* Botón para copiar enlace y abrir en Chrome */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs hover:bg-blue-50 cursor-pointer transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '¡Enlace copiado! Pégalo en Google Chrome' : 'Copiar enlace para abrir en Google Chrome'}</span>
              </button>
            </div>

            {/* PASO A PASO PARA ANDROID */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="text-base">🤖</span> En teléfonos Android (Google Chrome):
              </h4>
              <ol className="space-y-2 pl-1">
                <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span>Abre la app en <strong>Google Chrome</strong> (no en el navegador interno de otra app).</span>
                </li>
                <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span>Toca los <strong>tres puntos verticales (⋮)</strong> en la esquina superior derecha de Chrome.</span>
                </li>
                <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                  <div>
                    <span>Selecciona la opción <strong>«Instalar aplicación»</strong> o <strong>«Instalar StockFlow»</strong>.</span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                      ✓ Esto instalará el paquete WebAPK de Android, apareciendo en tu lista de aplicaciones con su icono oficial.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* PASO A PASO PARA IPHONE */}
            {isIOS && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="text-base"></span> En iPhone / iPad (Safari):
                </h4>
                <ol className="space-y-2 pl-1">
                  <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                    <span>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha ↑ abajo).</span>
                  </li>
                  <li className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                    <span>Baja y selecciona <strong>«Añadir a la pantalla de inicio»</strong>.</span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowGuideModal(false)}
            className="mt-5 w-full py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }
};
