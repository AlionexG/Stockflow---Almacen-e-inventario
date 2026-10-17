import React, { useState, useMemo } from 'react';
import {
  Tag,
  Percent,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Search,
  AlertCircle,
  TrendingDown,
  ShoppingBag,
} from 'lucide-react';
import { Product } from '../types';
import { getProductDiscountInfo, storageService } from '../services/storageService';

interface DiscountManagerModalProps {
  isOpen: boolean;
  products: Product[];
  currency: string;
  bcvPercent: number;
  bcvRate: number;
  onClose: () => void;
  onApplyDiscounts: (updatedProducts: Product[]) => void;
}

export const DiscountManagerModal: React.FC<DiscountManagerModalProps> = ({
  isOpen,
  products,
  currency,
  bcvPercent,
  bcvRate,
  onClose,
  onApplyDiscounts,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'individual'>('general');
  const [scope, setScope] = useState<'all' | string>('all');
  const [globalPercent, setGlobalPercent] = useState<number>(10);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Todas');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const raw = products
      .map((p) => p.category?.trim())
      .filter((c): c is string => Boolean(c) && c.toLowerCase() !== 'todas');
    return ['Todas', ...Array.from(new Set(raw))];
  }, [products]);

  // Statistics
  const discountedCount = useMemo(() => {
    return products.filter((p) => p.isDiscountActive && (p.discountPercent || 0) > 0).length;
  }, [products]);

  // Products affected by global scope
  const targetProductsForGlobal = useMemo(() => {
    if (scope === 'all') return products;
    return products.filter((p) => p.category === scope);
  }, [products, scope]);

  // Filtered products for individual tab
  const filteredIndividualProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = filterCategory === 'Todas' || p.category === filterCategory;
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, filterCategory, search]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle Apply Global Discount
  const handleApplyGlobal = () => {
    if (globalPercent <= 0 || globalPercent >= 100) {
      alert('Por favor introduce un porcentaje de descuento válido entre 1% y 99%.');
      return;
    }
    const catTarget = scope === 'all' ? undefined : scope;
    const updated = storageService.applyGlobalDiscount(globalPercent, catTarget);
    onApplyDiscounts(updated);
    showNotification(
      `¡Descuento del ${globalPercent}% aplicado exitosamente a ${
        scope === 'all' ? 'todos los productos' : `la categoría "${scope}"`
      }!`
    );
  };

  // Handle Clear Discounts
  const handleClearDiscounts = (categoryScope?: string) => {
    const catTarget = categoryScope === 'all' || !categoryScope ? undefined : categoryScope;
    const updated = storageService.clearDiscounts(catTarget);
    onApplyDiscounts(updated);
    showNotification('Se han retirado los descuentos y restaurado los precios regulares.');
  };

  // Handle Individual Product Discount Change
  const handleUpdateIndividual = (productId: string, percent: number, isActive: boolean) => {
    storageService.setProductDiscount(productId, percent, isActive);
    const updated = storageService.getProducts();
    onApplyDiscounts(updated);
  };

  const PRESET_PERCENTS = [5, 10, 15, 20, 25, 30, 40, 50];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/25 shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Gestión de Descuentos para la Venta
                </h3>
                {discountedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-2xs">
                    {discountedCount} con oferta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aplica promociones masivas a todo el inventario, por categoría o producto individual
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-2 shadow-inner animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-4 sm:px-5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Descuento General Masivo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'individual'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Descuentos Individuales por Producto</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'general' ? (
            /* ========================================================== */
            /* TAB 1: DESCUENTO GENERAL MASIVO                           */
            /* ========================================================== */
            <div className="space-y-4">
              {/* Scope Selection */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  1. Selecciona a qué productos aplicar el descuento:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    onClick={() => setScope('all')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      scope === 'all'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-200 font-bold shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-rose-500" />
                      <div>
                        <div className="text-xs">Todo el Inventario</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Aplica a los {products.length} productos
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="discountScope"
                      checked={scope === 'all'}
                      onChange={() => setScope('all')}
                      className="accent-rose-500"
                    />
                  </label>

                  <div
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-1 transition-all ${
                      scope !== 'all'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        <span>Por Categoría Específica</span>
                      </span>
                    </div>
                    <select
                      value={scope === 'all' ? '' : scope}
                      onChange={(e) => setScope(e.target.value || 'all')}
                      className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">-- Elige una categoría --</option>
                      {categories
                        .filter((c) => c !== 'Todas')
                        .map((c) => (
                          <option key={c} value={c}>
                            {c} ({products.filter((p) => p.category === c).length} productos)
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Percentage Input & Presets */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  2. Porcentaje de Descuento Promocional:
                </label>

                {/* Presets Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Rápidos:</span>
                  {PRESET_PERCENTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setGlobalPercent(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        globalPercent === p
                          ? 'bg-rose-500 text-white shadow-xs scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-400'
                      }`}
                    >
                      -{p}%
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="relative w-36">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={globalPercent}
                      onChange={(e) => setGlobalPercent(parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-8 py-2 text-base font-black border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-right"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Se aplicará una rebaja de <strong>{globalPercent}%</strong> sobre el precio de venta en USD.
                  </span>
                </div>
              </div>

              {/* Impact Preview */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <TrendingDown className="w-4 h-4" />
                    <span>Vista previa del cálculo con -{globalPercent}%:</span>
                  </span>
                  <span className="text-slate-500 font-normal">
                    {targetProductsForGlobal.length} productos afectados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">EJEMPLO BASE $10.00</span>
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white line-through text-slate-400">
                      $10.00 USD
                    </span>
                    <span className="font-mono text-sm font-black text-rose-600 dark:text-rose-400 ml-2">
                      ${(10 * (1 - globalPercent / 100)).toFixed(2)} USD
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-amber-500 block font-bold">DÓLAR BCV (+{bcvPercent}%)</span>
                    <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                      ${((10 * (1 - globalPercent / 100)) * (1 + bcvPercent / 100)).toFixed(2)} BCV
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-emerald-600 block font-bold">EN BOLÍVARES (TASA BCV)</span>
                    <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                      Bs. {(((10 * (1 - globalPercent / 100)) * (1 + bcvPercent / 100)) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleClearDiscounts(scope)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Quitar Descuentos {scope !== 'all' ? `de "${scope}"` : 'de Todo'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyGlobal}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar Descuento Masivo (-{globalPercent}%)</span>
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* TAB 2: DESCUENTOS INDIVIDUALES POR PRODUCTO               */
            /* ========================================================== */
            <div className="space-y-3">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar producto por nombre o SKU..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {categories.map((c, idx) => (
                    <option key={`disc-cat-${c}-${idx}`} value={c}>
                      {c === 'Todas' ? 'Todas las Categorías' : c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product List */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {filteredIndividualProducts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No se encontraron productos que coincidan con la búsqueda.
                  </div>
                ) : (
                  filteredIndividualProducts.map((p, idx) => {
                    const info = getProductDiscountInfo(p);
                    const baseUsd = p.sellingPriceUnit || 0;
                    const bcvUsd = info.effectivePrice * (1 + bcvPercent / 100);
                    const bcvBs = bcvUsd * bcvRate;

                    return (
                      <div
                        key={`disc-prod-${p.id}-${idx}`}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          info.hasDiscount
                            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {/* Product Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                                Sin foto
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {p.name}
                              </span>
                              {info.hasDiscount && (
                                <span className="px-1.5 py-0.2 rounded-md bg-rose-500 text-white text-[9.5px] font-black shrink-0">
                                  -{info.percent}% OFF
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>SKU: {p.sku}</span>
                              <span>•</span>
                              <span>Stock: {p.stock}</span>
                              <span>•</span>
                              <span>P. Base: {currency} {baseUsd.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Discount Controller */}
                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                          {/* Toggle Switch */}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={info.hasDiscount}
                              onChange={(e) => {
                                const nextActive = e.target.checked;
                                const nextPercent = nextActive ? (info.percent > 0 ? info.percent : 10) : 0;
                                handleUpdateIndividual(p.id, nextPercent, nextActive);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-rose-600"></div>
                          </label>

                          {/* Percent input */}
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={p.discountPercent ?? 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                handleUpdateIndividual(p.id, val, val > 0);
                              }}
                              className="w-14 px-2 py-1 text-xs font-black text-right border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                            />
                            <span className="text-xs font-bold text-slate-400">%</span>
                          </div>

                          {/* Final Effective Price Preview */}
                          <div className="text-right min-w-[70px]">
                            <div className="text-xs font-black font-mono text-slate-900 dark:text-white">
                              ${info.effectivePrice.toFixed(2)}
                            </div>
                            <div className="text-[9.5px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              Bs. {bcvBs.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Los descuentos se reflejan de inmediato en Inventario, Ventas y el Catálogo de Clientes.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer shrink-0"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
