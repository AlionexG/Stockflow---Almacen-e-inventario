import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Database,
  CloudCheck,
  AlertCircle,
  Download,
  Upload,
} from 'lucide-react';
import { GoogleSheetsConfig, Product, SaleOrder, Expense, ShippingBatch, RetentionBatch } from '../types';
import { googleSheetsService } from '../services/googleSheetsService';
import { storageService } from '../services/storageService';
import { getAccessToken } from '../services/firebaseAuth';

interface SheetsSyncModalProps {
  isOpen: boolean;
  user: any | null;
  accessToken: string | null;
  config: GoogleSheetsConfig;
  products: Product[];
  shippingBatches: ShippingBatch[];
  retentionBatches: RetentionBatch[];
  orders: SaleOrder[];
  expenses: Expense[];
  onClose: () => void;
  onLoginGoogle: () => void;
  onUpdateConfig: (config: GoogleSheetsConfig) => void;
  onImportProducts: (imported: Product[]) => void;
}

export const SheetsSyncModal: React.FC<SheetsSyncModalProps> = ({
  isOpen,
  user,
  accessToken,
  config,
  products,
  shippingBatches,
  retentionBatches,
  orders,
  expenses,
  onClose,
  onLoginGoogle,
  onUpdateConfig,
  onImportProducts,
}) => {
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [customSheetId, setCustomSheetId] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  // 1. Create a new Google Spreadsheet in Drive
  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      onLoginGoogle();
      return;
    }

    try {
      setIsCreatingSheet(true);
      setStatusMessage({ type: 'info', text: 'Creando hoja de cálculo en tu Google Drive...' });

      const newSheet = await googleSheetsService.createSpreadsheet(accessToken, 'StockFlow - Almacén y Finanzas');
      
      // Immediately push current local data to it
      setStatusMessage({ type: 'info', text: 'Subiendo datos iniciales de productos, pedidos e historial...' });
      await googleSheetsService.syncAllToSheets(accessToken, newSheet.id, {
        products,
        shippingBatches,
        retentionBatches,
        orders,
        expenses,
        historyRecords: storageService.getHistoryRecords(),
      });

      const updatedConfig: GoogleSheetsConfig = {
        spreadsheetId: newSheet.id,
        spreadsheetName: newSheet.name,
        spreadsheetUrl: newSheet.url,
        lastSyncedAt: new Date().toISOString(),
        autoSync: true,
      };

      onUpdateConfig(updatedConfig);
      setStatusMessage({
        type: 'success',
        text: '¡Hoja de cálculo creada y sincronizada con éxito en tu Google Drive!',
      });
    } catch (err: any) {
      console.error('Error creating spreadsheet:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al crear la hoja en Google Drive.',
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // 2. Sync current state to existing sheet
  const handleManualSync = async () => {
    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      onLoginGoogle();
      return;
    }
    if (!config.spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'Primero crea o vincula una hoja de cálculo.' });
      return;
    }

    try {
      setIsSyncing(true);
      setStatusMessage({ type: 'info', text: 'Sincronizando productos, pedidos, gastos e historial con Google Sheets...' });

      const result = await googleSheetsService.syncAllToSheets(token, config.spreadsheetId, {
        products,
        shippingBatches,
        retentionBatches,
        orders,
        expenses,
        historyRecords: storageService.getHistoryRecords(),
      });

      onUpdateConfig({
        ...config,
        lastSyncedAt: result.lastSyncedAt,
      });

      setStatusMessage({
        type: 'success',
        text: '¡Sincronización en tiempo real completada exitosamente!',
      });
    } catch (err: any) {
      console.error('Error syncing to sheets:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al conectar con la hoja de Google Sheets.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Link existing spreadsheet ID
  const handleLinkExisting = () => {
    if (!customSheetId.trim()) return;
    
    // Extract ID from full URL if user pasted the full Google Sheets link
    let extractedId = customSheetId.trim();
    const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    const updatedConfig: GoogleSheetsConfig = {
      ...config,
      spreadsheetId: extractedId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${extractedId}/edit`,
      spreadsheetName: 'Hoja Vinculada de Google Sheets',
      lastSyncedAt: null,
    };
    onUpdateConfig(updatedConfig);
    setCustomSheetId('');
    setStatusMessage({
      type: 'success',
      text: 'Hoja vinculada correctamente. Presiona "Sincronizar ahora" para transferir datos.',
    });
  };

  // 4. Import products from Google Sheets
  const handleImportFromSheet = async () => {
    if (!accessToken || !config.spreadsheetId) return;

    try {
      setIsImporting(true);
      setStatusMessage({ type: 'info', text: 'Leyendo productos desde la pestaña "Productos"...' });
      const imported = await googleSheetsService.importProductsFromSheet(accessToken, config.spreadsheetId);
      if (imported.length > 0) {
        onImportProducts(imported);
        setStatusMessage({
          type: 'success',
          text: `Se importaron ${imported.length} productos desde Google Sheets con éxito.`,
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: 'No se encontraron filas con productos en la pestaña de la hoja.',
        });
      }
    } catch (err: any) {
      console.error('Error importing:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'No se pudo leer la hoja. Asegúrate de que existe la pestaña "Productos".',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Conexión a Base de Datos de Google Sheets
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Sincronización en tiempo real y respaldo permanente en tu cuenta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              ) : (
                <RefreshCw className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 animate-spin" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* User Auth Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center overflow-hidden border border-emerald-300 dark:border-emerald-700">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'Usuario'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.email?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {user.displayName || user.email}
                      <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Conectado
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Cuenta de Google requerida</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Inicia sesión para vincular o crear hojas en tu Google Drive
                  </div>
                </div>
              )}
            </div>

            {!user && (
              <button
                type="button"
                onClick={onLoginGoogle}
                className="gsi-material-button text-xs"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">Conectar con Google</span>
                </div>
              </button>
            )}
          </div>

          {/* Current Linked Sheet Status */}
          {config.spreadsheetId ? (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                    Hoja de Cálculo Activa
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {config.spreadsheetName}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    ID: {config.spreadsheetId}
                  </div>
                </div>

                {config.spreadsheetUrl && (
                  <a
                    href={config.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-slate-700 shadow-xs transition-colors"
                  >
                    <span>Abrir en Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Last synced info & Sync button */}
              <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Última sincronización: </span>
                  {config.lastSyncedAt
                    ? new Date(config.lastSyncedAt).toLocaleString('es-ES')
                    : 'Aún no sincronizado'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleManualSync}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-xs active:scale-95 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleImportFromSheet}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    title="Importar productos existentes de la hoja a la app"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Importar de Hoja</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* No sheet linked yet: actions to create or link */
            <div className="space-y-4">
              <div className="bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Crea tu Base de Datos en Google Sheets con 1 Click
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  La app creará automáticamente una hoja de cálculo en tu Google Drive con pestañas para 
                  <strong className="text-slate-800 dark:text-slate-200"> Productos</strong>, <strong className="text-slate-800 dark:text-slate-200">Ventas</strong> y <strong className="text-slate-800 dark:text-slate-200">Gastos</strong>, configurada con encabezados profesionales.
                </p>

                <button
                  type="button"
                  disabled={isCreatingSheet}
                  onClick={handleCreateNewSheet}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-200 dark:shadow-none active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isCreatingSheet ? 'Creando Hoja en tu Drive...' : 'Crear Hoja "StockFlow" en mi Drive'}
                  </span>
                </button>
              </div>

              {/* Or link existing ID */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  O Vincular una Hoja Existente de Google Sheets
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSheetId}
                    onChange={(e) => setCustomSheetId(e.target.value)}
                    placeholder="Pega el ID o la URL completa de tu Google Sheet..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleLinkExisting}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    Vincular
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Database Schemas Explanation */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/40">
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Estructura de la Base de Datos en Tiempo Real
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block">Pestaña "Productos"</span>
                <span>ID, SKU, Nombre, Costo, Empaque, Envío, Precio, Ganancia, Stock, Ubicación.</span>
              </div>
              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-sky-700 dark:text-sky-400 block">Pestaña "Ventas_Pedidos"</span>
                <span>N° Pedido, Fecha, Cliente, Items, Venta, Envío, Ganancia Neta, Courier, Guía.</span>
              </div>
              <div className="bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-amber-700 dark:text-amber-400 block">Pestaña "Gastos_Operativos"</span>
                <span>Fecha, Categoría, Concepto, Monto ($), Notas para el cálculo fiscal.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
