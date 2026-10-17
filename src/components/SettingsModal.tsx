import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Settings,
  FileSpreadsheet,
  Palette,
  Type,
  CloudCheck,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  LogOut,
  CreditCard,
  Smartphone,
  Building2,
  Copy,
  MessageCircle,
  Sun,
  Moon,
  Database,
  FileJson,
  Upload,
  Tag,
  Plus,
  RotateCcw,
  Coins,
  Percent,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { AppSettings, GoogleSheetsConfig, Product, SaleOrder, Expense, ShippingBatch, RetentionBatch, PaymentDetailsConfig } from '../types';
import { googleSheetsService, DriveSpreadsheetItem } from '../services/googleSheetsService';
import { storageService, DEFAULT_PAYMENT_DETAILS, DEFAULT_PRODUCT_CATEGORIES } from '../services/storageService';
import { getAccessToken } from '../services/firebaseAuth';
import { generatePaymentMessage } from '../services/paymentMessageService';
import { fetchLiveExchangeRates, formatBs } from '../services/currencyService';
import { VincitEmblem } from './brand/VincitEmblem';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Laptop,
  Cloud,
  GitMerge,
  Trash2,
  Store,
  Share2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  initialTab?: 'general' | 'google' | 'themes' | 'payments' | 'mobile' | 'backup';
  settings: AppSettings;
  user: any | null;
  accessToken: string | null;
  sheetsConfig: GoogleSheetsConfig;
  products: Product[];
  shippingBatches: ShippingBatch[];
  retentionBatches: RetentionBatch[];
  orders: SaleOrder[];
  expenses: Expense[];
  onClose: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  onUpdateSheetsConfig: (newConfig: GoogleSheetsConfig) => void;
  onImportProducts: (imported: Product[]) => void;
  onClearAllData?: () => void;
  onLoadDemoData?: () => void;
  onOpenConflictModal?: () => void;
  onClearCloudData?: () => Promise<void>;
  onOpenShareCatalog?: () => void;
}

