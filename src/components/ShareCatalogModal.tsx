import React, { useState } from 'react';
import { AppSettings } from '../types';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Store,
  Phone,
  ShieldCheck,
  Eye,
  Sparkles
} from 'lucide-react';

interface ShareCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onOpenCustomerView: () => void;
}

export const ShareCatalogModal: React.FC<ShareCatalogModalProps> = ({
  isOpen,
  onClose,
  settings,
  onOpenCustomerView,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(true);

  if (!isOpen) return null;

  // Determine current public URL for customer catalog
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const catalogUrl = `${origin}${pathname}?catalogo=true`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const storeName = settings.appName || 'Vincint Omnia';
    const text = `¡Hola! 👋 Te invito a revisar nuestro *Catálogo Digital Oficial* de *${storeName}*.\n\nPuedes consultar nuestros productos disponibles, precios en dólares y bolívares a tasa oficial BCV, y enviar tu pedido directamente a nuestro WhatsApp:\n\n🔗 ${catalogUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // QR Code URL using standard QR server API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(catalogUrl)}&color=0f172a&bgcolor=ffffff`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Catálogo Digital para Clientes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparte tu catálogo en línea con tus clientes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Read-Only Guarantee Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <span className="font-bold">100% Solo Lectura & Seguro:</span> Tus clientes solo podrán ver fotos, nombres, precios y disponibilidad. Tus costos de compra, fletes y márgenes de ganancia están completamente ocultos.
            </div>
          </div>

          {/* Catalog Link Card */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Enlace directo del catálogo:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={catalogUrl}
                className="flex-1 px-3 py-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-500" />
                <span>Código QR para tu tienda física o mostrador:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="text-amber-600 text-[11px] underline"
              >
                {showQr ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            {showQr && (
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 dark:border-slate-700 w-fit mx-auto shadow-xs">
                <img
                  src={qrUrl}
                  alt="QR Catálogo"
                  className="w-40 h-40 object-contain rounded-lg"
                  loading="lazy"
                />
                <span className="text-[10px] text-slate-500 font-mono mt-1.5">
                  Escanea para ver catálogo
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {/* Share via WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            {/* Test / View as Customer */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCustomerView();
              }}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Eye className="w-4 h-4" />
              <span>Probar Vista de Cliente</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
