import React, { useState, useEffect, useCallback } from 'react';
import { type User } from 'firebase/auth';
import { Product, SaleOrder, Expense, GoogleSheetsConfig, ShippingBatch, RetentionBatch, AppSettings, HistoryRecord } from './types';
import { storageService } from './services/storageService';
import { initAuth, googleSignIn, logout, getAccessToken, setCachedAccessToken } from './services/firebaseAuth';
import { googleSheetsService } from './services/googleSheetsService';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { ProductModal } from './components/ProductModal';
import { BatchesManager } from './components/BatchesManager';
import { SalesManager } from './components/SalesManager';
import { ExpensesManager } from './components/ExpensesManager';
import { CalculatorModal } from './components/CalculatorModal';
import { SheetsSyncModal } from './components/SheetsSyncModal';
import { ReportsModal } from './components/ReportsModal';
import { SettingsModal } from './components/SettingsModal';
import { ExpenseModal } from './components/ExpenseModal';
import { ActivityHistoryView } from './components/ActivityHistoryView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SyncConflictModal } from './components/SyncConflictModal';
import { CustomerCatalog } from './components/CustomerCatalog';
import { ShareCatalogModal } from './components/ShareCatalogModal';
import { syncConflictEngine, SyncComparisonSummary } from './services/syncConflictEngine';
import { FullSyncData } from './services/googleSheetsService';
import { CloudCheck, RefreshCw, WifiOff } from 'lucide-react';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'products' | 'batches' | 'sales' | 'expenses' | 'history'>('dashboard');

  // Application Data (Vincint Omnia structure)
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [shippingBatches, setShippingBatches] = useState<ShippingBatch[]>(() => storageService.getShippingBatches());
  const [retentionBatches, setRetentionBatches] = useState<RetentionBatch[]>(() => storageService.getRetentionBatches());
  const [orders, setOrders] = useState<SaleOrder[]>(() => storageService.getOrders());
  const [expenses, setExpenses] = useState<Expense[]>(() => storageService.getExpenses());
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => storageService.getHistoryRecords());
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => storageService.getSheetsConfig());
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getAppSettings());
  const [currency, setCurrency] = useState<string>(() => storageService.getCurrency());

  // Auth & Sync State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [hasPendingSync, setHasPendingSync] = useState<boolean>(() => storageService.hasPendingSync());

  // Multi-Device Sync Conflict State
  const [isSyncConflictModalOpen, setIsSyncConflictModalOpen] = useState(false);
  const [conflictComparison, setConflictComparison] = useState<SyncComparisonSummary | null>(null);
  const [conflictLocalData, setConflictLocalData] = useState<FullSyncData | null>(null);
  const [conflictCloudData, setConflictCloudData] = useState<FullSyncData | null>(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'google' | 'themes' | 'payments' | 'mobile' | 'backup'>('general');

  // Customer Catalog State & URL Detection
  const [isCustomerMode, setIsCustomerMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isParam = urlParams.get('catalogo') === 'true' || 
                      urlParams.get('catalogo') === '1' ||
                      urlParams.get('mode') === 'catalogo' ||
                      urlParams.get('view') === 'catalogo' ||
                      urlParams.get('cliente') === 'true';
      const isPath = window.location.pathname.includes('/catalogo') || window.location.pathname.includes('/catalog');
      const isHash = window.location.hash.includes('catalogo') || window.location.hash.includes('catalog');
      return isParam || isPath || isHash;
    }
    return false;
  });
  const [isShareCatalogOpen, setIsShareCatalogOpen] = useState(false);

  const handleOpenCustomerMode = () => {
    setIsCustomerMode(true);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('catalogo', 'true');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleExitCustomerMode = () => {
    setIsCustomerMode(false);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.delete('catalogo');
      url.searchParams.delete('mode');
      url.searchParams.delete('view');
      url.searchParams.delete('cliente');
      window.history.pushState({}, '', url.toString());
    }
  };

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        if (currentUser && token) {
          // Verify multi-device synchronization upon session restore
          await performMultiDeviceSyncCheck(token);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Multi-Device synchronization engine and conflict resolution
  const performMultiDeviceSyncCheck = useCallback(
    async (token: string, explicitSpreadsheetId?: string, isUserTriggered = false) => {
      try {
        setIsAutoSyncing(true);
        let targetSpreadsheetId = explicitSpreadsheetId || sheetsConfig.spreadsheetId;

        // 1. If this device doesn't have a linked spreadsheet yet, search Google Drive for existing spreadsheets!
        if (!targetSpreadsheetId) {
          setSyncBanner('🔍 Buscando tu base de datos de inventario en Google Drive...');
          const driveFiles = await googleSheetsService.findUserSpreadsheets(token);
          if (driveFiles.length > 0) {
            const matched = driveFiles[0];
            targetSpreadsheetId = matched.id;
            const updatedConfig: GoogleSheetsConfig = {
              ...sheetsConfig,
              spreadsheetId: matched.id,
              spreadsheetName: matched.name,
              spreadsheetUrl: matched.url,
              lastSyncedAt: matched.modifiedTime || null,
            };
            setSheetsConfig(updatedConfig);
            storageService.saveSheetsConfig(updatedConfig);
            setSyncBanner(`✓ Base de datos vinculada: "${matched.name}"`);
          }
        }

        if (!targetSpreadsheetId) {
          if (isUserTriggered) {
            setSyncBanner('ℹ️ No hay hoja vinculada. Crea o vincula una en Configuración > Google Sheets.');
            setTimeout(() => setSyncBanner(null), 4000);
          }
          return;
        }

        // 2. Fetch cloud data and compare with local data
        setSyncBanner('☁️ Comprobando sincronización multidispositivo con Google Sheets...');
        const cloudData = await googleSheetsService.importAllFromSheet(token, targetSpreadsheetId);
        const localData: FullSyncData = storageService.getAllData();

        // 3. Compare with syncConflictEngine
        const comparison = syncConflictEngine.compare(localData, cloudData);

        if (comparison.hasDifferences) {
          setConflictComparison(comparison);
          setConflictLocalData(localData);
          setConflictCloudData(cloudData);
          setIsSyncConflictModalOpen(true);
          setSyncBanner(null);
        } else {
          const updatedConfig = {
            ...sheetsConfig,
            spreadsheetId: targetSpreadsheetId,
            lastSyncedAt: new Date().toISOString(),
          };
          setSheetsConfig(updatedConfig);
          storageService.saveSheetsConfig(updatedConfig);
          setSyncBanner('✓ Todos tus datos están sincronizados con Google Sheets');
          setTimeout(() => setSyncBanner(null), 3000);
        }
      } catch (err: any) {
        console.warn('Sync check warning:', err);
        if (isUserTriggered) {
          alert('Error al comprobar sincronización: ' + (err?.message || 'Error de conexión'));
        }
      } finally {
        setIsAutoSyncing(false);
      }
    },
    [sheetsConfig]
  );

  // Background Google Sheets Sync Helper (with offline deferred sync support and history sync)
  const triggerSheetsSync = useCallback(
    async (
      currentProducts: Product[],
      currentShippingBatches: ShippingBatch[],
      currentRetentionBatches: RetentionBatch[],
      currentOrders: SaleOrder[],
      currentExpenses: Expense[],
      currentHistoryRecords?: HistoryRecord[]
    ) => {
      // If offline, flag pending sync and notify user that data is saved locally
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        storageService.setPendingSync(true);
        setHasPendingSync(true);
        setSyncBanner('📱 Modo offline: Guardado localmente. Se sincronizará con Google Sheets al restablecer conexión.');
        setTimeout(() => setSyncBanner(null), 4500);
        return;
      }

      const token = await getAccessToken();
      if (!token || !sheetsConfig.spreadsheetId || !sheetsConfig.autoSync) {
        return;
      }

      try {
        setIsAutoSyncing(true);
        const historyToSync = currentHistoryRecords !== undefined ? currentHistoryRecords : storageService.getHistoryRecords();
        const res = await googleSheetsService.syncAllToSheets(token, sheetsConfig.spreadsheetId, {
          products: currentProducts,
          shippingBatches: currentShippingBatches,
          retentionBatches: currentRetentionBatches,
          orders: currentOrders,
          expenses: currentExpenses,
          historyRecords: historyToSync,
        });

        const updatedConfig = {
          ...sheetsConfig,
          lastSyncedAt: res.lastSyncedAt,
        };
        setSheetsConfig(updatedConfig);
        storageService.saveSheetsConfig(updatedConfig);
        storageService.setPendingSync(false);
        setHasPendingSync(false);

        setSyncBanner('✓ Cambios sincronizados con Google Sheets (incluido Historial)');
        setTimeout(() => setSyncBanner(null), 3000);
      } catch (err: any) {
        console.warn('Auto-sync notice:', err);
        // Queue deferred sync when network error occurs
        storageService.setPendingSync(true);
        setHasPendingSync(true);
        setSyncBanner('⚠️ Guardado localmente. Sincronización diferida programada al recuperar señal.');
        setTimeout(() => setSyncBanner(null), 4000);
      } finally {
        setIsAutoSyncing(false);
      }
    },
    [sheetsConfig]
  );

  // Network connectivity listener for offline persistence and deferred synchronization
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (storageService.hasPendingSync()) {
        setSyncBanner('🌐 Conexión recuperada: Ejecutando sincronización diferida con Google Sheets...');
        triggerSheetsSync(
          storageService.getProducts(),
          storageService.getShippingBatches(),
          storageService.getRetentionBatches(),
          storageService.getOrders(),
          storageService.getExpenses(),
          storageService.getHistoryRecords()
        );
      } else {
        setSyncBanner('Conexión reanudada (En línea)');
        setTimeout(() => setSyncBanner(null), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncBanner('📱 Modo sin conexión activo: Toda la app funciona con persistencia local.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check: if already online and has pending sync from earlier offline session
    if (typeof navigator !== 'undefined' && navigator.onLine && storageService.hasPendingSync()) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSheetsSync]);

  // Auth Actions
  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setCachedAccessToken(result.accessToken);
        // Automatically check multi-device synchronization and resolve database desync
        await performMultiDeviceSyncCheck(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      alert('No se pudo completar el inicio de sesión con Google: ' + (err?.message || 'Error desconocido'));
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  // Conflict Resolution Handlers
  const handleMergeConflict = async () => {
    if (!conflictLocalData || !conflictCloudData) return;
    setIsResolvingConflict(true);
    try {
      const merged = syncConflictEngine.merge(conflictLocalData, conflictCloudData);
      storageService.saveAllData(merged);
      setProducts(merged.products);
      setShippingBatches(merged.shippingBatches);
      setRetentionBatches(merged.retentionBatches);
      setOrders(merged.orders);
      setExpenses(merged.expenses);
      setHistoryRecords(storageService.getHistoryRecords());

      const token = await getAccessToken();
      if (token && sheetsConfig.spreadsheetId) {
        await googleSheetsService.syncAllToSheets(token, sheetsConfig.spreadsheetId, merged);
        const updatedConfig = {
          ...sheetsConfig,
          lastSyncedAt: new Date().toISOString(),
        };
        setSheetsConfig(updatedConfig);
        storageService.saveSheetsConfig(updatedConfig);
      }

      setIsSyncConflictModalOpen(false);
      setSyncBanner('✓ Fusión completada: Los registros más recientes por timestamp se combinaron exitosamente.');
      setTimeout(() => setSyncBanner(null), 4000);
    } catch (err: any) {
      console.error('Merge error:', err);
      alert('Error al fusionar datos: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsResolvingConflict(false);
    }
  };

  const handleDownloadCloudConflict = async () => {
    if (!conflictCloudData) return;
    setIsResolvingConflict(true);
    try {
      storageService.saveAllData(conflictCloudData);
      setProducts(conflictCloudData.products);
      setShippingBatches(conflictCloudData.shippingBatches);
      setRetentionBatches(conflictCloudData.retentionBatches);
      setOrders(conflictCloudData.orders);
      setExpenses(conflictCloudData.expenses);
      setHistoryRecords(storageService.getHistoryRecords());

      const updatedConfig = {
        ...sheetsConfig,
        lastSyncedAt: new Date().toISOString(),
      };
      setSheetsConfig(updatedConfig);
      storageService.saveSheetsConfig(updatedConfig);

      setIsSyncConflictModalOpen(false);
      setSyncBanner('✓ Datos de Google Sheets descargados y guardados en este dispositivo.');
      setTimeout(() => setSyncBanner(null), 4000);
    } catch (err: any) {
      console.error('Download cloud error:', err);
      alert('Error al descargar datos: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsResolvingConflict(false);
    }
  };

  const handleOverwriteCloudConflict = async () => {
    if (!conflictLocalData) return;
    setIsResolvingConflict(true);
    try {
      const token = await getAccessToken();
      if (token && sheetsConfig.spreadsheetId) {
        await googleSheetsService.syncAllToSheets(token, sheetsConfig.spreadsheetId, conflictLocalData);
        const updatedConfig = {
          ...sheetsConfig,
          lastSyncedAt: new Date().toISOString(),
        };
        setSheetsConfig(updatedConfig);
        storageService.saveSheetsConfig(updatedConfig);
      }

      setIsSyncConflictModalOpen(false);
      setSyncBanner('✓ Google Sheets sobrescrito con los datos de este dispositivo.');
      setTimeout(() => setSyncBanner(null), 4000);
    } catch (err: any) {
      console.error('Overwrite cloud error:', err);
      alert('Error al sobrescribir nube: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsResolvingConflict(false);
    }
  };

  const handleClearCloudData = async () => {
    const token = await getAccessToken();
    if (!token || !sheetsConfig.spreadsheetId) {
      alert('Debes estar conectado a Google y tener una hoja vinculada.');
      return;
    }
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar los datos de tu hoja en Google Sheets?\n\nEsta acción vaciará los registros de la nube para que puedas iniciar una base de datos nueva o sincronizar desde cero.'
    );
    if (!confirmed) return;

    try {
      setIsAutoSyncing(true);
      await googleSheetsService.clearCloudData(token, sheetsConfig.spreadsheetId);

      const updatedConfig = {
        ...sheetsConfig,
        lastSyncedAt: null,
      };
      setSheetsConfig(updatedConfig);
      storageService.saveSheetsConfig(updatedConfig);

      setIsSyncConflictModalOpen(false);
      setSyncBanner('✓ Datos de Google Sheets eliminados. La hoja está lista para nuevos datos.');
      setTimeout(() => setSyncBanner(null), 4000);
    } catch (err: any) {
      console.error('Error clearing cloud data:', err);
      alert('Error al eliminar datos de la nube: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // Product Actions
  const handleSaveProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'itemNumber'>) => {
    let updatedProducts: Product[];
    if (productToEdit) {
      const updated = {
        ...productToEdit,
        ...productData,
      };
      storageService.updateProduct(updated);
      updatedProducts = storageService.getProducts();
    } else {
      storageService.addProduct(productData);
      updatedProducts = storageService.getProducts();
    }

    setProducts(updatedProducts);
    setHistoryRecords(storageService.getHistoryRecords());
    setIsProductModalOpen(false);
    setProductToEdit(null);
    triggerSheetsSync(updatedProducts, shippingBatches, retentionBatches, orders, expenses);
  };

  const handleDeleteProduct = (productId: string) => {
    storageService.deleteProduct(productId);
    const updated = storageService.getProducts();
    setProducts(updated);
    // Notar que el historial y el primer cambio del producto permanecen intactos
    setHistoryRecords(storageService.getHistoryRecords());
    triggerSheetsSync(updated, shippingBatches, retentionBatches, orders, expenses);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    storageService.updateStock(productId, newStock);
    const updated = storageService.getProducts();
    setProducts(updated);
    setHistoryRecords(storageService.getHistoryRecords());
    triggerSheetsSync(updated, shippingBatches, retentionBatches, orders, expenses);
  };

  const handleAddStock = (productId: string, quantityToAdd: number, note?: string) => {
    const res = storageService.addStock(productId, quantityToAdd, note);
    if (res) {
      const updated = storageService.getProducts();
      setProducts(updated);
      setHistoryRecords(storageService.getHistoryRecords());
      triggerSheetsSync(updated, shippingBatches, retentionBatches, orders, expenses);
    }
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    storageService.saveProducts(updatedProducts);
    setProducts(updatedProducts);
    setHistoryRecords(storageService.getHistoryRecords());
    triggerSheetsSync(updatedProducts, shippingBatches, retentionBatches, orders, expenses);
  };

  const handleDeleteHistoryRecord = (recordId: string) => {
    storageService.deleteHistoryRecord(recordId);
    const updated = storageService.getHistoryRecords();
    setHistoryRecords(updated);
    triggerSheetsSync(products, shippingBatches, retentionBatches, orders, expenses, updated);
  };

  const handleClearHistory = () => {
    storageService.clearHistoryRecords();
    setHistoryRecords([]);
    triggerSheetsSync(products, shippingBatches, retentionBatches, orders, expenses, []);
  };

  // Shipping Batch Actions
  const handleAddShippingBatch = (batchData: Omit<ShippingBatch, 'id' | 'date' | 'unitShipping'>) => {
    storageService.addShippingBatch(batchData);
    const updated = storageService.getShippingBatches();
    setShippingBatches(updated);
    triggerSheetsSync(products, updated, retentionBatches, orders, expenses);
  };

  const handleUpdateShippingBatch = (batch: ShippingBatch) => {
    storageService.updateShippingBatch(batch);
    const updated = storageService.getShippingBatches();
    setShippingBatches(updated);
    triggerSheetsSync(products, updated, retentionBatches, orders, expenses);
  };

  const handleDeleteShippingBatch = (batchId: string) => {
    storageService.deleteShippingBatch(batchId);
    const updated = storageService.getShippingBatches();
    setShippingBatches(updated);
    triggerSheetsSync(products, updated, retentionBatches, orders, expenses);
  };

  // Retention Batch Actions
  const handleAddRetentionBatch = (batchData: Omit<RetentionBatch, 'id' | 'date' | 'unitRetention'>) => {
    storageService.addRetentionBatch(batchData);
    const updated = storageService.getRetentionBatches();
    setRetentionBatches(updated);
    triggerSheetsSync(products, shippingBatches, updated, orders, expenses);
  };

  const handleUpdateRetentionBatch = (batch: RetentionBatch) => {
    storageService.updateRetentionBatch(batch);
    const updated = storageService.getRetentionBatches();
    setRetentionBatches(updated);
    triggerSheetsSync(products, shippingBatches, updated, orders, expenses);
  };

  const handleDeleteRetentionBatch = (batchId: string) => {
    storageService.deleteRetentionBatch(batchId);
    const updated = storageService.getRetentionBatches();
    setRetentionBatches(updated);
    triggerSheetsSync(products, shippingBatches, updated, orders, expenses);
  };

  // Order Actions
  const handleAddOrder = (orderData: Omit<SaleOrder, 'id' | 'orderNumber'>) => {
    storageService.addOrder(orderData);
    const updatedOrders = storageService.getOrders();
    const updatedProducts = storageService.getProducts();
    setOrders(updatedOrders);
    setProducts(updatedProducts);
    setHistoryRecords(storageService.getHistoryRecords());
    triggerSheetsSync(updatedProducts, shippingBatches, retentionBatches, updatedOrders, expenses);
  };

  const handleDeleteOrder = (orderId: string) => {
    storageService.deleteOrder(orderId);
    const updatedOrders = storageService.getOrders();
    setOrders(updatedOrders);
    triggerSheetsSync(products, shippingBatches, retentionBatches, updatedOrders, expenses);
  };

  const handleUpdateOrder = (order: SaleOrder) => {
    storageService.updateOrder(order);
    const updatedOrders = storageService.getOrders();
    setOrders(updatedOrders);
    triggerSheetsSync(products, shippingBatches, retentionBatches, updatedOrders, expenses);
  };

  // Expense Actions
  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    storageService.addExpense(expenseData);
    const updatedExpenses = storageService.getExpenses();
    setExpenses(updatedExpenses);
    setHistoryRecords(storageService.getHistoryRecords());
    triggerSheetsSync(products, shippingBatches, retentionBatches, orders, updatedExpenses);
  };

  const handleDeleteExpense = (expenseId: string) => {
    storageService.deleteExpense(expenseId);
    const updatedExpenses = storageService.getExpenses();
    setExpenses(updatedExpenses);
    triggerSheetsSync(products, shippingBatches, retentionBatches, orders, updatedExpenses);
  };

  // Sheets Config Update
  const handleUpdateSheetsConfig = (newConfig: GoogleSheetsConfig) => {
    setSheetsConfig(newConfig);
    storageService.saveSheetsConfig(newConfig);
  };

  const handleImportProducts = (imported: Product[]) => {
    const merged = [...imported, ...products.filter((p) => !imported.some((imp) => imp.name === p.name))];
    storageService.saveProducts(merged);
    setProducts(merged);
  };

  const handleChangeCurrency = (curr: string) => {
    setCurrency(curr);
    storageService.setCurrency(curr);
  };

  const handleOpenSettings = (tab: 'general' | 'google' | 'themes' | 'payments' | 'mobile' | 'backup' = 'general') => {
    setSettingsTab(tab);
    setIsSettingsModalOpen(true);
  };

  const handleClearAllData = () => {
    storageService.clearAllData();
    setProducts([]);
    setShippingBatches([]);
    setRetentionBatches([]);
    setOrders([]);
    setExpenses([]);
  };

  const handleLoadDemoData = () => {
    storageService.loadDemoData();
    setProducts(storageService.getProducts());
    setShippingBatches(storageService.getShippingBatches());
    setRetentionBatches(storageService.getRetentionBatches());
    setOrders(storageService.getOrders());
    setExpenses(storageService.getExpenses());
  };


  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storageService.saveAppSettings(newSettings);
    if (newSettings.currency && newSettings.currency !== currency) {
      setCurrency(newSettings.currency);
      storageService.setCurrency(newSettings.currency);
    }
  };

  // Synchronize dark mode and custom theme styles dynamically on <html> element
  useEffect(() => {
    const root = document.documentElement;

    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const themeHexMap: Record<string, string> = {
      amber: '#f59e0b',
      emerald: '#10b981',
      indigo: '#6366f1',
      purple: '#a855f7',
      rose: '#f43f5e',
      sky: '#0ea5e9',
      slate: '#475569',
      custom: settings.customAccentColor || '#f59e0b',
    };

    const primaryHex = settings.theme === 'custom'
      ? (settings.customAccentColor || '#f59e0b')
      : (themeHexMap[settings.theme] || '#f59e0b');

    // Parse hex to rgb for rgba transparency
    let r = 245, g = 158, b = 11;
    if (primaryHex.startsWith('#') && primaryHex.length === 7) {
      r = parseInt(primaryHex.slice(1, 3), 16) || 245;
      g = parseInt(primaryHex.slice(3, 5), 16) || 158;
      b = parseInt(primaryHex.slice(5, 7), 16) || 11;
    }

    root.style.setProperty('--theme-accent', primaryHex);
    root.style.setProperty('--theme-accent-subtle', `rgba(${r}, ${g}, ${b}, 0.12)`);
    root.style.setProperty('--theme-accent-border', `rgba(${r}, ${g}, ${b}, 0.35)`);
    root.style.setProperty('--theme-accent-text', settings.darkMode ? '#fbbf24' : primaryHex);

    // Font style
    if (settings.fontStyle === 'serif') {
      root.classList.add('font-serif-theme');
      root.classList.remove('font-sans-theme');
    } else {
      root.classList.add('font-sans-theme');
      root.classList.remove('font-serif-theme');
    }

    // Density
    if (settings.density === 'compact') {
      root.classList.add('density-compact');
      root.classList.remove('density-comfortable');
    } else {
      root.classList.add('density-comfortable');
      root.classList.remove('density-compact');
    }
  }, [settings.darkMode, settings.theme, settings.customAccentColor, settings.fontStyle, settings.density]);

  const handleToggleDarkMode = () => {
    const nextSettings: AppSettings = {
      ...settings,
      darkMode: !settings.darkMode,
    };
    handleUpdateSettings(nextSettings);
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // Render 100% dedicated, read-only Customer Catalog App when customer mode is active
  if (isCustomerMode) {
    return (
      <CustomerCatalog
        products={products}
        settings={settings}
        currency={currency}
        onExitCatalog={handleExitCustomerMode}
        onToggleDarkMode={handleToggleDarkMode}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 md:pb-12 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        sheetsConfig={sheetsConfig}
        settings={settings}
        lowStockCount={lowStockCount}
        isOnline={isOnline}
        hasPendingSync={hasPendingSync}
        onTriggerSync={() => triggerSheetsSync(products, shippingBatches, retentionBatches, orders, expenses)}
        onOpenSettings={() => handleOpenSettings('general')}
        onOpenCalculator={() => setIsCalculatorModalOpen(true)}
        onOpenReports={() => setIsReportsModalOpen(true)}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenCustomerCatalog={handleOpenCustomerMode}
        onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
      />

      {/* Real-time Google Sheets sync notification banner */}
      {(syncBanner || isAutoSyncing) && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 animate-in fade-in">
          {isAutoSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Sincronizando cambios con tu hoja de Google Sheets en tiempo real...</span>
            </>
          ) : (
            <>
              <CloudCheck className="w-4 h-4" />
              <span>{syncBanner}</span>
            </>
          )}
        </div>
      )}

      {/* Main Container - Optimized for Mobile, Tablet, and Widescreen PC without horizontal overflow */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1560px] w-full mx-auto px-2.5 sm:px-6 lg:px-8 pt-2.5 sm:pt-6 pb-24 md:pb-8 transition-all overflow-x-hidden">
        {currentTab === 'dashboard' && (
          <Dashboard
            products={products}
            orders={orders}
            expenses={expenses}
            currency={currency}
            settings={settings}
            historyRecords={historyRecords}
            onOpenNewProduct={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            onOpenNewExpense={() => setIsExpenseModalOpen(true)}
            onOpenCalculator={() => setIsCalculatorModalOpen(true)}
            onOpenReports={() => setIsReportsModalOpen(true)}
            onOpenSheetsModal={() => handleOpenSettings('google')}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'products' && (
          <ProductList
            products={products}
            shippingBatches={shippingBatches}
            currency={currency}
            settings={settings}
            onEditProduct={(prod) => {
              setProductToEdit(prod);
              setIsProductModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onUpdateStock={handleUpdateStock}
            onAddStock={handleAddStock}
            onOpenNewProduct={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            onUpdateProducts={handleUpdateProducts}
          />
        )}

        {currentTab === 'batches' && (
          <BatchesManager
            shippingBatches={shippingBatches}
            retentionBatches={retentionBatches}
            products={products}
            currency={currency}
            onAddShippingBatch={handleAddShippingBatch}
            onUpdateShippingBatch={handleUpdateShippingBatch}
            onDeleteShippingBatch={handleDeleteShippingBatch}
            onAddRetentionBatch={handleAddRetentionBatch}
            onUpdateRetentionBatch={handleUpdateRetentionBatch}
            onDeleteRetentionBatch={handleDeleteRetentionBatch}
          />
        )}

        {currentTab === 'sales' && (
          <SalesManager
            orders={orders}
            products={products}
            currency={currency}
            settings={settings}
            onOpenSettings={handleOpenSettings}
            onAddOrder={handleAddOrder}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
            isOpenNewOrderModal={isNewOrderModalOpen}
            onCloseNewOrderModal={() => setIsNewOrderModalOpen(false)}
            onOpenNewOrderModal={() => setIsNewOrderModalOpen(true)}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesManager
            expenses={expenses}
            currency={currency}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {currentTab === 'history' && (
          <ActivityHistoryView
            products={products}
            orders={orders}
            expenses={expenses}
            currency={currency}
            historyRecords={historyRecords}
            onDeleteHistoryRecord={handleDeleteHistoryRecord}
            onClearHistory={handleClearHistory}
            onSelectTab={setCurrentTab}
            onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            onOpenNewProduct={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            onOpenNewExpense={() => setIsExpenseModalOpen(true)}
          />
        )}
      </main>

      {/* MODALS */}
      {/* 1. Product Register & Edit Modal with Vincint Omnia structure & Batch Selector */}
      <ProductModal
        isOpen={isProductModalOpen}
        productToEdit={productToEdit}
        shippingBatches={shippingBatches}
        retentionBatches={retentionBatches}
        currency={currency}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* 2. Standalone Profit & Shipping Calculator */}
      <CalculatorModal
        isOpen={isCalculatorModalOpen}
        currency={currency}
        onClose={() => setIsCalculatorModalOpen(false)}
        onApplyToNewProduct={(data) => {
          setProductToEdit({
            id: '',
            itemNumber: products.length + 1,
            sku: `VO-${Math.floor(1000 + Math.random() * 9000)}`,
            name: '',
            category: 'Joyería',
            photoUrl: '',
            itemsCount: 1,
            piecesPerProduct: 1,
            productPrice: data.costPrice,
            totalProductPrice: data.costPrice,
            unitPriceCost: data.costPrice,
            packagingCarton: data.packagingCost,
            packagingBolsita: 0,
            packagingLogo: 0,
            shippingCostUnit: data.shippingCost,
            retentionCostUnit: 0.30,
            totalQuotation: data.costPrice + data.packagingCost + data.shippingCost + 0.30,
            unitQuotation: data.costPrice + data.packagingCost + data.shippingCost + 0.30,
            sellingPriceUnit: data.sellingPrice,
            grossAmount: data.sellingPrice,
            netProfit: data.sellingPrice - (data.costPrice + data.packagingCost + data.shippingCost + 0.30),
            profitMarginPercent: ((data.sellingPrice - (data.costPrice + data.packagingCost + data.shippingCost + 0.30)) / (data.costPrice + data.packagingCost + data.shippingCost + 0.30)) * 100,
            stock: 20,
            minStock: 5,
            createdAt: '',
            updatedAt: '',
          });
          setIsProductModalOpen(true);
        }}
      />

      {/* 3. Google Sheets Real-Time Sync Modal */}
      <SheetsSyncModal
        isOpen={isSheetsModalOpen}
        user={user}
        accessToken={accessToken}
        config={sheetsConfig}
        products={products}
        shippingBatches={shippingBatches}
        retentionBatches={retentionBatches}
        orders={orders}
        expenses={expenses}
        onClose={() => setIsSheetsModalOpen(false)}
        onLoginGoogle={handleGoogleLogin}
        onUpdateConfig={handleUpdateSheetsConfig}
        onImportProducts={handleImportProducts}
      />

      {/* 4. Monthly Reports Generator (PDF & Excel) */}
      <ReportsModal
        isOpen={isReportsModalOpen}
        products={products}
        shippingBatches={shippingBatches}
        retentionBatches={retentionBatches}
        orders={orders}
        expenses={expenses}
        currency={currency}
        settings={settings}
        onClose={() => setIsReportsModalOpen(false)}
      />

      {/* Standalone Expense Modal for 1-Click Quick Add from Dashboard */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        currency={currency}
        onAddExpense={handleAddExpense}
      />

      {/* 5. App Settings, Google Connection & Visual Themes Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        initialTab={settingsTab}
        settings={settings}
        user={user}
        accessToken={accessToken}
        sheetsConfig={sheetsConfig}
        products={products}
        shippingBatches={shippingBatches}
        retentionBatches={retentionBatches}
        orders={orders}
        expenses={expenses}
        onClose={() => setIsSettingsModalOpen(false)}
        onUpdateSettings={handleUpdateSettings}
        onLoginGoogle={handleGoogleLogin}
        onLogoutGoogle={handleLogout}
        onUpdateSheetsConfig={handleUpdateSheetsConfig}
        onImportProducts={handleImportProducts}
        onClearAllData={handleClearAllData}
        onLoadDemoData={handleLoadDemoData}
        onOpenConflictModal={async () => {
          const token = accessToken || (await getAccessToken());
          if (token) {
            setAccessToken(token);
            performMultiDeviceSyncCheck(token, undefined, true);
          } else {
            handleGoogleLogin();
          }
        }}
        onClearCloudData={handleClearCloudData}
        onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
      />

      {/* 6. Share Customer Digital Catalog Modal */}
      <ShareCatalogModal
        isOpen={isShareCatalogOpen}
        onClose={() => setIsShareCatalogOpen(false)}
        settings={settings}
        onOpenCustomerView={handleOpenCustomerMode}
      />

      {/* 7. Multi-Device Sync Conflict Resolution Modal */}
      <SyncConflictModal
        isOpen={isSyncConflictModalOpen}
        onClose={() => setIsSyncConflictModalOpen(false)}
        comparison={conflictComparison}
        localData={conflictLocalData || storageService.getAllData()}
        cloudData={conflictCloudData || storageService.getAllData()}
        cloudSheetName={sheetsConfig.spreadsheetName || 'Google Sheets'}
        onMerge={handleMergeConflict}
        onDownloadCloud={handleDownloadCloudConflict}
        onOverwriteCloud={handleOverwriteCloudConflict}
        onClearCloud={handleClearCloudData}
        isProcessing={isResolvingConflict}
      />

      {/* Global Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