const THEMES: { id: AppSettings['theme']; name: string; hex: string; colorClass: string; bgClass: string; desc: string }[] = [
  {
    id: 'amber',
    name: 'Dorado & Joyería',
    hex: '#f59e0b',
    colorClass: 'bg-amber-500 text-amber-950',
    bgClass: 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/30',
    desc: 'Tonos oro y champán para accesorios y joyería (Vincit Omnia)',
  },
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    hex: '#10b981',
    colorClass: 'bg-emerald-600 text-white',
    bgClass: 'border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30',
    desc: 'Estilo financiero clásico, utilidades e inventario',
  },
  {
    id: 'indigo',
    name: 'Azul Zafiro / Corporativo',
    hex: '#6366f1',
    colorClass: 'bg-indigo-600 text-white',
    bgClass: 'border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30',
    desc: 'Diseño moderno tecnológico y corporativo',
  },
  {
    id: 'purple',
    name: 'Amatista / Púrpura',
    hex: '#a855f7',
    colorClass: 'bg-purple-600 text-white',
    bgClass: 'border-purple-400 bg-purple-50/70 dark:bg-purple-950/30',
    desc: 'Creativo y sofisticado para colecciones de diseño',
  },
  {
    id: 'rose',
    name: 'Oro Rosa / Boutique',
    hex: '#f43f5e',
    colorClass: 'bg-rose-500 text-white',
    bgClass: 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/30',
    desc: 'Elegancia de moda, calzado y cosmética',
  },
  {
    id: 'sky',
    name: 'Turquesa / Océano',
    hex: '#0ea5e9',
    colorClass: 'bg-sky-500 text-white',
    bgClass: 'border-sky-400 bg-sky-50/70 dark:bg-sky-950/30',
    desc: 'Fresco, vibrante y dinámico para catálogos modernos',
  },
  {
    id: 'slate',
    name: 'Titanio / Minimalista',
    hex: '#64748b',
    colorClass: 'bg-slate-800 text-white',
    bgClass: 'border-slate-400 bg-slate-50/70 dark:bg-slate-800/60',
    desc: 'Monocromático sobrio y limpio',
  },
  {
    id: 'custom',
    name: 'Color Personalizado',
    hex: '#f59e0b',
    colorClass: 'bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 text-white',
    bgClass: 'border-amber-400 bg-amber-50/70 dark:bg-slate-800/60',
    desc: 'Elige tu propio código de color hexadecimal exclusivo',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  user,
  accessToken,
  sheetsConfig,
  products,
  shippingBatches,
  retentionBatches,
  orders,
  expenses,
  onClose,
  onUpdateSettings,
  onLoginGoogle,
  onLogoutGoogle,
  onUpdateSheetsConfig,
  onImportProducts,
  onClearAllData,
  onLoadDemoData,
  onOpenConflictModal,
  onClearCloudData,
  onOpenShareCatalog,
  initialTab = 'general',
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'google' | 'themes' | 'payments' | 'mobile' | 'backup'>(initialTab);

  // Form states
  const [appName, setAppName] = useState(settings.appName);
  const [appSubtitle, setAppSubtitle] = useState(settings.appSubtitle);
  const [selectedTheme, setSelectedTheme] = useState<AppSettings['theme']>(settings.theme);
  const [customAccentColor, setCustomAccentColor] = useState<string>(settings.customAccentColor || '#f59e0b');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(settings.themeMode || (settings.darkMode ? 'dark' : 'light'));
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans'>(settings.fontStyle || 'serif');
  const [density, setDensity] = useState<'comfortable' | 'compact'>(settings.density || 'comfortable');
  const [currency, setCurrency] = useState(settings.currency);
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(settings.customLogoUrl || '');
  const [customLogoType, setCustomLogoType] = useState<'image' | 'svg' | 'default'>(settings.customLogoType || 'default');
  const [iconSize, setIconSize] = useState<AppSettings['iconSize']>(settings.iconSize || 'lg');
  const [svgInputCode, setSvgInputCode] = useState<string>('');
  const [logoValidationError, setLogoValidationError] = useState<string | null>(null);
  const [logoFileInfo, setLogoFileInfo] = useState<{ name: string; size: string; type: string } | null>(null);

  // Drive discovery & conflict states
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetItem[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [showClearCloudConfirm, setShowClearCloudConfirm] = useState(false);
  const [isClearingCloud, setIsClearingCloud] = useState(false);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<string[]>(() => {
    return Array.isArray(settings.categories) && settings.categories.length > 0
      ? settings.categories
      : storageService.getCategories();
  });
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // Payment Details Form State with safe defaults
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsConfig>(() => ({
    ...DEFAULT_PAYMENT_DETAILS,
    ...(settings.paymentDetails || {}),
    bankTransfer: {
      ...DEFAULT_PAYMENT_DETAILS.bankTransfer,
      ...(settings.paymentDetails?.bankTransfer || {}),
    },
    pagoMovil: {
      ...DEFAULT_PAYMENT_DETAILS.pagoMovil,
      ...(settings.paymentDetails?.pagoMovil || {}),
    },
    binancePay: {
      binanceId: settings.paymentDetails?.binancePay?.binanceId || DEFAULT_PAYMENT_DETAILS.binancePay?.binanceId || '',
      email: settings.paymentDetails?.binancePay?.email || '',
      alias: settings.paymentDetails?.binancePay?.alias || '',
      notes: settings.paymentDetails?.binancePay?.notes || DEFAULT_PAYMENT_DETAILS.binancePay?.notes || '',
    },
  }));
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [isFetchingLiveRates, setIsFetchingLiveRates] = useState(false);
  const [rateFetchNotice, setRateFetchNotice] = useState<string | null>(null);
  const [paymentMethodSubTab, setPaymentMethodSubTab] = useState<'all' | 'pago_movil' | 'transferencia' | 'binance'>('all');
  const [previewMessageMethod, setPreviewMessageMethod] = useState<'pago_movil' | 'binance'>('pago_movil');

  // Helper para actualizar y sincronizar inmediatamente los datos de pago al estado global y almacenamiento
  const updatePaymentDetails = (
    nextOrUpdater: PaymentDetailsConfig | ((prev: PaymentDetailsConfig) => PaymentDetailsConfig),
    autoSave = true
  ) => {
    setPaymentDetails((prev) => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater;
      if (autoSave) {
        onUpdateSettings({
          ...settings,
          appName: appName.trim() || settings.appName || 'Vincint Omnia',
          appSubtitle: appSubtitle.trim() || settings.appSubtitle || 'Almacén & Finanzas',
          theme: selectedTheme,
          currency,
          paymentDetails: next,
        });
      }
      return next;
    });
  };

  const handleFetchLiveRates = async () => {
    try {
      setIsFetchingLiveRates(true);
      setRateFetchNotice(null);
      const rates = await fetchLiveExchangeRates();
      updatePaymentDetails(
        (prev) => ({
          ...prev,
          bcvRate: rates.bcvRate,
          binanceUsdtRate: rates.binanceRate,
        }),
        true
      );
      setRateFetchNotice(`Tasas en vivo obtenidas: BCV Bs. ${rates.bcvRate} • Binance Bs. ${rates.binanceRate}`);
      setTimeout(() => setRateFetchNotice(null), 5000);
    } catch (err) {
      console.error(err);
      setRateFetchNotice('No se pudieron obtener las tasas en vivo.');
    } finally {
      setIsFetchingLiveRates(false);
    }
  };

  const handleCloseModal = () => {
    // Sincronizar de forma segura datos de pago y ajustes al cerrar
    onUpdateSettings({
      ...settings,
      appName: appName.trim() || settings.appName || 'Vincint Omnia',
      appSubtitle: appSubtitle.trim() || settings.appSubtitle || 'Almacén & Finanzas',
      theme: selectedTheme,
      currency,
      paymentDetails,
    });
    onClose();
  };

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    setAppName(settings.appName);
    setAppSubtitle(settings.appSubtitle);
    setSelectedTheme(settings.theme);
    setCustomAccentColor(settings.customAccentColor || '#f59e0b');
    setThemeMode(settings.themeMode || (settings.darkMode ? 'dark' : 'light'));
    setFontStyle(settings.fontStyle || 'serif');
    setDensity(settings.density || 'comfortable');
    setCurrency(settings.currency);
    setCustomLogoUrl(settings.customLogoUrl || '');
    setCustomLogoType(settings.customLogoType || 'default');
    setIconSize(settings.iconSize || 'lg');
    setPaymentDetails(
      settings.paymentDetails
        ? { ...DEFAULT_PAYMENT_DETAILS, ...settings.paymentDetails }
        : DEFAULT_PAYMENT_DETAILS
    );
    setCategories(
      Array.isArray(settings.categories) && settings.categories.length > 0
        ? settings.categories
        : storageService.getCategories()
    );
  }, [settings]);

  // Tab bar horizontal scroll ref - prevents vertical window/modal jitter on laptops and phones
  const tabBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const el = tabBarRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Intercept wheel events on the tab bar and redirect purely to horizontal scroll
      if (e.deltaY !== 0 || e.deltaX !== 0) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollLeft += (e.deltaY !== 0 ? e.deltaY : e.deltaX);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  // Sheets sync states
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [customSheetId, setCustomSheetId] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load drive spreadsheets when entering Google tab or when accessToken becomes available
  useEffect(() => {
    if (activeTab === 'google' && accessToken) {
      loadDriveFiles();
    }
  }, [activeTab, accessToken]);

  const loadDriveFiles = async () => {
    if (!accessToken) return;
    setIsLoadingDriveFiles(true);
    try {
      const files = await googleSheetsService.findUserSpreadsheets(accessToken);
      setDriveFiles(files);
    } catch (e) {
      console.warn('Error loading drive files:', e);
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const handleClearCloudDataClick = async () => {
    if (!accessToken || !sheetsConfig.spreadsheetId) return;
    setIsClearingCloud(true);
    try {
      if (onClearCloudData) {
        await onClearCloudData();
      } else {
        await googleSheetsService.clearCloudData(accessToken, sheetsConfig.spreadsheetId);
        const updatedConfig = {
          ...sheetsConfig,
          lastSyncedAt: null,
        };
        onUpdateSheetsConfig(updatedConfig);
      }
      setShowClearCloudConfirm(false);
      setStatusMessage({ type: 'success', text: 'Datos de la nube eliminados con éxito. La hoja ahora está vacía y lista para sincronizar.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Error clearing cloud:', err);
      setStatusMessage({ type: 'error', text: 'Error al limpiar nube: ' + (err?.message || 'Error desconocido') });
    } finally {
      setIsClearingCloud(false);
    }
  };

  const handleDisconnectCloud = () => {
    const updatedConfig: GoogleSheetsConfig = {
      ...sheetsConfig,
      spreadsheetId: null,
      spreadsheetName: '',
      spreadsheetUrl: null,
      lastSyncedAt: null,
    };
    onUpdateSheetsConfig(updatedConfig);
    setStatusMessage({ type: 'info', text: 'Base de datos desvinculada. Ahora puedes seleccionar otra hoja de Google Drive o crear una nueva.' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSelectDriveSpreadsheet = (file: DriveSpreadsheetItem) => {
    const updated: GoogleSheetsConfig = {
      ...sheetsConfig,
      spreadsheetId: file.id,
      spreadsheetName: file.name,
      spreadsheetUrl: file.url,
      lastSyncedAt: null,
    };
    onUpdateSheetsConfig(updated);
    setStatusMessage({ type: 'success', text: `Base de datos "${file.name}" vinculada a este dispositivo.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  if (!isOpen) return null;

  // Category Handlers
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setStatusMessage({ type: 'error', text: `La categoría "${trimmed}" ya existe en el catálogo.` });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    setNewCategoryName('');
    storageService.saveCategories(updated);
    onUpdateSettings({
      ...settings,
      categories: updated,
    });
    setStatusMessage({ type: 'success', text: `Categoría "${trimmed}" agregada correctamente.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      setStatusMessage({ type: 'error', text: 'Debes mantener al menos una categoría en el sistema.' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    const productsUsingCategory = products.filter(
      (p) => (p.category || '').toLowerCase() === catToDelete.toLowerCase()
    ).length;
    if (productsUsingCategory > 0) {
      const confirmed = confirm(
        `Hay ${productsUsingCategory} producto(s) en tu inventario clasificados bajo la categoría "${catToDelete}".\n\n¿Estás seguro de que deseas eliminar la categoría "${catToDelete}"?`
      );
      if (!confirmed) return;
    }
    const updated = categories.filter((c) => c.toLowerCase() !== catToDelete.toLowerCase());
    setCategories(updated);
    storageService.saveCategories(updated);
    onUpdateSettings({
      ...settings,
      categories: updated,
    });
    setStatusMessage({ type: 'info', text: `Categoría "${catToDelete}" eliminada exitosamente.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleResetCategories = () => {
    const updated = DEFAULT_PRODUCT_CATEGORIES;
    setCategories(updated);
    storageService.saveCategories(updated);
    onUpdateSettings({
      ...settings,
      categories: updated,
    });
    setStatusMessage({ type: 'success', text: 'Categorías restauradas a las predeterminadas.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Clear All Local Data (Database & Inventory) Handler
  const handleExecuteClearAllData = () => {
    if (onClearAllData) {
      onClearAllData();
      setShowConfirmClearAll(false);
      setStatusMessage({
        type: 'success',
        text: '¡Inventario y base de datos local borrados exitosamente! El sistema ha sido reiniciado.',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Load Demo Data Handler
  const handleExecuteLoadDemoData = () => {
    if (onLoadDemoData) {
      onLoadDemoData();
      setStatusMessage({
        type: 'success',
        text: '¡Datos de demostración cargados exitosamente!',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Save General Settings
  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      appName: appName.trim() || 'Vincit Omnia',
      appSubtitle: appSubtitle.trim() || 'Accesorios y Más',
      theme: selectedTheme,
      customAccentColor,
      darkMode: themeMode === 'dark',
      themeMode,
      fontStyle,
      density,
      currency,
      paymentDetails,
      customLogoUrl: customLogoUrl || undefined,
      customLogoType,
      iconSize,
      categories,
    });
    storageService.saveCategories(categories);
    setStatusMessage({ type: 'success', text: 'Configuración de identidad, moneda y categorías guardadas correctamente.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Save Theme Settings
  const handleSaveThemeSettings = (
    newTheme?: AppSettings['theme'],
    newHex?: string,
    newMode?: 'light' | 'dark' | 'system',
    newFont?: 'serif' | 'sans',
    newDensity?: 'comfortable' | 'compact'
  ) => {
    const updatedTheme = newTheme ?? selectedTheme;
    const updatedHex = newHex ?? customAccentColor;
    const updatedMode = newMode ?? themeMode;
    const updatedFont = newFont ?? fontStyle;
    const updatedDensity = newDensity ?? density;
    const isDark = updatedMode === 'dark';

    setSelectedTheme(updatedTheme);
    if (newHex !== undefined) setCustomAccentColor(updatedHex);
    if (newMode !== undefined) setThemeMode(updatedMode);
    if (newFont !== undefined) setFontStyle(updatedFont);
    if (newDensity !== undefined) setDensity(updatedDensity);

    onUpdateSettings({
      ...settings,
      theme: updatedTheme,
      customAccentColor: updatedHex,
      darkMode: isDark,
      themeMode: updatedMode,
      fontStyle: updatedFont,
      density: updatedDensity,
    });
    setStatusMessage({ type: 'success', text: 'Tema y personalización visual aplicados en tiempo real.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Logo Format & Size Constraints
  const MAX_LOGO_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB máximo (previene saturación de localStorage y fallos en UI)
  const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg'];

  // Helper de validación de archivo de logo
  const validateLogoFile = (file: File): { isValid: boolean; error?: string; isSvg: boolean } => {
    const fileNameLower = file.name.toLowerCase();
    const lastDotIndex = fileNameLower.lastIndexOf('.');
    const fileExtension = lastDotIndex !== -1 ? fileNameLower.substring(lastDotIndex) : '';

    // 1. Validar que la extensión pertenezca estrictamente a PNG, JPG, JPEG o SVG
    const hasValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);

    // 2. Validar tipo MIME oficial
    const hasValidMime =
      ALLOWED_MIME_TYPES.includes(file.type) ||
      (fileExtension === '.svg' && (!file.type || file.type.includes('svg') || file.type.includes('xml')));

    if (!hasValidExtension || !hasValidMime) {
      const extDetected = fileExtension ? fileExtension.replace('.', '').toUpperCase() : (file.type || 'desconocido');
      return {
        isValid: false,
        error: `Formato «${extDetected}» no admitido. Solo se permiten imágenes en formato PNG, JPG o SVG.`,
        isSvg: false,
      };
    }

    // 3. Validar límite máximo de tamaño (1 MB)
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        isValid: false,
        error: `El archivo supera el tamaño máximo permitido de 1 MB (peso actual: ${sizeInMB} MB). Por favor, comprime la imagen para evitar problemas de rendimiento.`,
        isSvg: false,
      };
    }

    // 4. Validar archivo no vacío
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'El archivo seleccionado está vacío (0 bytes).',
        isSvg: false,
      };
    }

    const isSvg = fileExtension === '.svg' || file.type.includes('svg');
    return { isValid: true, isSvg };
  };

  // Upload or read image/svg file with strict validation
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoValidationError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de formato y tamaño
    const validation = validateLogoFile(file);
    if (!validation.isValid) {
      setLogoValidationError(validation.error || 'Archivo de logotipo no válido.');
      setStatusMessage({ type: 'error', text: validation.error || 'Archivo de logotipo no válido.' });
      e.target.value = ''; // Reset input so user can try another file
      return;
    }

    const formattedSize =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    if (validation.isSvg) {
      // Validar integridad del archivo SVG como texto XML
      const textReader = new FileReader();
      textReader.onload = (event) => {
        const svgContent = event.target?.result as string;
        if (!svgContent || !svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
          const err = 'El archivo SVG seleccionado no contiene una estructura XML válida (<svg>...</svg>).';
          setLogoValidationError(err);
          setStatusMessage({ type: 'error', text: err });
          e.target.value = '';
          return;
        }

        // Construir Data URL seguro
        const safeDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgContent.trim());
        setCustomLogoUrl(safeDataUrl);
        setCustomLogoType('svg');
        setLogoFileInfo({ name: file.name, size: formattedSize, type: 'SVG' });
        setLogoValidationError(null);
        setStatusMessage({
          type: 'success',
          text: `¡Vector SVG (${file.name}, ${formattedSize}) validado exitosamente! Haz clic en "Guardar Cambios".`,
        });
      };
      textReader.onerror = () => {
        const err = 'Ocurrió un error al leer el archivo SVG.';
        setLogoValidationError(err);
        setStatusMessage({ type: 'error', text: err });
        e.target.value = '';
      };
      textReader.readAsText(file);
    } else {
      // Para PNG o JPG: Leer como Data URL y verificar decodificación real
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          // Pre-probar renderizado de la imagen en memoria para evitar archivos corruptos
          const testImg = new Image();
          testImg.onload = () => {
            const formatName = file.type === 'image/png' ? 'PNG' : 'JPG';
            setCustomLogoUrl(result);
            setCustomLogoType('image');
            setLogoFileInfo({ name: file.name, size: formattedSize, type: formatName });
            setLogoValidationError(null);
            setStatusMessage({
              type: 'success',
              text: `¡Imagen ${formatName} (${file.name}, ${formattedSize}) validada correctamente! Haz clic en "Guardar Cambios".`,
            });
          };
          testImg.onerror = () => {
            const err = 'El archivo de imagen está dañado o corrupto y no puede representarse en pantalla.';
            setLogoValidationError(err);
            setStatusMessage({ type: 'error', text: err });
            e.target.value = '';
          };
          testImg.src = result;
        }
      };
      reader.onerror = () => {
        const err = 'Error al leer el archivo de imagen.';
        setLogoValidationError(err);
        setStatusMessage({ type: 'error', text: err });
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct SVG paste handler with validation
  const handleApplySvgCode = () => {
    setLogoValidationError(null);
    if (!svgInputCode.trim()) return;
    const trimmed = svgInputCode.trim();

    // Validar límite de tamaño del texto / URL pegada
    const byteSize = new Blob([trimmed]).size;
    if (byteSize > MAX_LOGO_SIZE_BYTES) {
      const err = `El texto ingresado supera el límite de 1 MB (${(byteSize / (1024 * 1024)).toFixed(2)} MB).`;
      setLogoValidationError(err);
      setStatusMessage({ type: 'error', text: err });
      return;
    }

    // Si es una URL o Data URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      const urlLower = trimmed.toLowerCase();
      const hasValidExtOrMime =
        urlLower.includes('.png') ||
        urlLower.includes('.jpg') ||
        urlLower.includes('.jpeg') ||
        urlLower.includes('.svg') ||
        urlLower.startsWith('data:image/png') ||
        urlLower.startsWith('data:image/jpeg') ||
        urlLower.startsWith('data:image/svg+xml');

      if (!hasValidExtOrMime) {
        const err = 'La URL o Data URI debe apuntar estrictamente a una imagen en formato PNG, JPG o SVG.';
        setLogoValidationError(err);
        setStatusMessage({ type: 'error', text: err });
        return;
      }

      const isSvgUrl = urlLower.includes('.svg') || urlLower.startsWith('data:image/svg+xml');
      setCustomLogoUrl(trimmed);
      setCustomLogoType(isSvgUrl ? 'svg' : 'image');
      setLogoFileInfo({ name: 'Enlace web remoto', size: `${Math.round(byteSize / 1024)} KB`, type: isSvgUrl ? 'SVG' : 'Imagen' });
      setLogoValidationError(null);
      setSvgInputCode('');
      setStatusMessage({ type: 'success', text: '¡Enlace de logotipo verificado correctamente! Guarda los cambios para aplicar.' });
      return;
    }

    // Si es código SVG directo
    if (!trimmed.includes('<svg') || !trimmed.includes('</svg>')) {
      const err = 'El código ingresado no es un vector SVG válido. Debe incluir las etiquetas <svg ...> y </svg>.';
      setLogoValidationError(err);
      setStatusMessage({ type: 'error', text: err });
      return;
    }

    // Convertir XML SVG a Data URL segura
    const encodedSvg = 'data:image/svg+xml;utf8,' + encodeURIComponent(trimmed);
    setCustomLogoUrl(encodedSvg);
    setCustomLogoType('svg');
    setLogoFileInfo({ name: 'Vector SVG en código', size: `${Math.round(byteSize / 1024)} KB`, type: 'SVG' });
    setLogoValidationError(null);
    setSvgInputCode('');
    setStatusMessage({ type: 'success', text: '¡Vector SVG procesado y validado exitosamente! Guarda los cambios para aplicar.' });
  };

  const handleResetToDefaultLogo = () => {
    setCustomLogoUrl('');
    setCustomLogoType('default');
    setLogoFileInfo(null);
    setLogoValidationError(null);
    setStatusMessage({ type: 'info', text: 'Restablecido al emblema insignia oficial de Vincit Omnia.' });
  };

  // Manual Export Database to JSON
  const handleExportDatabaseToJson = () => {
    try {
      const backupData = {
        metadata: {
          system: 'StockFlow - Almacén & Ganancias',
          brand: appName.trim() || settings.appName || 'Vincit Omnia',
          version: '3.0.0',
          exportedAt: new Date().toISOString(),
          exportedAtFormatted: new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'medium' }),
          currency,
        },
        counts: {
          products: products.length,
          shippingBatches: shippingBatches.length,
          retentionBatches: retentionBatches.length,
          orders: orders.length,
          expenses: expenses.length,
        },
        appSettings: {
          ...settings,
          appName: appName.trim() || settings.appName,
          appSubtitle: appSubtitle.trim() || settings.appSubtitle,
          theme: selectedTheme,
          currency,
          customLogoUrl,
          customLogoType,
          iconSize,
          paymentDetails,
        },
        googleSheetsConfig: {
          spreadsheetId: sheetsConfig.spreadsheetId,
          spreadsheetName: sheetsConfig.spreadsheetName,
          lastSyncedAt: sheetsConfig.lastSyncedAt,
        },
        products,
        shippingBatches,
        retentionBatches,
        orders,
        expenses,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10);
      const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '-');
      const filename = `StockFlow_Backup_${datePart}_${timePart}.json`;

      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);

      setStatusMessage({
        type: 'success',
        text: `¡Copia de seguridad local «${filename}» descargada con éxito! (${products.length} productos, ${orders.length} pedidos, ${expenses.length} gastos).`,
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Error generating JSON backup:', err);
      setStatusMessage({
        type: 'error',
        text: 'Error al exportar la base de datos a JSON: ' + (err?.message || 'Error desconocido'),
      });
    }
  };

  // Restore Database from JSON
  const handleImportDatabaseFromJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setStatusMessage({ type: 'error', text: 'El archivo seleccionado debe ser un archivo .json válido.' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textContent = event.target?.result as string;
        const parsed = JSON.parse(textContent);

        if (!parsed || (!parsed.products && !parsed.orders && !parsed.metadata)) {
          throw new Error('El archivo no tiene el formato de copia de seguridad de StockFlow.');
        }

        const confirmRestore = confirm(
          `¿Deseas restaurar esta copia de seguridad?\n\nArchivo: ${file.name}\nProductos: ${parsed.products?.length || 0}\nPedidos: ${parsed.orders?.length || 0}\nGastos: ${parsed.expenses?.length || 0}\n\nNota: Los datos locales se reemplazarán con los de esta copia.`
        );

        if (!confirmRestore) {
          e.target.value = '';
          return;
        }

        if (Array.isArray(parsed.products)) {
          storageService.saveProducts(parsed.products);
          onImportProducts(parsed.products);
        }
        if (Array.isArray(parsed.shippingBatches)) {
          storageService.saveShippingBatches(parsed.shippingBatches);
        }
        if (Array.isArray(parsed.retentionBatches)) {
          storageService.saveRetentionBatches(parsed.retentionBatches);
        }
        if (Array.isArray(parsed.orders)) {
          storageService.saveOrders(parsed.orders);
        }
        if (Array.isArray(parsed.expenses)) {
          storageService.saveExpenses(parsed.expenses);
        }
        if (parsed.appSettings) {
          storageService.saveAppSettings(parsed.appSettings);
          onUpdateSettings(parsed.appSettings);
        }

        setStatusMessage({
          type: 'success',
          text: `¡Copia de seguridad restaurada! Se cargaron ${parsed.products?.length || 0} productos y ${parsed.orders?.length || 0} pedidos.`,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        console.error('Error importing backup:', err);
        setStatusMessage({
          type: 'error',
          text: 'Error al restaurar archivo JSON: ' + (err?.message || 'Estructura inválida'),
        });
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Save Payment Settings
  const handleSavePaymentSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateSettings({
      ...settings,
      appName: appName.trim() || 'Vincint Omnia',
      appSubtitle: appSubtitle.trim() || 'Almacén & Finanzas',
      theme: selectedTheme,
      currency,
      paymentDetails,
    });
    setStatusMessage({ type: 'success', text: '¡Datos de pago (Transferencia y Pago Móvil) guardados correctamente!' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Create Google Spreadsheet
  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      onLoginGoogle();
      return;
    }

    try {
      setIsCreatingSheet(true);
      setStatusMessage({ type: 'info', text: 'Creando hoja de cálculo en tu Google Drive...' });

      const newSheet = await googleSheetsService.createSpreadsheet(accessToken, `${appName} - Base de Datos`);
      
      setStatusMessage({ type: 'info', text: 'Sincronizando inventario inicial, lotes e historial...' });
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

      onUpdateSheetsConfig(updatedConfig);
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

  // Manual Sync to Google Sheets
  const handleManualSync = async () => {
    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      onLoginGoogle();
      return;
    }
    if (!sheetsConfig.spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'Primero crea o vincula una hoja de cálculo.' });
      return;
    }

    try {
      setIsSyncing(true);
      setStatusMessage({ type: 'info', text: 'Sincronizando inventario, lotes, ventas e historial con Google Sheets...' });

      const result = await googleSheetsService.syncAllToSheets(token, sheetsConfig.spreadsheetId, {
        products,
        shippingBatches,
        retentionBatches,
        orders,
        expenses,
        historyRecords: storageService.getHistoryRecords(),
      });

      onUpdateSheetsConfig({
        ...sheetsConfig,
        lastSyncedAt: result.lastSyncedAt,
      });

      setStatusMessage({
        type: 'success',
        text: '¡Sincronización en tiempo real completada con éxito (incluido Historial)!',
      });
    } catch (err: any) {
      console.error('Error syncing:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al conectar con Google Sheets.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Link Existing Sheet
  const handleLinkExisting = () => {
    if (!customSheetId.trim()) return;
    let extractedId = customSheetId.trim();
    const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    const updatedConfig: GoogleSheetsConfig = {
      ...sheetsConfig,
      spreadsheetId: extractedId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${extractedId}/edit`,
      spreadsheetName: 'Hoja Vinculada de Google Sheets',
      lastSyncedAt: null,
    };
    onUpdateSheetsConfig(updatedConfig);
    setCustomSheetId('');
    setStatusMessage({
      type: 'success',
      text: 'Hoja vinculada correctamente. Presiona "Sincronizar ahora" para transferir datos.',
    });
  };

  // Import Products
  const handleImportFromSheet = async () => {
    if (!accessToken || !sheetsConfig.spreadsheetId) return;

    try {
      setIsImporting(true);
      setStatusMessage({ type: 'info', text: 'Leyendo productos desde la pestaña "INVENTARIO_PRODUCTOS"...' });
      const imported = await googleSheetsService.importProductsFromSheet(accessToken, sheetsConfig.spreadsheetId);
      if (imported.length > 0) {
        onImportProducts(imported);
        setStatusMessage({
          type: 'success',
          text: `Se importaron ${imported.length} productos desde Google Sheets con éxito.`,
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: 'No se encontraron filas con productos en la hoja.',
        });
      }
    } catch (err: any) {
      console.error('Error importing:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'No se pudo leer la hoja. Asegúrate de que existe la pestaña "INVENTARIO_PRODUCTOS".',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-3 sm:my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-900 text-amber-400 flex items-center justify-center font-bold shadow-md shrink-0 border border-amber-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">Configuración del Sistema</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Identidad, personalización de temas, sincronización con Google Sheets y opciones
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5 shrink-0" />
          </button>
        </div>

        {/* Tab Switcher - Barra horizontal estética, fijada para desplazarse exclusivamente hacia los lados sin saltos verticales */}
        <div className="relative shrink-0 w-full border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md">
          {/* Indicadores sutiles de degradado a los extremos para estética moderna */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-50/90 dark:from-slate-900/90 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-50/90 dark:from-slate-900/90 to-transparent z-10" />

          <div
            ref={tabBarRef}
            style={{ touchAction: 'pan-x', overscrollBehaviorX: 'contain', overscrollBehaviorY: 'none' }}
            className="w-full px-2.5 sm:px-6 h-12 flex items-center overflow-x-auto overflow-y-hidden select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-max h-10 py-1">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'general'
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Type className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Marca & Logo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('themes')}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'themes'
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Palette className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Temas & Colores</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('google')}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'google'
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Google Sheets & Nube</span>
                {sheetsConfig.spreadsheetId && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/40 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0 text-sky-600" />
                <span>Datos de Pago</span>
                {(paymentDetails.enabledPagoMovil || paymentDetails.enabledBankTransfer || paymentDetails.enabledBcvPricing || paymentDetails.enabledUsdtPricing) && (
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('backup')}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'backup'
                    ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/40 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Database className="w-4 h-4 shrink-0 text-purple-600" />
                <span>Base de Datos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mobile')}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'mobile'
                    ? 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/40 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>App Móvil (PWA)</span>
              </button>
            </div>
          </div>
        </div>


        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-sky-50 text-sky-800 border border-sky-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <RefreshCw className="w-4 h-4 shrink-0 text-sky-600 animate-spin" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: NOMBRE Y NEGOCIO */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneralSettings} className="space-y-5">
              {/* Live Branding Preview */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/70 rounded-2xl p-4 text-white shadow-md border border-amber-500/40">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Vista Previa del Encabezado e Icono</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {customLogoUrl ? 'Logotipo Personalizado' : 'Emblema Oficial Vincit Omnia'}
                  </span>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className={`rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/50 p-2 flex items-center justify-center shadow-md transition-all duration-200 ${
                    iconSize === 'sm' ? 'w-10 h-10' :
                    iconSize === 'md' ? 'w-12 h-12' :
                    iconSize === 'xl' ? 'w-16 h-16' :
                    iconSize === '2xl' ? 'w-20 h-20' : 'w-14 h-14'
                  }`}>
                    <VincitEmblem
                      className={
                        iconSize === 'sm' ? 'w-6 h-6' :
                        iconSize === 'md' ? 'w-8 h-8' :
                        iconSize === 'xl' ? 'w-12 h-12' :
                        iconSize === '2xl' ? 'w-16 h-16' : 'w-10 h-10'
                      }
                      customLogoUrl={customLogoUrl}
                      customLogoType={customLogoType}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-serif uppercase font-bold text-base sm:text-lg bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent tracking-[0.2em]"
                        style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                      >
                        {appName.trim() || 'VINCIT OMNIA'}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30">
                        {appSubtitle.trim() || 'ACCESORIOS Y MÁS'}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-400/90 font-medium tracking-[0.25em] uppercase mt-0.5">
                      {appSubtitle.trim() || 'ACCESORIOS Y MÁS'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personalización de Icono y Tamaño */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Icono y Logotipo de la App</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ajusta el tamaño o sube tu propia imagen o vector SVG.
                    </p>
                  </div>
                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={handleResetToDefaultLogo}
                      className="text-[11px] text-amber-700 hover:text-amber-900 underline font-semibold"
                    >
                      Restablecer al original
                    </button>
                  )}
                </div>

                {/* Selector de Tamaño de Icono */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Tamaño del Icono en el Encabezado:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {(
                      [
                        { id: 'sm', label: 'Pequeño', px: '36px' },
                        { id: 'md', label: 'Medio', px: '44px' },
                        { id: 'lg', label: 'Grande (Recomendado)', px: '52px' },
                        { id: 'xl', label: 'Extra Grande', px: '64px' },
                        { id: '2xl', label: 'Máximo', px: '80px' },
                      ] as const
                    ).map((sizeOpt) => (
                      <button
                        key={sizeOpt.id}
                        type="button"
                        onClick={() => setIconSize(sizeOpt.id)}
                        className={`p-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                          iconSize === sizeOpt.id
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{sizeOpt.label}</div>
                        <div className={`text-[9px] ${iconSize === sizeOpt.id ? 'text-slate-300' : 'text-slate-400'}`}>
                          {sizeOpt.px}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subir archivo de imagen o SVG con validación estricta */}
                <div className="pt-3 border-t border-slate-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Personalizar Logotipo de la Marca:
                    </label>
                    {/* Badges de especificación técnica */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/80 text-slate-700">
                        PNG · JPG · SVG
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Máx. 1 MB
                      </span>
                    </div>
                  </div>

                  {/* Mensaje de error de validación inline */}
                  {logoValidationError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{logoValidationError}</p>
                        <p className="text-[11px] text-rose-600 mt-0.5">
                          Asegúrate de que la imagen sea un archivo <strong>.png</strong>, <strong>.jpg</strong> o <strong>.svg</strong> no mayor a 1 MB.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLogoValidationError(null)}
                        className="text-rose-400 hover:text-rose-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Detalle del archivo cargado exitosamente */}
                  {logoFileInfo && !logoValidationError && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 animate-fadeIn">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate font-semibold text-[11px]">
                          {logoFileInfo.name} ({logoFileInfo.type}) · {logoFileInfo.size}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetToDefaultLogo}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline shrink-0 cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-amber-400/80 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100/50 text-slate-800 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group">
                      <Download className="w-4 h-4 rotate-180 text-amber-600 group-hover:-translate-y-0.5 transition-transform" />
                      <span>Seleccionar archivo (PNG, JPG o SVG)</span>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoFileUpload}
                      />
                    </label>

                    <span className="text-[11px] text-slate-400 text-center sm:text-left">
                      o pega código SVG / URL directa:
                    </span>
                  </div>

                  {/* Entrada directa de código SVG o URL */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pega código <svg> o URL de imagen (https://...)"
                      value={svgInputCode}
                      onChange={(e) => {
                        setSvgInputCode(e.target.value);
                        if (logoValidationError) setLogoValidationError(null);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplySvgCode}
                      disabled={!svgInputCode.trim()}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Aplicación / Negocio
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Ej. Vincit Omnia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Este nombre se mostrará en el encabezado superior, en los reportes de PDF y en los libros de Excel.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtítulo / Eslogan
                </label>
                <input
                  type="text"
                  value={appSubtitle}
                  onChange={(e) => setAppSubtitle(e.target.value)}
                  placeholder="Ej. Almacén & Finanzas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Moneda Predeterminada
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="$">$ Dólar (USD / Internacional)</option>
                  <option value="Bs.">Bs. Bolívares (VED - Venezuela)</option>
                  <option value="€">€ Euro (EUR)</option>
                  <option value="COP">COP Peso Colombiano</option>
                  <option value="MXN">MXN Peso Mexicano</option>
                  <option value="S/">S/ Sol Peruano (PEN)</option>
                  <option value="ARS">ARS Peso Argentino</option>
                </select>
              </div>

              {/* Sección: Categorías de Productos */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-amber-500" />
                      <span>Categorías de Productos</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Crea y administra las categorías de tu catálogo para clasificar tus productos y filtrar el inventario.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCategories}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer self-start sm:self-auto"
                    title="Restaurar lista original de categorías"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar predeterminadas</span>
                  </button>
                </div>

                {/* Formulario rápido para añadir categoría */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="Nueva categoría (ej. Perfumería, Gorras, Anillos)..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Lista de chips de categorías con botón eliminar */}
                <div className="flex flex-wrap gap-2 pt-1 max-h-52 overflow-y-auto pr-1">
                  {categories.map((cat, index) => {
                    const count = products.filter(
                      (p) => (p.category || '').toLowerCase() === cat.toLowerCase()
                    ).length;
                    return (
                      <span
                        key={`cat-setting-${cat}-${index}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs group hover:border-amber-400 dark:hover:border-amber-500 transition-colors"
                      >
                        <Tag className="w-3 h-3 text-amber-500" />
                        <span>{cat}</span>
                        {count > 0 && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono"
                            title={`${count} producto(s) en esta categoría`}
                          >
                            {count}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title={`Eliminar categoría "${cat}"`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                  <span>{categories.length} categorías configuradas para tus productos.</span>
                  <span>Toca la &quot;X&quot; para eliminar una categoría</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Nombre & Cambios</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CONEXIÓN A GOOGLE Y GOOGLE SHEETS */}
          {activeTab === 'google' && (
            <div className="space-y-5">
              {/* Google Account Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {user ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center overflow-hidden text-xs">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || 'Usuario'} className="w-full h-full object-cover" />
                        ) : (
                          user.email?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {user.displayName || user.email}
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Conectado
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{user.email}</div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="text-xs font-bold text-slate-900">Cuenta de Google</div>
                      <div className="text-[11px] text-slate-500">
                        Inicia sesión para vincular y sincronizar con tus hojas de Google Drive
                      </div>
                    </div>
                  )}
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={onLogoutGoogle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar sesión
                  </button>
                ) : (
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

              {/* Linked Spreadsheet Box */}
              {sheetsConfig.spreadsheetId ? (
                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl p-4 sm:p-5 border border-emerald-200 dark:border-emerald-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">
                          Base de Datos Conectada
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          ID: {sheetsConfig.spreadsheetId.slice(0, 16)}...
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {sheetsConfig.spreadsheetName || 'Base de Datos de Inventario'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Sincronizada con Google Sheets. Los cambios locales se suben en tiempo real.
                      </p>
                    </div>

                    {sheetsConfig.spreadsheetUrl && (
                      <a
                        href={sheetsConfig.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 shadow-xs transition-colors shrink-0"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Abrir en Google Sheets</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>
                    )}
                  </div>

                  {/* Sync Status & Action Buttons */}
                  <div className="pt-3 border-t border-emerald-200/70 dark:border-emerald-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Última sincronización: {sheetsConfig.lastSyncedAt ? new Date(sheetsConfig.lastSyncedAt).toLocaleString('es-ES') : 'Pendiente'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={handleManualSync}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-xs active:scale-95 transition-all cursor-pointer"
                        title="Subir cambios locales actuales a Google Sheets"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                      </button>

                      {onOpenConflictModal && (
                        <button
                          type="button"
                          onClick={onOpenConflictModal}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 shadow-xs active:scale-95 transition-all cursor-pointer"
                          title="Comparar datos locales y de la nube con resolución de conflictos por timestamp"
                        >
                          <GitMerge className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Comparar & Resolver Conflictos</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={handleImportFromSheet}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Descargar datos desde la hoja y reemplazar los locales"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Descargar Nube</span>
                      </button>
                    </div>
                  </div>

                  {/* Red Danger Zone: Eliminar datos de la nube y crear otros */}
                  <div className="mt-2 pt-3 border-t border-rose-200/70 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 -mx-4 -mb-4 p-4 rounded-b-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Eliminar datos de la nube y crear otros</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          Vacía los registros de tu Google Sheets para empezar en limpio o desvincula para vincular otra hoja.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!showClearCloudConfirm ? (
                          <button
                            type="button"
                            onClick={() => setShowClearCloudConfirm(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Limpiar Nube</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 animate-fadeIn">
                            <button
                              type="button"
                              disabled={isClearingCloud}
                              onClick={handleClearCloudDataClick}
                              className="px-2.5 py-1.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isClearingCloud ? 'Borrando...' : 'Confirmar Borrado Nube'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowClearCloudConfirm(false)}
                              className="px-2 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleDisconnectCloud}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Desconectar la hoja actual para crear o vincular otra"
                        >
                          Desvincular
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Si hay hojas encontradas en Google Drive, mostrarlas primero para evitar duplicados */}
                  {driveFiles.length > 0 && (
                    <div className="bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl p-4 border border-amber-500/30 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Bases de Datos Detectadas en tu Google Drive
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Para sincronizar con tus otros dispositivos y evitar crear hojas duplicadas, selecciona tu base de datos:
                      </p>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {driveFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all gap-2"
                          >
                            <div className="min-w-0 flex items-center gap-2.5">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {file.name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  Modificado: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('es-ES') : 'Reciente'}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectDriveSpreadsheet(file)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer shrink-0"
                            >
                              Vincular Esta Hoja
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Crear Hoja en Drive */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800/60 text-center">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Crear Hoja Nueva en tu Google Drive con 1 Click
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Crea automáticamente las pestañas de <strong>INVENTARIO_PRODUCTOS</strong>, <strong>CALCULO_DE_ENVIO</strong>, y <strong>VENTAS</strong> con columnas de timestamp.
                    </p>

                    <button
                      type="button"
                      disabled={isCreatingSheet}
                      onClick={handleCreateNewSheet}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-200 dark:shadow-none cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isCreatingSheet ? 'Creando en Drive...' : 'Crear Hoja en mi Google Drive'}</span>
                    </button>
                  </div>

                  {/* Vincular manualmente por ID */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-2">
                    <input
                      type="text"
                      value={customSheetId}
                      onChange={(e) => setCustomSheetId(e.target.value)}
                      placeholder="O pega el ID / enlace de una hoja existente..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleLinkExisting}
                      className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-700 cursor-pointer"
                    >
                      Vincular
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEMAS VISUALES Y MODO OSCURO (RECONFIGURADO Y PERSONALIZABLE) */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              {/* 1. MODO DE APARIENCIA: CLARO / OSCURO / SISTEMA */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      {themeMode === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Modo de Pantalla y Apariencia
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Selecciona entre interfaz clara diurna o el exclusivo modo oscuro obsidiana
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Botón Modo Claro */}
                  <button
                    type="button"
                    onClick={() => handleSaveThemeSettings(undefined, undefined, 'light')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      themeMode === 'light'
                        ? 'bg-white text-slate-900 border-amber-500 ring-2 ring-amber-500 shadow-sm'
                        : 'bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Modo Claro</span>
                        {themeMode === 'light' && (
                          <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Luminoso, nítido y perfecto para el día
                      </p>
                    </div>
                  </button>

                  {/* Botón Modo Oscuro */}
                  <button
                    type="button"
                    onClick={() => handleSaveThemeSettings(undefined, undefined, 'dark')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      themeMode === 'dark'
                        ? 'bg-slate-900 text-white border-amber-400 ring-2 ring-amber-400 shadow-sm shadow-amber-500/20'
                        : 'bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Modo Oscuro</span>
                        {themeMode === 'dark' && (
                          <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Obsidiana & dorado de alta joyería
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. SELECCIÓN DE PALETA DE COLOR & MODO PERSONALIZADO */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Paleta de Color y Acentos
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Personaliza los colores de botones, tarjetas e identidad visual
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold">
                    {selectedTheme === 'custom' ? customAccentColor : selectedTheme.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {THEMES.map((themeItem) => {
                    const isSelected = selectedTheme === themeItem.id;

                    return (
                      <button
                        key={themeItem.id}
                        type="button"
                        onClick={() => handleSaveThemeSettings(themeItem.id, themeItem.id === 'custom' ? customAccentColor : undefined)}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? `${themeItem.bgClass} shadow-xs ring-2 ring-amber-500 dark:ring-amber-400`
                            : 'border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${themeItem.colorClass}`}
                          style={themeItem.id === 'custom' ? { backgroundColor: customAccentColor } : undefined}
                        >
                          {isSelected ? <Check className="w-4 h-4" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            <span>{themeItem.name}</span>
                            {isSelected && (
                              <span className="text-[9px] bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-1.5 py-0.2 rounded font-black">
                                Activo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {themeItem.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EDITOR DE COLOR PERSONALIZADO (Aparece siempre o al seleccionar custom) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/5 via-slate-50 to-amber-500/10 dark:from-slate-800 dark:to-slate-900 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-500" />
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Personalizador de Color HEX Exclusivo
                    </h5>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Cambios en tiempo real
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Selector HTML5 interactivo */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <label className="relative cursor-pointer shrink-0">
                      <input
                        type="color"
                        value={customAccentColor}
                        onChange={(e) => {
                          const hex = e.target.value;
                          setCustomAccentColor(hex);
                          handleSaveThemeSettings('custom', hex);
                        }}
                        className="sr-only"
                        title="Abrir selector de color"
                      />
                      <div
                        className="w-10 h-10 rounded-2xl shadow-inner border-2 border-white dark:border-slate-700 cursor-pointer ring-2 ring-slate-300 dark:ring-slate-600 transition-transform active:scale-95"
                        style={{ backgroundColor: customAccentColor }}
                      />
                    </label>

                    <div className="relative flex-1 sm:w-36">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">#</span>
                      <input
                        type="text"
                        maxLength={7}
                        value={customAccentColor.replace('#', '')}
                        onChange={(e) => {
                          let val = e.target.value.trim();
                          if (!val.startsWith('#')) val = '#' + val;
                          setCustomAccentColor(val);
                          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                            handleSaveThemeSettings('custom', val);
                          }
                        }}
                        placeholder="F59E0B"
                        className="w-full pl-6 pr-2.5 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Chips de Colores Populares Rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap w-full sm:flex-1 justify-start sm:justify-end">
                    {[
                      { hex: '#f59e0b', name: 'Oro' },
                      { hex: '#10b981', name: 'Esmeralda' },
                      { hex: '#6366f1', name: 'Zafiro' },
                      { hex: '#a855f7', name: 'Amatista' },
                      { hex: '#f43f5e', name: 'Rubí' },
                      { hex: '#0ea5e9', name: 'Turquesa' },
                      { hex: '#ea580c', name: 'Ámbar Intenso' },
                      { hex: '#475569', name: 'Grafito' },
                    ].map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => {
                          setCustomAccentColor(preset.hex);
                          handleSaveThemeSettings('custom', preset.hex);
                        }}
                        title={preset.name}
                        className="w-6 h-6 rounded-full border border-white dark:border-slate-700 shadow-xs transition-transform hover:scale-110 active:scale-90 cursor-pointer"
                        style={{ backgroundColor: preset.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATOS DE PAGO & COBROS (PAGO MÓVIL Y TRANSFERENCIA) */}
          {activeTab === 'payments' && (
            <form onSubmit={handleSavePaymentSettings} className="space-y-6">
              <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">
                    Configuración de Cuentas para Cobros (WhatsApp & SMS)
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Personaliza aquí tus datos de Transferencia Bancaria y Pago Móvil. Cuando crees una venta en el apartado de ventas, podrás enviar un mensaje predeterminado con estos datos directamente a tu comprador.
                  </p>
                </div>
              </div>

              {/* Catálogo Digital para Clientes Banner */}
              {onOpenShareCatalog && (
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-yellow-500/5 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Catálogo Digital para Clientes (Solo Lectura)</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                          Enlace Público
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Tus clientes pueden ver tus productos, precios en $ y Bs. BCV, y enviarte pedidos a tu número de Pago Móvil por WhatsApp.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenShareCatalog}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartir Enlace</span>
                  </button>
                </div>
              )}

              {/* 1. SECCIÓN PRINCIPAL: PRECIO DE VENTA BCV (CON PORCENTAJE DIFERENCIAL) */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center font-black shadow-xs shrink-0">
                      <TrendingUp className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Precio de Venta BCV (Diferencial sobre Dólar)
                        </h4>
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full shrink-0">
                          Venezuela
                        </span>
                        {paymentDetails.enabledBcvPricing && (
                          <span className="text-[9.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.2 rounded-full border border-emerald-500/30 shrink-0">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Aplica un porcentaje de aumento al dólar americano para amortiguar el diferencial cambiario y mostrar el precio oficial BCV en Inventario y Ventas.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(paymentDetails.enabledBcvPricing)}
                      onChange={(e) => {
                        const next = {
                          ...paymentDetails,
                          enabledBcvPricing: e.target.checked,
                        };
                        updatePaymentDetails(next, true);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {paymentDetails.enabledBcvPricing ? (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Porcentaje de Aumento */}
                      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-amber-500/30 shadow-2xs">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                          <Percent className="w-4 h-4 text-amber-500 shrink-0" />
                          Porcentaje de Aumento Diferencial (%)
                        </label>
                        <div className="relative mt-1.5">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="500"
                            value={paymentDetails.bcvDifferentialPercent ?? 15}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updatePaymentDetails({
                                ...paymentDetails,
                                bcvDifferentialPercent: val,
                              }, true);
                            }}
                            placeholder="15"
                            className="w-full pl-3 pr-8 py-2 text-sm font-black border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                          Porcentaje adicional sobre el precio de venta en USD (ej: 10%, 15%, 20%).
                        </p>
                      </div>

                      {/* Tasa Oficial BCV */}
                      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-amber-500/30 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                            Tasa Oficial BCV (Bs. / USD)
                          </label>
                          <button
                            type="button"
                            onClick={handleFetchLiveRates}
                            disabled={isFetchingLiveRates}
                            className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isFetchingLiveRates ? 'animate-spin' : ''}`} />
                            {isFetchingLiveRates ? 'Consultando...' : 'Obtener en vivo'}
                          </button>
                        </div>
                        <div className="relative mt-1.5">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Bs.</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={paymentDetails.bcvRate ?? 880}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updatePaymentDetails({
                                ...paymentDetails,
                                bcvRate: val,
                              }, true);
                            }}
                            placeholder="880.00"
                            className="w-full pl-9 pr-3 py-2 text-sm font-black border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                          Tasa oficial publicada por el Banco Central de Venezuela.
                        </p>
                      </div>
                    </div>

                    {/* Previsualización en vivo */}
                    <div className="bg-amber-500/10 dark:bg-amber-500/5 rounded-xl p-3 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-amber-900 dark:text-amber-200">
                          Ejemplo con producto de $10.00:
                        </span>
                        <div className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                          Con +{paymentDetails.bcvDifferentialPercent ?? 15}% diferencial ➔ Ref. BCV:{' '}
                          <strong className="text-slate-900 dark:text-white font-mono">
                            ${(10 * (1 + (paymentDetails.bcvDifferentialPercent ?? 15) / 100)).toFixed(2)} USD
                          </strong>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-amber-500/30 text-right">
                        <span className="text-[10px] text-slate-400 block">Total en Bolívares (BCV):</span>
                        <span className="text-sm font-black text-amber-800 dark:text-amber-300 font-mono">
                          Bs.{' '}
                          {(
                            10 *
                            (1 + (paymentDetails.bcvDifferentialPercent ?? 15) / 100) *
                            (paymentDetails.bcvRate || 880)
                          ).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        El <strong>Precio de Venta BCV</strong> aparecerá en los menús de Inventario y Ventas. Al enviar mensajes de cobro, se incluirá la conversión a Bolívares a la tasa oficial.
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Opción desactivada. El precio BCV no se mostrará en los menús de inventario ni ventas, y no se incluirá en los mensajes.
                  </p>
                )}
              </div>

              {/* 2. SECCIÓN: PRECIO USDT (BINANCE) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-900 flex items-center justify-center font-black shadow-xs shrink-0">
                      <Coins className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Precio USDT (Binance)
                        </h4>
                        <span className="text-[10px] font-bold bg-yellow-400/20 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full shrink-0">
                          Mensajes de Cobro
                        </span>
                        {paymentDetails.enabledUsdtPricing && (
                          <span className="text-[9.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.2 rounded-full border border-emerald-500/30 shrink-0">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Activa para incluir la conversión a precio USDT publicado por Binance en el mensaje de cobro (WhatsApp/SMS). No agrega precios nuevos en inventario ni ventas.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(paymentDetails.enabledUsdtPricing)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const next = {
                          ...paymentDetails,
                          enabledUsdtPricing: isChecked,
                          enabledBinancePay: isChecked,
                        };
                        updatePaymentDetails(next, true);
                        if (isChecked) {
                          setPaymentMethodSubTab('binance');
                          setPreviewMessageMethod('binance');
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
                  </label>
                </div>

                {paymentDetails.enabledUsdtPricing ? (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                    <div className="max-w-md bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-yellow-400/30 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-yellow-500 shrink-0" />
                          Tasa Binance USDT / P2P (Bs. / USDT)
                        </label>
                        <button
                          type="button"
                          onClick={handleFetchLiveRates}
                          disabled={isFetchingLiveRates}
                          className="text-[11px] font-semibold text-yellow-700 dark:text-yellow-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isFetchingLiveRates ? 'animate-spin' : ''}`} />
                          {isFetchingLiveRates ? 'Consultando...' : 'Obtener en vivo'}
                        </button>
                      </div>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Bs.</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={paymentDetails.binanceUsdtRate ?? 1010}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updatePaymentDetails({
                              ...paymentDetails,
                              binanceUsdtRate: val,
                            }, true);
                          }}
                          placeholder="1010.00"
                          className="w-full pl-9 pr-3 py-2 text-sm font-black border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                        Tasa de referencia USDT/VES en Binance P2P.
                      </p>
                    </div>

                    <div className="bg-yellow-400/10 dark:bg-yellow-400/5 p-3 rounded-xl border border-yellow-400/20 text-xs text-yellow-900 dark:text-yellow-200 flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
                      <span>
                        Modalidad USDT activa: puedes cobrar con <strong>Binance Pay</strong> y tus clientes podrán seleccionar Binance Pay en el catálogo digital.
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Precio USDT desactivado. No se incluirá en los mensajes de cobro ni en las opciones de Binance Pay.
                  </p>
                )}
              </div>

              {rateFetchNotice && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{rateFetchNotice}</span>
                </div>
              )}

              {/* BARRA DE PESTAÑAS DE MÉTODOS DE PAGO: PAGO MÓVIL | TRANSFERENCIA | BINANCE PAY */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPaymentMethodSubTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    paymentMethodSubTab === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos los Métodos
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethodSubTab('pago_movil')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    paymentMethodSubTab === 'pago_movil'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>Pago Móvil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethodSubTab('transferencia')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    paymentMethodSubTab === 'transferencia'
                      ? 'bg-sky-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Transferencia</span>
                </button>
                {paymentDetails.enabledUsdtPricing && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethodSubTab('binance');
                      setPreviewMessageMethod('binance');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer animate-in zoom-in-95 ${
                      paymentMethodSubTab === 'binance'
                        ? 'bg-yellow-500 text-slate-950 shadow-xs font-black'
                        : 'text-yellow-700 dark:text-yellow-400 bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/30'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 shrink-0" />
                    <span>Binance Pay (ID)</span>
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shrink-0" />
                  </button>
                )}
              </div>

              {/* SECCIÓN / PESTAÑA BINANCE PAY (USDT) */}
              {paymentDetails.enabledUsdtPricing && (paymentMethodSubTab === 'all' || paymentMethodSubTab === 'binance') && (
                <div className="bg-gradient-to-br from-yellow-500/15 via-yellow-500/5 to-transparent border border-yellow-500/30 dark:border-yellow-500/20 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-yellow-500/20 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                        <Coins className="w-5 h-5 shrink-0" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Método de Pago: Binance Pay (USDT)</span>
                          <span className="text-[10px] font-bold bg-yellow-200 text-yellow-950 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded-full shrink-0">
                            Exclusivo Binance ID
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Cobros directos en criptomonedas sin comisiones a tu cuenta de Binance
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Explicación clave */}
                  <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-yellow-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <p className="font-bold text-yellow-800 dark:text-yellow-300 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                      <span>Modalidad de Cobro Exclusiva para Binance:</span>
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Al cobrar una venta con Binance o cuando un cliente elija Binance Pay en el catálogo, <strong>únicamente se enviarán los datos de tu Binance ID y el monto en USDT</strong>, sin incluir cuentas bancarias ni Pago Móvil.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {/* Binance ID / Pay ID */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Binance ID o Pay ID (UID de 9 dígitos) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.binancePay?.binanceId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updatePaymentDetails((prev) => ({
                            ...prev,
                            binancePay: {
                              email: prev.binancePay?.email || '',
                              alias: prev.binancePay?.alias || '',
                              notes: prev.binancePay?.notes || '',
                              ...(prev.binancePay || {}),
                              binanceId: val,
                            },
                          }), true);
                        }}
                        placeholder="Ej: 123456789 o Pay ID de Binance"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                        required
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Tu ID numérico que aparece en tu perfil de la app Binance o en la sección Binance Pay.
                      </p>
                    </div>

                    {/* Nombre / Alias */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Nombre o Nickname de Cuenta (Opcional)
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.binancePay?.alias || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updatePaymentDetails((prev) => ({
                            ...prev,
                            binancePay: {
                              binanceId: prev.binancePay?.binanceId || '',
                              email: prev.binancePay?.email || '',
                              notes: prev.binancePay?.notes || '',
                              ...(prev.binancePay || {}),
                              alias: val,
                            },
                          }), true);
                        }}
                        placeholder="Ej: VincintStore"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    {/* Correo Binance */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Correo de Cuenta Binance (Opcional)
                      </label>
                      <input
                        type="email"
                        value={paymentDetails.binancePay?.email || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updatePaymentDetails((prev) => ({
                            ...prev,
                            binancePay: {
                              binanceId: prev.binancePay?.binanceId || '',
                              alias: prev.binancePay?.alias || '',
                              notes: prev.binancePay?.notes || '',
                              ...(prev.binancePay || {}),
                              email: val,
                            },
                          }), true);
                        }}
                        placeholder="Ej: pagos@vincintomnia.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    {/* Instrucciones de Pago Binance */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Instrucciones para el Comprador
                      </label>
                      <textarea
                        rows={2}
                        value={paymentDetails.binancePay?.notes || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updatePaymentDetails((prev) => ({
                            ...prev,
                            binancePay: {
                              binanceId: prev.binancePay?.binanceId || '',
                              email: prev.binancePay?.email || '',
                              alias: prev.binancePay?.alias || '',
                              ...(prev.binancePay || {}),
                              notes: val,
                            },
                          }), true);
                        }}
                        placeholder="Por favor envía la captura de Binance Pay con el ID de transacción para procesar y despachar tu pedido."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN PAGO MÓVIL */}
              {(paymentMethodSubTab === 'all' || paymentMethodSubTab === 'pago_movil') && (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Smartphone className="w-4 h-4 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Pago Móvil (Venezuela)
                        <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                          Recomendado
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Cobros instantáneos interbancarios</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={paymentDetails.enabledPagoMovil}
                      onChange={(e) => {
                        const next = {
                          ...paymentDetails,
                          enabledPagoMovil: e.target.checked,
                        };
                        updatePaymentDetails(next, true);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {paymentDetails.enabledPagoMovil ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Banco
                      </label>
                      <input
                        type="text"
                        list="venezuelan-banks"
                        value={paymentDetails.pagoMovil.bankName}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            pagoMovil: {
                              ...paymentDetails.pagoMovil,
                              bankName: e.target.value,
                            },
                          })
                        }
                        placeholder="Ej. Banesco (0134) o Mercantil (0105)"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Teléfono Registrado
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.pagoMovil.phone}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            pagoMovil: {
                              ...paymentDetails.pagoMovil,
                              phone: e.target.value,
                            },
                          })
                        }
                        placeholder="0414-1234567"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cédula / RIF
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.pagoMovil.idNumber}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            pagoMovil: {
                              ...paymentDetails.pagoMovil,
                              idNumber: e.target.value,
                            },
                          })
                        }
                        placeholder="V-20123456 o J-50123456-7"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Pago Móvil desactivado. Los datos de pago móvil no se incluirán en los mensajes de cobro.
                  </p>
                )}
              </div>
              )}

              {/* SECCIÓN TRANSFERENCIA BANCARIA */}
              {(paymentMethodSubTab === 'all' || paymentMethodSubTab === 'transferencia') && (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-700 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Building2 className="w-4 h-4 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Transferencia Bancaria Nacional
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Cuentas corrientes o de ahorros</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={paymentDetails.enabledBankTransfer}
                      onChange={(e) => {
                        const next = {
                          ...paymentDetails,
                          enabledBankTransfer: e.target.checked,
                        };
                        updatePaymentDetails(next, true);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>

                {paymentDetails.enabledBankTransfer ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre del Banco
                      </label>
                      <input
                        type="text"
                        list="venezuelan-banks"
                        value={paymentDetails.bankTransfer.bankName}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            bankTransfer: {
                              ...paymentDetails.bankTransfer,
                              bankName: e.target.value,
                            },
                          })
                        }
                        placeholder="Ej. Banesco Banco Universal"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                      />
                      <datalist id="venezuelan-banks">
                        <option value="Banesco Banco Universal (0134)" />
                        <option value="Banco de Venezuela (0102)" />
                        <option value="Banco Mercantil (0105)" />
                        <option value="BBVA Banco Provincial (0108)" />
                        <option value="Bancamiga (0172)" />
                        <option value="Banco Nacional de Crédito BNC (0191)" />
                        <option value="Banco Exterior (0115)" />
                        <option value="Bancaribe (0114)" />
                        <option value="Banco Plaza (0138)" />
                        <option value="100% Banco (0156)" />
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Número de Cuenta (20 dígitos)
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.bankTransfer.accountNumber}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            bankTransfer: {
                              ...paymentDetails.bankTransfer,
                              accountNumber: e.target.value,
                            },
                          })
                        }
                        placeholder="0134-0000-00-0000000000"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={paymentDetails.bankTransfer.accountType}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            bankTransfer: {
                              ...paymentDetails.bankTransfer,
                              accountType: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="Cuenta Corriente">Cuenta Corriente</option>
                        <option value="Cuenta de Ahorros">Cuenta de Ahorros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Titular de la Cuenta
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.bankTransfer.accountHolder}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            bankTransfer: {
                              ...paymentDetails.bankTransfer,
                              accountHolder: e.target.value,
                            },
                          })
                        }
                        placeholder="Nombre de la empresa o titular"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cédula de Identidad o RIF
                      </label>
                      <input
                        type="text"
                        value={paymentDetails.bankTransfer.idNumber}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            bankTransfer: {
                              ...paymentDetails.bankTransfer,
                              idNumber: e.target.value,
                            },
                          })
                        }
                        placeholder="J-50123456-7 o V-20123456"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Correo Electrónico (Para envío de recibos)
                      </label>
                      <input
                        type="email"
                        value={paymentDetails.bankTransfer.email || ''}
                        onChange={(e) =>
                          setPaymentDetails({
                            ...paymentDetails,
                            bankTransfer: {
                              ...paymentDetails.bankTransfer,
                              email: e.target.value,
                            },
                          })
                        }
                        placeholder="pagos@tuempresa.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Transferencia Bancaria desactivada.
                  </p>
                )}
              </div>
              )}

              {/* INSTRUCCIONES ADICIONALES */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Instrucciones Adicionales en el Mensaje de Cobro
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Aparecerán al pie del mensaje para solicitar el comprobante al cliente.
                </p>
                <textarea
                  rows={2}
                  value={paymentDetails.customInstructions || ''}
                  onChange={(e) =>
                    setPaymentDetails({
                      ...paymentDetails,
                      customInstructions: e.target.value,
                    })
                  }
                  placeholder="Por favor envía el comprobante o captura de pago con el número de referencia para procesar y despachar tu pedido."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              {/* VISTA PREVIA DEL MENSAJE DE WHATSAPP / SMS */}
              <div className="border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h5 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      Vista Previa del Mensaje de Cobro
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {paymentDetails.enabledUsdtPricing && (
                      <div className="inline-flex p-0.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setPreviewMessageMethod('pago_movil')}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            previewMessageMethod === 'pago_movil'
                              ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-2xs font-extrabold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Pago Móvil
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMessageMethod('binance')}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            previewMessageMethod === 'binance'
                              ? 'bg-yellow-400 text-slate-950 shadow-2xs font-extrabold'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Binance Pay (ID)
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const sampleMessage = generatePaymentMessage({
                          customerName: 'María Pérez',
                          items: [
                            { productName: 'Gafas de Sol Vintage', quantity: 2, unitPrice: 6.0 },
                            { productName: 'Reloj de Cuarzo Elegance', quantity: 1, unitPrice: 15.0 },
                          ],
                          totalSale: 32.0,
                          shippingChargedToCustomer: 5.0,
                          paymentMethod: previewMessageMethod,
                          appName,
                          currency,
                          paymentDetails,
                          orderNumber: 'PED-1001',
                        });
                        navigator.clipboard.writeText(sampleMessage);
                        setCopiedPreview(true);
                        setTimeout(() => setCopiedPreview(false), 2500);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      {copiedPreview ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPreview ? '¡Copiado!' : 'Copiar Ejemplo'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-3 text-[11px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap shadow-inner max-h-56 overflow-y-auto leading-relaxed">
                  {generatePaymentMessage({
                    customerName: 'María Pérez',
                    items: [
                      { productName: 'Gafas de Sol Vintage', quantity: 2, unitPrice: 6.0 },
                      { productName: 'Reloj de Cuarzo Elegance', quantity: 1, unitPrice: 15.0 },
                    ],
                    totalSale: 32.0,
                    shippingChargedToCustomer: 5.0,
                    paymentMethod: previewMessageMethod,
                    appName,
                    currency,
                    paymentDetails,
                    orderNumber: 'PED-1001',
                  })}
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Datos de Pago</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: BASE DE DATOS LOCAL, COPIAS DE SEGURIDAD Y BORRAR INVENTARIO */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Encabezado Principal */}
              <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-purple-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5 text-purple-300 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Base de Datos Local & Copias de Seguridad
                        <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-full font-mono">
                          JSON 3.0
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Administra el almacenamiento interno, exporta copias completas de seguridad o reinicia el inventario cuando lo requieras.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjetas de Resumen del Estado de la Base de Datos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Productos en Stock</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {products.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">artículos registrados</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Ventas & Pedidos</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {orders.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">órdenes procesadas</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Lotes & Fletes</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {shippingBatches.length + retentionBatches.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">lotes y retenciones</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Gastos Registrados</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {expenses.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">egresos operativos</div>
                </div>
              </div>

              {/* Opciones de Base de Datos: Exportar / Descargar Copia JSON */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Download className="w-4 h-4 shrink-0" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Descargar Copia de Seguridad (.json)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Exporta un archivo seguro con todos tus productos, clientes, lotes, ventas, gastos y ajustes. Puedes guardarlo en tu computadora, memoria USB o Google Drive como respaldo offline.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportDatabaseToJson}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Descargar Base de Datos Completa (.json)</span>
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Formato JSON universal compatible
                  </span>
                </div>
              </div>

              {/* Opciones de Base de Datos: Restaurar / Importar Copia JSON */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Upload className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Restaurar Base de Datos desde Archivo JSON
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Carga una copia de seguridad previamente descargada para recuperar tu inventario, ventas y configuración en este equipo.
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all shadow-2xs">
                    <Upload className="w-4 h-4" />
                    <span>Seleccionar Archivo .JSON para Restaurar</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleImportDatabaseFromJson}
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Se verificará la estructura antes de aplicar
                  </span>
                </div>
              </div>

              {/* Cargar datos de prueba (Demo) si existe onLoadDemoData */}
              {onLoadDemoData && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Cargar Datos de Demostración (Pruebas)
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Puebla el inventario con artículos y lotes de ejemplo para probar el sistema.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExecuteLoadDemoData}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer shrink-0"
                  >
                    Cargar Demo
                  </button>
                </div>
              )}

              {/* ZONA DE PELIGRO: BORRAR INVENTARIO Y BASE DE DATOS LOCAL */}
              <div className="bg-rose-50/70 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                      <span>Zona de Peligro: Borrar Inventario y Vaciar Base de Datos</span>
                    </h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                      Esta acción eliminará de forma permanente todos los productos del inventario, ventas, lotes de envío y gastos registrados en la memoria local de este dispositivo.
                    </p>
                    <p className="text-[10px] text-rose-600/90 dark:text-rose-400 mt-0.5">
                      ⚠️ Esta operación no se puede deshacer. Si necesitas resguardar tu información, descarga primero una copia de seguridad en JSON con el botón superior.
                    </p>
                  </div>
                </div>

                {!showConfirmClearAll ? (
                  <div className="pt-2 flex justify-start">
                    <button
                      type="button"
                      onClick={() => setShowConfirmClearAll(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Borrar Todo el Inventario y Datos Locales</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                      <AlertCircle className="w-4 h-4" />
                      <span>¿Confirmas que deseas vaciar todo el inventario?</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Se borrarán {products.length} productos, {orders.length} pedidos y {expenses.length} gastos. Esta acción es inmediata e irreversible.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleExecuteClearAllData}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sí, Borrar Todo Definitivamente</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmClearAll(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: GUÍA PARA ABRIR E INSTALAR EN ANDROID Y EN IPHONE */}
          {activeTab === 'mobile' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 rounded-2xl p-5 text-white shadow-md border border-indigo-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Abrir Vincit Omnia en Android y iPhone como App Nativa (PWA)
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      No necesitas descargar nada desde Play Store o App Store. Puedes instalarla directamente desde tu navegador en menos de 10 segundos.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="text-slate-300 font-mono text-[11px] truncate flex-1">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://tu-app-url.run.app'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.origin);
                        setStatusMessage({ type: 'success', text: '📋 Enlace copiado. Ábrelo en tu teléfono móvil.' });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Enlace para tu Celular</span>
                  </button>
                </div>
              </div>

              {/* Botón de Instalación Directa PWA */}
              <PWAInstallButton variant="settings" />

              {/* Guía en 2 Columnas: iPhone y Android */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Columna 1: iPhone / iOS (Safari) */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                      
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        En iPhone & iPad (iOS)
                      </h5>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Usando navegador Safari</span>
                    </div>
                  </div>

                  <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        1
                      </span>
                      <span>
                        Abre el enlace de la aplicación en <strong>Safari</strong> (debe ser Safari para permitir la instalación).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        2
                      </span>
                      <span>
                        Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">↑</span> en la barra inferior).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        3
                      </span>
                      <span>
                        Baja en el menú y selecciona <strong>&ldquo;Agregar a la pantalla de inicio&rdquo;</strong> (Add to Home Screen).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        4
                      </span>
                      <span>
                        Presiona <strong>&ldquo;Agregar&rdquo;</strong> arriba a la derecha. El icono de Vincit Omnia aparecerá en tu iPhone como una app nativa en pantalla completa.
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Columna 2: Android (Chrome) */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                      🤖
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        En Celulares Android
                      </h5>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Samsung, Xiaomi, Motorola, etc.</span>
                    </div>
                  </div>

                  <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        1
                      </span>
                      <span>
                        Abre el enlace de la aplicación en <strong>Google Chrome</strong> en tu teléfono Android.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        2
                      </span>
                      <span>
                        Toca el botón de los <strong>tres puntos verticales (⋮)</strong> en la esquina superior derecha de Chrome.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        3
                      </span>
                      <div>
                        <span>
                          Toca en <strong>«Instalar aplicación»</strong> o <strong>«Instalar StockFlow»</strong>.
                        </span>
                        <div className="mt-1.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 leading-snug">
                          <strong>⚠️ ¿Solo te sale «Agregar acceso directo»?</strong>
                          <p className="mt-0.5">
                            Si estás navegando dentro de la vista previa o el visor interno de <strong>WhatsApp, Instagram o Facebook</strong>, la instalación está bloqueada por esa red social. Toca los tres puntos (⋮) y selecciona <strong>«Abrir en Chrome»</strong>. Al abrir en Google Chrome oficial verás la opción <strong>«Instalar aplicación»</strong> con icono nativo y pantalla completa.
                          </p>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        4
                      </span>
                      <span>
                        Confirma con <strong>«Instalar»</strong>. ¡Listo! La app se integrará en tu teléfono como app nativa, con icono independiente y funcionamiento offline.
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
