import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  GitMerge,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Clock,
  Laptop,
  Cloud,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { SyncComparisonSummary } from '../services/syncConflictEngine';
import { FullSyncData } from '../services/googleSheetsService';

interface SyncConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: SyncComparisonSummary | null;
  localData: FullSyncData;
  cloudData: FullSyncData;
  cloudSheetName?: string;
  onMerge: () => Promise<void>;
  onDownloadCloud: () => Promise<void>;
  onOverwriteCloud: () => Promise<void>;
  onClearCloud: () => Promise<void>;
  isProcessing?: boolean;
}

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  isOpen,
  onClose,
  comparison,
  localData,
  cloudData,
  cloudSheetName = 'Google Sheets',
  onMerge,
  onDownloadCloud,
  onOverwriteCloud,
  onClearCloud,
  isProcessing = false,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  if (!isOpen || !comparison) return null;

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Sin fecha registrada';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoStr;
    }
  };

  const handleAction = async (actionName: string, actionFn: () => Promise<void>) => {
    setActionInProgress(actionName);
    try {
      await actionFn();
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/80 text-white relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <GitMerge className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold">
                    Sincronización Multidispositivo
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Misma Cuenta Google
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Detectamos diferencias entre este dispositivo y tu base de datos en Google Sheets.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Comparison Cards: Este Dispositivo vs Google Sheets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Local Device Card */}
            <div className={`p-4 rounded-2xl border transition-all ${
              comparison.newerSource === 'local'
                ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <Laptop className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>Este Dispositivo (Local)</span>
                </div>
                {comparison.newerSource === 'local' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Más Reciente ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60">
                    Local
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-slate-200/80 dark:border-slate-700/60 text-center">
                <div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {comparison.localCounts.products}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Productos</div>
                </div>
                <div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {comparison.localCounts.orders}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Pedidos</div>
                </div>
                <div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {comparison.localCounts.expenses}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Gastos</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Último cambio: {formatDate(comparison.localLatestTimestamp)}</span>
              </div>
            </div>

            {/* Cloud Google Sheets Card */}
            <div className={`p-4 rounded-2xl border transition-all ${
              comparison.newerSource === 'cloud'
                ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate" title={cloudSheetName}>Google Sheets (Nube)</span>
                </div>
                {comparison.newerSource === 'cloud' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Más Reciente ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60">
                    Nube
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-slate-200/80 dark:border-slate-700/60 text-center">
                <div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {comparison.cloudCounts.products}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Productos</div>
                </div>
                <div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {comparison.cloudCounts.orders}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Pedidos</div>
                </div>
                <div>
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {comparison.cloudCounts.expenses}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Gastos</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Último cambio: {formatDate(comparison.cloudLatestTimestamp)}</span>
              </div>
            </div>
          </div>

          {/* Action Choice 1: Combinar (Recomendado) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 dark:from-amber-500/15 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-500/40 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      1. Combinar Datos (Fusión Inteligente por Timestamp)
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Une la información de ambos dispositivos sin borrar nada. Si un producto o pedido se modificó en dos lugares,
                    el sistema prioriza automáticamente la versión con fecha y hora más reciente.
                  </p>
                </div>
              </div>
            </div>

            {/* Merge Preview metrics */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 p-2.5 rounded-xl border border-amber-500/20">
              <span className="text-amber-800 dark:text-amber-300">Resultado estimado:</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 font-bold">
                {comparison.mergePreview.totalMergedProducts} productos en total
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">
                +{comparison.mergePreview.newProductsFromCloud} de la nube
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">
                +{comparison.mergePreview.newProductsFromLocal} locales
              </span>
              {comparison.mergePreview.updatedProductsByTimestamp > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold">
                  {comparison.mergePreview.updatedProductsByTimestamp} actualizados por fecha
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleAction('merge', onMerge)}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {actionInProgress === 'merge' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Combinando datos con Google Sheets...</span>
                </>
              ) : (
                <>
                  <GitMerge className="w-4 h-4" />
                  <span>Combinar Datos y Sincronizar en Ambos Dispositivos</span>
                </>
              )}
            </button>
          </div>

          {/* Action Choices 2 & 3: Descargar o Sobrescribir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opción 2: Descargar de la Nube */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                  <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>2. Descargar de la Nube</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Reemplaza los datos locales de este dispositivo con la versión guardada en Google Sheets.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAction('download', onDownloadCloud)}
                disabled={isProcessing}
                className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionInProgress === 'download' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Descargar de Google Sheets</span>
              </button>
            </div>

            {/* Opción 3: Sobrescribir la Nube */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>3. Sobrescribir en la Nube</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Sube los datos de este dispositivo a Google Sheets, reemplazando lo que haya en la nube.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAction('overwrite', onOverwriteCloud)}
                disabled={isProcessing}
                className="w-full py-2 px-3 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionInProgress === 'overwrite' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Subir y Sobrescribir Nube</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Eliminar datos de la nube y crear otros */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                disabled={isProcessing}
                className="w-full py-2 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>¿Deseas eliminar los datos de la nube y empezar una base de datos nueva?</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2.5 animate-fadeIn">
                <div className="flex items-start gap-2 text-rose-900 dark:text-rose-200 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">¿Confirmas que deseas limpiar la base de datos en Google Sheets?</span>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                      Esta acción vaciará todos los registros en Google Drive para permitirte iniciar de cero sin datos antiguos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('clear', onClearCloud)}
                    disabled={isProcessing}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {actionInProgress === 'clear' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Confirmar: Vaciar Nube y Crear Nueva</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
