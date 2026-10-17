import React, { useState, useMemo, useEffect } from 'react';
import { Product, AppSettings } from '../types';
import { DEFAULT_PAYMENT_DETAILS, storageService, getProductDiscountInfo, getProductEffectivePrice } from '../services/storageService';
import { formatPhoneForWhatsApp } from '../services/paymentMessageService';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  Phone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  CreditCard,
  Copy,
  Check,
  Sun,
  Moon,
  Store,
  Layers,
  Eye,
  Send,
  LayoutGrid,
  List,
  Smartphone,
  Coins,
  Receipt,
  Camera,
  Tag,
} from 'lucide-react';

interface CustomerCatalogProps {
  products: Product[];
  settings: AppSettings;
  currency: string;
  onExitCatalog?: () => void;
  onToggleDarkMode?: () => void;
}

interface CartItem {
  productId: string;
  quantity: number;
}

export const CustomerCatalog: React.FC<CustomerCatalogProps> = ({
  products,
  settings,
  currency,
  onToggleDarkMode,
}) => {
  // Load settings and payment details safely
  const paymentDetails = useMemo(() => ({
    ...DEFAULT_PAYMENT_DETAILS,
    ...(settings?.paymentDetails || storageService.getAppSettings().paymentDetails || {}),
  }), [settings?.paymentDetails]);

  // BCV Rate and differential calculations
  const bcvRate = typeof paymentDetails.bcvRate === 'number' && paymentDetails.bcvRate > 0 ? paymentDetails.bcvRate : 880;
  const bcvPercent = typeof paymentDetails.bcvDifferentialPercent === 'number' ? paymentDetails.bcvDifferentialPercent : 0;
  const isBcvActive = Boolean(paymentDetails.enabledBcvPricing || bcvRate > 0);
  const isUsdtActive = Boolean(paymentDetails.enabledUsdtPricing);
  const binanceRate = typeof paymentDetails.binanceUsdtRate === 'number' && paymentDetails.binanceUsdtRate > 0 ? paymentDetails.binanceUsdtRate : 1010;

  // Shopping Cart state with localStorage persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('stockflow_customer_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('stockflow_customer_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cart]);

  // UI States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentInfoModalOpen, setIsPaymentInfoModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [addedAlertProduct, setAddedAlertProduct] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [preferredPayment, setPreferredPayment] = useState<'pago_movil' | 'transferencia' | 'usdt' | 'efectivo'>('pago_movil');
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState('');
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [orderSentModal, setOrderSentModal] = useState<boolean>(false);
  const [lastOrderMessage, setLastOrderMessage] = useState<string>('');

  // Helper to copy field with visual feedback
  const handleCopyField = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Calculate cart items with full product details
  const cartWithProducts = useMemo(() => {
    return cart
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return null;
        return {
          product: prod,
          quantity: Math.min(item.quantity, prod.stock > 0 ? prod.stock : 1),
        };
      })
      .filter((item): item is { product: Product; quantity: number } => item !== null);
  }, [cart, products]);

  // Cart totals
  const totalItemsCount = useMemo(() => {
    return cartWithProducts.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartWithProducts]);

  const totalUsd = useMemo(() => {
    return cartWithProducts.reduce((sum, item) => sum + getProductEffectivePrice(item.product) * item.quantity, 0);
  }, [cartWithProducts]);

  const totalBcvUsd = totalUsd * (1 + bcvPercent / 100);
  const totalBcvBs = totalBcvUsd * bcvRate;
  const totalUsdtBs = totalUsd * binanceRate;

  // Categories list
  const categories = useMemo(() => {
    const rawCategories = products
      .map((p) => p.category?.trim())
      .filter((c): c is string => Boolean(c) && c.toLowerCase() !== 'todas');
    return ['Todas', ...Array.from(new Set(rawCategories))];
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
        const matchesSearch =
          !search.trim() ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
          (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
        const matchesStock = !onlyAvailable || p.stock > 0;
        return matchesCategory && matchesSearch && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return getProductEffectivePrice(a) - getProductEffectivePrice(b);
        if (sortBy === 'price_desc') return getProductEffectivePrice(b) - getProductEffectivePrice(a);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (a.itemNumber || 0) - (b.itemNumber || 0);
      });
  }, [products, selectedCategory, search, onlyAvailable, sortBy]);

  // Cart operations
  const handleAddToCart = (product: Product, quantityToAdd = 1) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantityToAdd, product.stock);
        return prev.map((item) => (item.productId === product.id ? { ...item, quantity: nextQty } : item));
      } else {
        return [...prev, { productId: product.id, quantity: Math.min(quantityToAdd, product.stock) }];
      }
    });

    setAddedAlertProduct(product.name);
    setTimeout(() => setAddedAlertProduct(null), 2500);
  };

  const handleUpdateQuantity = (productId: string, newQty: number, maxStock: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const finalQty = Math.min(newQty, maxStock);
    setCart((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity: finalQty } : item)));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // WhatsApp Order Generator
  const handleSendOrderWhatsApp = () => {
    if (cartWithProducts.length === 0) return;
    if (!customerName.trim()) {
      alert('Por favor ingresa tu nombre completo para identificar tu pedido.');
      return;
    }

    // Determine target merchant phone
    const rawPhone = paymentDetails.pagoMovil?.phone || '0414-1234567';
    const cleanPhone = formatPhoneForWhatsApp(rawPhone);

    const storeName = settings.appName || 'Vincit Omnia';
    const clientName = customerName.trim();
    const phoneContact = customerPhone.trim() ? `\n📱 *Teléfono del Cliente:* ${customerPhone.trim()}` : '';
    const addressNote = deliveryAddress.trim() ? `\n📍 *Entrega / Dirección:* ${deliveryAddress.trim()}` : '\n📍 *Entrega:* A acordar con la tienda';

    let paymentMethodName = 'Pago Móvil (Bolívares)';
    if (preferredPayment === 'transferencia') paymentMethodName = 'Transferencia Bancaria (Bolívares)';
    if (preferredPayment === 'efectivo') paymentMethodName = 'Efectivo en Dólares / Divisas en persona';
    if (preferredPayment === 'usdt') paymentMethodName = 'Binance Pay (USDT)';

    const lines: string[] = [
      `🛍️ *¡HOLA! DESEO REALIZAR UN PEDIDO:*`,
      `🏪 *Tienda:* ${storeName}`,
      `👤 *Cliente:* ${clientName}${phoneContact}${addressNote}`,
      `💳 *Método de Pago Elegido:* ${paymentMethodName}`,
    ];

    // Reference number and capture notice
    if (paymentReferenceNumber.trim()) {
      lines.push(`🧾 *N° de Referencia de Pago:* *${paymentReferenceNumber.trim()}*`);
      lines.push(`📎 *Comprobante:* Adjunto captura / screenshot de la transferencia en este chat`);
    } else if (alreadyPaid) {
      lines.push(`📎 *Comprobante:* Ya realicé el pago, adjunto captura / comprobante a continuación`);
    } else {
      lines.push(`📎 *Comprobante:* Solicito confirmación para proceder con el pago y enviar captura`);
    }

    lines.push('');
    lines.push('🛒 *DETALLE DEL PEDIDO:*');

    cartWithProducts.forEach((item, index) => {
      const disc = getProductDiscountInfo(item.product);
      const unitUsd = disc.effectivePrice;
      const subUsd = unitUsd * item.quantity;
      let line = `${index + 1}. *${item.product.name}* (x${item.quantity}) ➔ $${subUsd.toFixed(2)} USD`;
      if (disc.hasDiscount) {
        line += ` _(Oferta -${disc.percent}% OFF)_`;
      }
      if (preferredPayment !== 'usdt') {
        const itemBcvUsd = unitUsd * (1 + bcvPercent / 100);
        const itemBs = itemBcvUsd * bcvRate * item.quantity;
        line += `\n   ↳ Ref. Dólar BCV (+${bcvPercent}%): $${itemBcvUsd.toFixed(2)} | Bs. ${itemBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      lines.push(line);
    });

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push(`💰 *TOTAL EN DÓLARES: $${totalUsd.toFixed(2)} USD*`);

    if (preferredPayment === 'usdt') {
      lines.push(`🟡 *TOTAL EN BINANCE PAY: ${totalUsd.toFixed(2)} USDT*`);
      if (paymentDetails.binancePay?.binanceId) {
        lines.push(`• *Binance ID Destino:* ${paymentDetails.binancePay.binanceId}`);
      }
      if (paymentDetails.binancePay?.alias) {
        lines.push(`• *Titular / Alias:* ${paymentDetails.binancePay.alias}`);
      }
    } else {
      lines.push(`📈 *TOTAL DÓLAR BCV (+${bcvPercent}%): $${totalBcvUsd.toFixed(2)}*`);
      lines.push(`🇻🇪 *TOTAL EN BOLÍVARES (Tasa BCV): Bs. ${totalBcvBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`);
      lines.push(`• Tasa Oficial BCV: Bs. ${bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / $`);
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('Quedo atento a la confirmación de la disponibilidad y despacho. ¡Muchas gracias!');

    const fullMessage = lines.join('\n');
    setLastOrderMessage(fullMessage);

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMessage)}`;
    window.open(waUrl, '_blank');

    setOrderSentModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-white pb-24 md:pb-12">
      {/* 1. TOP FINANCIAL TICKER BAR (Tasa BCV & Datos de Pago) */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-white text-[11px] sm:text-xs font-semibold py-1.5 px-3 sm:px-6 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="font-extrabold flex items-center gap-1.5">
            🇻🇪 <span>Tasa Oficial BCV:</span>
          </span>
          <span className="bg-white/25 backdrop-blur-xs px-2.5 py-0.5 rounded-full font-mono font-black text-white shadow-2xs">
            Bs. {bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / $
          </span>
          {bcvPercent > 0 && (
            <span className="inline-flex items-center gap-1 bg-amber-900/30 px-2 py-0.5 rounded-full text-white text-[10.5px] font-bold">
              <span>Diferencial:</span>
              <span className="text-yellow-200">+{bcvPercent}%</span>
              <span className="hidden sm:inline text-white/80 font-normal">
                (Tasa Aplicada: Bs. {(bcvRate * (1 + bcvPercent / 100)).toLocaleString('es-VE', { minimumFractionDigits: 2 })} / $)
              </span>
            </span>
          )}
          {isUsdtActive && (
            <span className="hidden lg:inline-flex items-center gap-1 bg-yellow-400/30 px-2 py-0.5 rounded-full text-white text-[10.5px] font-bold">
              🟡 Binance USDT: Bs. {binanceRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaymentInfoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-white text-amber-900 hover:bg-amber-50 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <CreditCard className="w-3 h-3 text-amber-600" />
            <span>Ver Datos de Pago</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR (Brand & Cart, strictly NO admin panel button) */}
      <header className="sticky top-[31px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Store Name */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {settings.customLogoUrl ? (
              <img
                src={settings.customLogoUrl}
                alt="Logo"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-contain border border-slate-200 dark:border-slate-800 p-0.5 bg-white shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-amber-500/20 shadow-md shrink-0">
                <Store className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-black text-base sm:text-lg lg:text-xl truncate tracking-tight text-slate-900 dark:text-white">
                  {settings.appName || 'Vincit Omnia'}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                  Catálogo Oficial
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {settings.appSubtitle || 'Productos y pedidos directos por WhatsApp'}
              </p>
            </div>
          </div>

          {/* Right Header Actions: Dark Mode & Shopping Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Cambiar tema"
              >
                {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Shopping Cart Button with Live Counter */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="hidden sm:inline">Carrito</span>
              {totalItemsCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-900 text-white text-[11px] font-black border border-white/20 animate-in zoom-in">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO WELCOME BANNER */}
      <section className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 py-5 sm:py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Catálogo Digital Interactivo con Precios en Dólares y Bolívares</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
              Explora nuestros productos y haz tu pedido
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Elige en cuadrícula o lista, añade al carrito y envía tu comprobante de pago de inmediato con tu número de referencia por WhatsApp.
            </p>
          </div>

          {/* Quick info trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsPaymentInfoModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 shadow-2xs hover:border-amber-500 transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Datos de Pago</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <Phone className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">WhatsApp Directo</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Inventario al Día</span>
            </div>
          </div>
        </div>
      </section>

      {/* Added Alert Toast */}
      {addedAlertProduct && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 dark:bg-amber-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-white shrink-0" />
          <div className="text-xs">
            <p className="font-bold">¡Agregado al Carrito!</p>
            <p className="text-slate-300 dark:text-amber-100 truncate max-w-[200px]">{addedAlertProduct}</p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-2 px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-[11px] font-bold tracking-wide transition-colors cursor-pointer"
          >
            Ver Carrito
          </button>
        </div>
      )}

      {/* 4. MAIN CATALOG CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Search, Filter, Sort & GRID / LIST VIEW CONTROLS */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por producto, marca o descripción..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters & View Mode Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Vista Cuadrícula"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cuadrícula</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Vista Lista"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>

            {/* Only In Stock Toggle */}
            <button
              type="button"
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                onlyAvailable
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${onlyAvailable ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Solo Disponibles</span>
            </button>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="featured">Destacados</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="name">Alfabético: A - Z</option>
            </select>
          </div>
        </div>

        {/* Categories Chips */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 pl-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Categorías:</span>
            </span>
            {categories.map((cat, index) => {
              const isSelected = selectedCategory === cat;
              const count = cat === 'Todas' ? products.length : products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={`cat-${cat}-${index}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/30'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                      isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Product Cards: GRID OR LIST VIEW */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-500">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              No se encontraron productos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Prueba cambiando los términos de búsqueda o seleccionando otra categoría.
            </p>
            {(search || selectedCategory !== 'Todas' || onlyAvailable) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('Todas');
                  setOnlyAvailable(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ========================================================== */
          /* 4A. GRID VIEW (2 columnas en móvil, 3 en tablet, 4 en PC) */
          /* ========================================================== */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
            {filteredProducts.map((product, index) => {
              const inStock = product.stock > 0;
              const cartItem = cart.find((i) => i.productId === product.id);
              const qtyInCart = cartItem ? cartItem.quantity : 0;

              // Price calculations with official BCV rate and margin
              const discountInfo = getProductDiscountInfo(product);
              const baseUsd = product.sellingPriceUnit || 0;
              const effectiveUsd = discountInfo.effectivePrice;
              const unitBcvUsd = effectiveUsd * (1 + bcvPercent / 100);
              const unitBs = unitBcvUsd * bcvRate;

              return (
                <div
                  key={`grid-prod-${product.id}-${index}`}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Image Container with Badges */}
                  <div
                    className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800/60 overflow-hidden cursor-pointer"
                    onClick={() => setQuickViewProduct(product)}
                  >
                    {product.photoUrl ? (
                      <img
                        src={product.photoUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-2">
                        <Store className="w-10 h-10 sm:w-12 sm:h-12" />
                        <span className="text-[10px] font-medium">Sin imagen</span>
                      </div>
                    )}

                    {/* Status & Discount Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      {inStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-emerald-600/95 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{product.stock <= 3 ? `Últimas ${product.stock}` : `${product.stock} disponibles`}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                          Agotado
                        </span>
                      )}

                      {discountInfo.hasDiscount && (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black bg-rose-600 text-white shadow-xs backdrop-blur-xs flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          <span>-{discountInfo.percent}% OFF</span>
                        </span>
                      )}

                      {product.category && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
                          {product.category}
                        </span>
                      )}
                    </div>

                    {/* Quick view button overlay */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewProduct(product);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 cursor-pointer"
                      title="Ver detalles"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
                    <div>
                      {product.sku && (
                        <span className="text-[9.5px] font-mono text-slate-400 dark:text-slate-500 block">
                          SKU: {product.sku}
                        </span>
                      )}
                      <h3
                        onClick={() => setQuickViewProduct(product)}
                        className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors"
                        title={product.name}
                      >
                        {product.name}
                      </h3>
                    </div>

                    {/* PRECIOS COMPLETOS: DÓLARES ($), DÓLAR BCV (+%) Y CONVERSIÓN EN BOLÍVARES (Bs.) */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      <div className="bg-slate-50/90 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 space-y-2">
                        {/* 1. Precio en Dólares ($) */}
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Dólares ($)
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            {discountInfo.hasDiscount && (
                              <span className="text-[11px] font-bold line-through text-slate-400 font-mono">
                                ${baseUsd.toFixed(2)}
                              </span>
                            )}
                            <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white tracking-tight">
                              ${effectiveUsd.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* 2. Dólar BCV con Diferencial % y al lado 3. Conversión en Bolívares */}
                        <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70 bg-amber-500/10 dark:bg-amber-500/15 -mx-1.5 -mb-1.5 p-2 rounded-xl border border-amber-500/25">
                          <div className="flex items-center justify-between text-[9.5px] font-bold text-amber-900 dark:text-amber-300 mb-0.5">
                            <span className="flex items-center gap-1">
                              <span>Dólar BCV (+{bcvPercent}%)</span>
                            </span>
                            <span className="text-emerald-700 dark:text-emerald-400">
                              En Bolívares (Bs.)
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between gap-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs sm:text-sm font-black font-mono text-amber-900 dark:text-amber-200">
                                ${unitBcvUsd.toFixed(2)}
                              </span>
                              <span className="text-[8.5px] font-extrabold px-1 py-0.2 rounded bg-amber-200/90 dark:bg-amber-900/90 text-amber-950 dark:text-amber-200">
                                +{bcvPercent}%
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                              Bs. {unitBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button: Add to Cart / Quantity Controller */}
                      {inStock ? (
                        qtyInCart > 0 ? (
                          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(product.id, qtyInCart - 1, product.stock)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shadow-2xs hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
                              title="Disminuir"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black font-mono text-amber-900 dark:text-amber-200 px-1">
                              {qtyInCart}
                            </span>
                            <button
                              type="button"
                              disabled={qtyInCart >= product.stock}
                              onClick={() => handleUpdateQuantity(product.id, qtyInCart + 1, product.stock)}
                              className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shadow-2xs hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                              title="Aumentar"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product, 1)}
                            className="w-full py-2 px-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-amber-600 dark:bg-slate-800 dark:hover:bg-amber-600 text-white shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                            <span>Añadir</span>
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 px-2 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed text-center"
                        >
                          Agotado
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================== */
          /* 4B. LIST VIEW (Filas horizontales detalladas)               */
          /* ========================================================== */
          <div className="space-y-3">
            {filteredProducts.map((product, index) => {
              const inStock = product.stock > 0;
              const cartItem = cart.find((i) => i.productId === product.id);
              const qtyInCart = cartItem ? cartItem.quantity : 0;

              const discountInfo = getProductDiscountInfo(product);
              const baseUsd = product.sellingPriceUnit || 0;
              const effectiveUsd = discountInfo.effectivePrice;
              const unitBcvUsd = effectiveUsd * (1 + bcvPercent / 100);
              const unitBs = unitBcvUsd * bcvRate;

              return (
                <div
                  key={`list-prod-${product.id}-${index}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
                >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Thumbnail Image */}
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 cursor-pointer border border-slate-200 dark:border-slate-700 relative"
                      onClick={() => setQuickViewProduct(product)}
                    >
                      {product.photoUrl ? (
                        <img
                          src={product.photoUrl}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                          <Store className="w-8 h-8" />
                        </div>
                      )}

                      {discountInfo.hasDiscount && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded-md bg-rose-600 text-white text-[9px] font-black shadow-xs">
                          -{discountInfo.percent}%
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {inStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                            {product.stock <= 3 ? `Últimas ${product.stock} uds` : `${product.stock} disponibles`}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                            Agotado
                          </span>
                        )}
                        {discountInfo.hasDiscount && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span>-{discountInfo.percent}% OFF</span>
                          </span>
                        )}
                        {product.category && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {product.category}
                          </span>
                        )}
                        {product.sku && (
                          <span className="text-[10px] font-mono text-slate-400">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => setQuickViewProduct(product)}
                        className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 hover:text-amber-600 cursor-pointer"
                      >
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Action: DÓLARES, DÓLAR BCV (+%) Y BOLÍVARES AL LADO */}
                  <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right space-y-1">
                      {/* Dólares */}
                      <div className="flex items-baseline sm:justify-end gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Dólares:</span>
                        {discountInfo.hasDiscount && (
                          <span className="text-xs font-bold line-through text-slate-400 font-mono">
                            ${baseUsd.toFixed(2)}
                          </span>
                        )}
                        <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                          ${effectiveUsd.toFixed(2)} <span className="text-[10px] font-bold text-slate-400">USD</span>
                        </span>
                      </div>

                      {/* Dólar BCV con diferencial % y al lado su conversión en Bolívares */}
                      <div className="flex flex-wrap items-center sm:justify-end gap-2 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 px-2.5 py-1.5 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs font-black font-mono text-amber-900 dark:text-amber-200">
                          <span className="text-[9.5px] uppercase font-bold text-amber-700 dark:text-amber-400">Dólar BCV:</span>
                          <span>${unitBcvUsd.toFixed(2)}</span>
                          <span className="text-[8.5px] font-extrabold px-1.5 py-0.2 rounded bg-amber-200/90 dark:bg-amber-900/90 text-amber-950 dark:text-amber-200">
                            +{bcvPercent}%
                          </span>
                        </div>
                        <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
                        <div className="flex items-center gap-1 text-xs sm:text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                          <span className="text-[9.5px] uppercase font-bold text-emerald-700 dark:text-emerald-500">Bolívares:</span>
                          <span>Bs. {unitBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {inStock ? (
                        qtyInCart > 0 ? (
                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(product.id, qtyInCart - 1, product.stock)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold hover:bg-amber-100 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black font-mono px-2 text-amber-900 dark:text-amber-200">
                              {qtyInCart}
                            </span>
                            <button
                              type="button"
                              disabled={qtyInCart >= product.stock}
                              onClick={() => handleUpdateQuantity(product.id, qtyInCart + 1, product.stock)}
                              className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold hover:bg-amber-700 disabled:opacity-40 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product, 1)}
                            className="py-2 px-3.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-amber-600 dark:bg-slate-800 dark:hover:bg-amber-600 text-white shadow-xs active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Añadir</span>
                          </button>
                        )
                      ) : (
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                          Agotado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. FLOATING BOTTOM CART BAR (On mobile / bottom when cart has items) */}
      {totalItemsCount > 0 && !isCartOpen && (
        <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-40 bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900">
                {totalItemsCount}
              </span>
            </div>
            <div>
              <div className="font-mono font-black text-sm text-white">
                ${totalUsd.toFixed(2)} USD
              </div>
              <div className="text-[11px] font-black font-mono text-emerald-400">
                Bs. {totalBcvBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <span>Ver Pedido</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 6. SHOPPING CART DRAWER WITH IMMEDIATE PAYMENT DETAILS & REFERENCE INPUT */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900 dark:text-white">
                    Tu Carrito de Pedido
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'} seleccionados
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Vaciar carrito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartWithProducts.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                    Tu carrito está vacío
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    Explora el catálogo y añade los artículos que desees ordenar.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-2.5">
                    {cartWithProducts.map(({ product, quantity }, index) => {
                      const disc = getProductDiscountInfo(product);
                      const unitUsd = disc.effectivePrice;
                      const subUsd = unitUsd * quantity;
                      const subBcvUsd = subUsd * (1 + bcvPercent / 100);
                      const subBs = subBcvUsd * bcvRate;

                      return (
                        <div
                          key={`cart-item-${product.id}-${index}`}
                          className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3"
                        >
                          <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                            {product.photoUrl ? (
                              <img src={product.photoUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Store className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {product.name}
                              </h4>
                              {disc.hasDiscount && (
                                <span className="px-1.5 py-0.2 rounded-md bg-rose-500 text-white text-[9px] font-black shrink-0">
                                  -{disc.percent}%
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 mt-1">
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                                  ${subUsd.toFixed(2)} USD
                                </span>
                                {disc.hasDiscount && (
                                  <span className="text-[10px] font-mono text-slate-400 line-through">
                                    ${((product.sellingPriceUnit || 0) * quantity).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10.5px]">
                                <span className="font-mono font-bold text-amber-800 dark:text-amber-300">
                                  BCV (+{bcvPercent}%): ${subBcvUsd.toFixed(2)}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  Bs. {subBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Controller */}
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(product.id, quantity - 1, product.stock)}
                              className="w-6 h-6 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-xs cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-bold text-xs w-6 text-center text-slate-900 dark:text-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={quantity >= product.stock}
                              onClick={() => handleUpdateQuantity(product.id, quantity + 1, product.stock)}
                              className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs shadow-2xs hover:bg-amber-700 disabled:opacity-30 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Customer Information & Checkout Form */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Phone className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tus Datos para el Pedido por WhatsApp:</span>
                    </div>

                    {/* Customer Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Tu Nombre Completo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                        required
                      />
                    </div>

                    {/* Customer Phone */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Tu Teléfono WhatsApp (Opcional)
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ej: 0412-1234567"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                    </div>

                    {/* Preferred Payment Method Selector */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Método de Pago con el que vas a Cancelar
                      </label>
                      <select
                        value={preferredPayment}
                        onChange={(e) => setPreferredPayment(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer font-bold"
                      >
                        <option value="pago_movil">📱 Pago Móvil (Bolívares)</option>
                        <option value="transferencia">🏦 Transferencia Bancaria (Bolívares)</option>
                        <option value="usdt">🟡 Binance Pay (USDT / Binance ID)</option>
                        <option value="efectivo">💵 Efectivo Divisas / Dólares en persona</option>
                      </select>
                    </div>

                    {/* ==================================================================== */}
                    {/* INMEDIATE PAYMENT DETAILS CARD (Permite pagar de una vez y copiar)    */}
                    {/* ==================================================================== */}
                    <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Datos para Pagar de Inmediato:</span>
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                          {preferredPayment === 'pago_movil' ? 'Pago Móvil' : preferredPayment === 'transferencia' ? 'Transferencia' : preferredPayment === 'usdt' ? 'Binance Pay' : 'Efectivo'}
                        </span>
                      </div>

                      {/* DETALLE PAGO MÓVIL */}
                      {preferredPayment === 'pago_movil' && (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700">
                            <span className="text-[11px] text-slate-500">Banco:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{paymentDetails.pagoMovil?.bankName || 'Banesco (0134)'}</span>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700">
                            <span className="text-[11px] text-slate-500">Teléfono:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{paymentDetails.pagoMovil?.phone || '0414-1234567'}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyField(paymentDetails.pagoMovil?.phone || '', 'tel')}
                                className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600"
                                title="Copiar Teléfono"
                              >
                                {copiedField === 'tel' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700">
                            <span className="text-[11px] text-slate-500">Cédula / RIF:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{paymentDetails.pagoMovil?.idNumber || 'V-20123456'}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyField(paymentDetails.pagoMovil?.idNumber || '', 'ci')}
                                className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600"
                                title="Copiar Cédula"
                              >
                                {copiedField === 'ci' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Monto Exacto a Transferir:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                                Bs. {totalBcvBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyField(totalBcvBs.toFixed(2), 'montoBs')}
                                className="p-1 rounded bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                                title="Copiar Monto"
                              >
                                {copiedField === 'montoBs' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DETALLE TRANSFERENCIA BANCARIA */}
                      {preferredPayment === 'transferencia' && (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700">
                            <span className="text-[11px] text-slate-500">Banco:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{paymentDetails.bankTransfer?.bankName || 'Banesco Banco Universal'}</span>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700">
                            <span className="text-[11px] text-slate-500">N° Cuenta:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate max-w-[170px]">{paymentDetails.bankTransfer?.accountNumber || '0134-0000-00-0000000000'}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyField(paymentDetails.bankTransfer?.accountNumber || '', 'cta')}
                                className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600"
                                title="Copiar Cuenta"
                              >
                                {copiedField === 'cta' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700">
                            <span className="text-[11px] text-slate-500">Titular & CI:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{paymentDetails.bankTransfer?.accountHolder || 'Comercio'} • {paymentDetails.bankTransfer?.idNumber || ''}</span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Total en Bolívares:</span>
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                              Bs. {totalBcvBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* DETALLE BINANCE PAY */}
                      {preferredPayment === 'usdt' && (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-yellow-300 dark:border-slate-700">
                            <span className="text-[11px] text-slate-500">Binance ID / Pay ID:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-yellow-950 dark:text-yellow-300 text-sm">{paymentDetails.binancePay?.binanceId || '123456789'}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyField(paymentDetails.binancePay?.binanceId || '', 'binanceId')}
                                className="p-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200"
                                title="Copiar Binance ID"
                              >
                                {copiedField === 'binanceId' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </div>

                          {paymentDetails.binancePay?.alias && (
                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-yellow-300 dark:border-slate-700">
                              <span className="text-[11px] text-slate-500">Titular / Nickname:</span>
                              <span className="font-bold text-slate-900 dark:text-white">{paymentDetails.binancePay.alias}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-2 rounded-xl bg-yellow-400/20 border border-yellow-400/40">
                            <span className="text-xs font-bold text-yellow-950 dark:text-yellow-200">Total en USDT:</span>
                            <span className="font-mono font-black text-yellow-950 dark:text-yellow-300 text-sm">
                              {totalUsd.toFixed(2)} USDT
                            </span>
                          </div>
                        </div>
                      )}

                      {/* DETALLE EFECTIVO */}
                      {preferredPayment === 'efectivo' && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                          💵 Podrás pagar en divisas / dólares en efectivo al recibir tu pedido o al retirarlo en la tienda.
                        </p>
                      )}
                    </div>

                    {/* INPUT: NÚMERO DE REFERENCIA Y ADJUNTAR CAPTURA */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>N° de Referencia de Pago (Si ya transferiste)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                      </label>
                      <input
                        type="text"
                        value={paymentReferenceNumber}
                        onChange={(e) => setPaymentReferenceNumber(e.target.value)}
                        placeholder="Ej: 123456 (los últimos 4 o 6 dígitos de tu comprobante)"
                        className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                      />

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Al abrirse WhatsApp, <strong>adjunta la captura o screenshot del pago</strong> en el chat para que el comercio lo verifique de inmediato.</span>
                      </div>
                    </div>

                    {/* Delivery / Pickup Notes */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Dirección de Entrega o Notas Especiales (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Ej: Delivery a mi domicilio o retiro en persona..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer with Totals and WhatsApp Submit */}
            {cartWithProducts.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-3">
                {/* Totals Summary Card */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Total en Dólares ($):</span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      ${totalUsd.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <span>Total Dólar BCV (+{bcvPercent}%):</span>
                    </span>
                    <span className="font-mono font-black text-sm text-amber-900 dark:text-amber-200">
                      ${totalBcvUsd.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      Total a Pagar en Bolívares:
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                      Bs. {totalBcvBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {preferredPayment === 'usdt' && (
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-700/60 bg-yellow-400/10 p-2 rounded-xl">
                      <span className="font-bold text-yellow-800 dark:text-yellow-300">
                        Total en Binance Pay:
                      </span>
                      <span className="font-mono font-black text-sm text-yellow-700 dark:text-yellow-300">
                        {totalUsd.toFixed(2)} USDT
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit to WhatsApp Button */}
                <button
                  type="button"
                  onClick={handleSendOrderWhatsApp}
                  className="w-full py-3.5 px-4 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Pedido y Comprobante por WhatsApp</span>
                </button>

                <p className="text-[10px] text-center text-slate-400">
                  Se abrirá WhatsApp directamente con tu pedido al comercio ({paymentDetails.pagoMovil?.phone || '0414-1234567'})
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. MODAL: DATOS DE PAGO DEL COMERCIO (Acceso público directo) */}
      {isPaymentInfoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Cuentas y Métodos de Pago
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Datos bancarios oficiales de {settings.appName || 'Vincit Omnia'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentInfoModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Tasa Oficial Header Card */}
              <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 p-3 rounded-2xl border border-amber-300 dark:border-amber-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block">Tasa Oficial de Cambio</span>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    Bs. {bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USD
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Margen Diferencial</span>
                  <span className="font-bold text-xs text-amber-800 dark:text-amber-300 font-mono">+{bcvPercent}%</span>
                </div>
              </div>

              {/* PAGO MÓVIL */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Pago Móvil (Bolívares)</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Banco:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{paymentDetails.pagoMovil?.bankName || 'Banesco (0134)'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Teléfono:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{paymentDetails.pagoMovil?.phone || '0414-1234567'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyField(paymentDetails.pagoMovil?.phone || '', 'modalTel')}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'modalTel' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'modalTel' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Cédula / RIF:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{paymentDetails.pagoMovil?.idNumber || 'V-20123456'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyField(paymentDetails.pagoMovil?.idNumber || '', 'modalCi')}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'modalCi' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'modalCi' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* BINANCE PAY */}
              <div className="bg-yellow-400/10 dark:bg-yellow-500/5 p-4 rounded-2xl border border-yellow-400/30 dark:border-yellow-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-yellow-950 dark:text-yellow-200">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span>Binance Pay (Criptomonedas USDT)</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-yellow-300 dark:border-slate-700">
                    <span className="text-slate-500">Binance ID / Pay ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-yellow-950 dark:text-yellow-300 text-sm">{paymentDetails.binancePay?.binanceId || '123456789'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyField(paymentDetails.binancePay?.binanceId || '', 'modalBinance')}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-yellow-500 text-slate-950 hover:bg-yellow-400 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'modalBinance' ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'modalBinance' ? 'Copiado' : 'Copiar ID'}</span>
                      </button>
                    </div>
                  </div>

                  {paymentDetails.binancePay?.alias && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-yellow-300 dark:border-slate-700">
                      <span className="text-slate-500">Titular / Alias:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{paymentDetails.binancePay.alias}</span>
                    </div>
                  )}

                  {paymentDetails.binancePay?.email && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-yellow-300 dark:border-slate-700">
                      <span className="text-slate-500">Correo Binance:</span>
                      <span className="font-mono text-slate-900 dark:text-white">{paymentDetails.binancePay.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* TRANSFERENCIA BANCARIA */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span>Transferencia Bancaria Nacional</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Banco:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{paymentDetails.bankTransfer?.bankName || 'Banesco'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">N° Cuenta:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{paymentDetails.bankTransfer?.accountNumber || '0134-0000-00-0000000000'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyField(paymentDetails.bankTransfer?.accountNumber || '', 'modalCta')}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-800 dark:text-sky-300 hover:bg-sky-500/20 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'modalCta' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === 'modalCta' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Titular & CI:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{paymentDetails.bankTransfer?.accountHolder || 'Comercio'} ({paymentDetails.bankTransfer?.idNumber || ''})</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                <Camera className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>Una vez realizada tu transferencia, <strong>envía el número de referencia y adjunta la captura</strong> en el chat de WhatsApp para procesar y despachar tu pedido.</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPaymentInfoModalOpen(false)}
                className="px-5 py-2 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 text-white transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Image */}
            <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800">
              {quickViewProduct.photoUrl ? (
                <img src={quickViewProduct.photoUrl} alt={quickViewProduct.name} className="w-full h-full object-contain p-2" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Store className="w-12 h-12" />
                  <span className="text-xs">Sin foto</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Details */}
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {quickViewProduct.category && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                      {quickViewProduct.category}
                    </span>
                  )}
                  {quickViewProduct.stock > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      {quickViewProduct.stock} unidades en stock
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                      Agotado
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {quickViewProduct.name}
                </h3>
                {quickViewProduct.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {quickViewProduct.description}
                  </p>
                )}
              </div>

              {/* Complete Price Breakdown: Dólares, Dólar BCV (+%) y Bolívares */}
              {(() => {
                const qvDisc = getProductDiscountInfo(quickViewProduct);
                const qvBase = quickViewProduct.sellingPriceUnit || 0;
                const qvEffective = qvDisc.effectivePrice;
                const qvBcvUsd = qvEffective * (1 + bcvPercent / 100);
                const qvBs = qvBcvUsd * bcvRate;

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Precio en Dólares ($)
                        </span>
                        <div className="flex items-baseline gap-2">
                          {qvDisc.hasDiscount && (
                            <span className="font-mono text-sm font-bold line-through text-slate-400">
                              ${qvBase.toFixed(2)}
                            </span>
                          )}
                          <span className="font-mono font-black text-xl text-slate-900 dark:text-white">
                            ${qvEffective.toFixed(2)} USD
                          </span>
                          {qvDisc.hasDiscount && (
                            <span className="text-xs font-black px-2 py-0.5 rounded-md bg-rose-500 text-white">
                              -{qvDisc.percent}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 bg-amber-500/10 dark:bg-amber-500/15 -mx-1.5 -mb-1.5 p-2.5 rounded-xl border border-amber-500/25">
                      <div>
                        <span className="text-[10px] text-amber-900 dark:text-amber-300 font-bold block">
                          Dólar BCV (+{bcvPercent}%)
                        </span>
                        <span className="font-mono font-black text-base text-amber-900 dark:text-amber-200">
                          ${qvBcvUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                          Conversión en Bolívares
                        </span>
                        <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                          Bs. {qvBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Action */}
              <div className="flex items-center gap-3 pt-2">
                {quickViewProduct.stock > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(quickViewProduct, 1);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Añadir al Carrito de Pedido</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed"
                  >
                    Agotado Temporalmente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. ORDER SENT CONFIRMATION MODAL */}
      {orderSentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                ¡Pedido Enviado a WhatsApp!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tu mensaje con el desglose del pedido y los datos de pago ha sido preparado. Recuerda adjuntar la captura del comprobante si ya transferiste.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs font-mono text-slate-600 dark:text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
              {lastOrderMessage}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(lastOrderMessage);
                  alert('Mensaje copiado al portapapeles');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
              >
                Copiar Texto
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderSentModal(false);
                  setIsCartOpen(false);
                  setCart([]);
                  setPaymentReferenceNumber('');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
              >
                Aceptar y Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. FOOTER (Strictly NO admin panel links) */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-400 space-y-1.5">
        <p className="font-serif font-bold text-slate-600 dark:text-slate-300">
          {settings.appName || 'Vincit Omnia'} • Catálogo Digital para Clientes
        </p>
        <p className="text-[11px] text-slate-400">
          Catálogo sincronizado en tiempo real. Precios expresados en Dólares americanos con valor referencial en Bolívares oficiales del Banco Central de Venezuela.
        </p>
      </footer>
    </div>
  );
};
