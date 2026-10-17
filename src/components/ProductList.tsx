import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Minus,
  Edit2,
  Trash2,
  AlertTriangle,
  LayoutGrid,
  List,
  MapPin,
  TrendingUp,
  Package,
  Truck,
  Layers,
  PackagePlus,
  Check,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Tag,
  Percent,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { Product, ShippingBatch, AppSettings } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { InventoryIllustration } from './empty-states/EmptyStateIllustration';
import { EmptyStateCard } from './empty-states/EmptyStateCard';
import { storageService, DEFAULT_PAYMENT_DETAILS, getProductDiscountInfo } from '../services/storageService';
import { DiscountManagerModal } from './DiscountManagerModal';

interface ProductListProps {
  products: Product[];
  shippingBatches: ShippingBatch[];
  currency: string;
  settings?: AppSettings;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onAddStock?: (productId: string, quantityToAdd: number, note?: string) => void;
  onOpenNewProduct: () => void;
  onUpdateProducts?: (updatedProducts: Product[]) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  shippingBatches,
  currency,
  settings,
  onEditProduct,
  onDeleteProduct,
  onUpdateStock,
  onAddStock,
  onOpenNewProduct,
  onUpdateProducts,
}) => {
  const paymentDetails = {
    ...DEFAULT_PAYMENT_DETAILS,
    ...(settings?.paymentDetails || storageService.getAppSettings().paymentDetails || {}),
  };
  const isBcvActive = Boolean(paymentDetails.enabledBcvPricing);
  const bcvPercent = typeof paymentDetails.bcvDifferentialPercent === 'number' ? paymentDetails.bcvDifferentialPercent : 15;
  const bcvRate = typeof paymentDetails.bcvRate === 'number' ? paymentDetails.bcvRate : 880;
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [productForAddStock, setProductForAddStock] = useState<Product | null>(null);
  const [addStockQty, setAddStockQty] = useState<number>(1);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [quickDiscountProduct, setQuickDiscountProduct] = useState<Product | null>(null);
  const [quickDiscountPercent, setQuickDiscountPercent] = useState<number>(10);
  const [quickDiscountActive, setQuickDiscountActive] = useState<boolean>(true);
  const [addStockNote, setAddStockNote] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'grid';
    }
    return 'table';
  });
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Fullscreen Image Preview
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  useEffect(() => {
    if (!previewProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewProduct(null);
        setZoomLevel(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewProduct]);

  // Categories
  const categories = useMemo(() => {
    const configured = storageService.getCategories();
    const fromProducts = products.map((p) => p.category?.trim()).filter(Boolean);
    const combined = [...configured, ...fromProducts].filter(
      (c): c is string => Boolean(c) && c.toLowerCase() !== 'todas'
    );
    return ['Todas', ...Array.from(new Set(combined))];
  }, [products]);

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.location && p.location.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    const matchesStock = !onlyLowStock || p.stock <= p.minStock;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Low stock calculation
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  // Discounted products calculation
  const discountedCount = useMemo(() => {
    return products.filter((p) => p.isDiscountActive && (p.discountPercent || 0) > 0).length;
  }, [products]);

  const handleSaveQuickDiscount = () => {
    if (!quickDiscountProduct) return;
    const updatedProd = storageService.setProductDiscount(
      quickDiscountProduct.id,
      quickDiscountPercent,
      quickDiscountActive
    );
    if (updatedProd && onUpdateProducts) {
      onUpdateProducts(storageService.getProducts());
    }
    setQuickDiscountProduct(null);
  };

  const handleRemoveQuickDiscount = () => {
    if (!quickDiscountProduct) return;
    const updatedProd = storageService.setProductDiscount(
      quickDiscountProduct.id,
      0,
      false
    );
    if (updatedProd && onUpdateProducts) {
      onUpdateProducts(storageService.getProducts());
    }
    setQuickDiscountProduct(null);
  };

  return (
    <div className="space-y-5">
      {/* ALERTA DESTACADA DE BAJO STOCK */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-sm text-slate-800 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-sm">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-black text-slate-900 tracking-tight">
                    ⚠️ ALERTA DE STOCK BAJO ({lowStockProducts.length} {lowStockProducts.length === 1 ? 'PRODUCTO' : 'PRODUCTOS'})
                  </h4>
                  {outOfStockProducts.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                      {outOfStockProducts.length} agotado{outOfStockProducts.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Los siguientes artículos han alcanzado o están por debajo de su inventario mínimo ({products.length > 0 ? 'mín. configurado por producto' : ''}):
                </p>

                {/* Quick interactive pills of affected products */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {lowStockProducts.map((p) => {
                    const isOut = p.stock === 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSearch(p.name);
                          setOnlyLowStock(true);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-transform hover:scale-105 active:scale-95 ${
                          isOut
                            ? 'bg-rose-100 text-rose-800 border-rose-300 shadow-2xs'
                            : 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                        }`}
                        title={`Filtrar ${p.name}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isOut ? 'bg-rose-600' : 'bg-amber-500'}`} />
                        <span className="truncate max-w-[150px]">{p.name}</span>
                        <span className="font-mono text-[11px] px-1 py-0.2 rounded bg-white/80 font-black">
                          {p.stock}/{p.minStock} uds.
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  onlyLowStock
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {onlyLowStock ? 'Ver Todo el Catálogo' : 'Filtrar Solo Bajo Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar (visible when products exist) */}
      {products.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por descripción, código o lote..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
            />
          </div>

          {/* Categories, Low Stock filter & View switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {categories.map((c, idx) => (
                <option key={`${c}-${idx}`} value={c}>
                  {c === 'Todas' ? 'Todas las Categorías' : c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                onlyLowStock
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Bajo Stock</span>
              {lowStockProducts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white">
                  {lowStockProducts.length}
                </span>
              )}
            </button>

            {/* Discounts Manager Button */}
            <button
              type="button"
              onClick={() => setIsDiscountModalOpen(true)}
              className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                discountedCount > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600'
              }`}
              title="Gestionar Descuentos Generales o Individuales"
            >
              <Tag className="w-3.5 h-3.5 text-rose-500" />
              <span>Descuentos</span>
              {discountedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white">
                  {discountedCount}
                </span>
              )}
            </button>

            {/* View Mode Switcher (visible on Mobile & PC) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Vista en Cuadrícula (Móvil & PC)"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cuadrícula</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Vista en Lista / Tabla (Móvil & PC)"
              >
                <List className="w-3.5 h-3.5 text-emerald-500" />
                <span>Lista</span>
              </button>
            </div>

            <button
              onClick={onOpenNewProduct}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Producto</span>
            </button>
          </div>
        </div>
      )}


      {/* Content */}
      {products.length === 0 ? (
        <EmptyStateCard
          illustration={<InventoryIllustration size={210} />}
          title="Tu inventario está listo para comenzar"
          description="Registra tus piezas y joyas con fotos, costo de compra por pieza, flete y empaque. El sistema calculará tu cotización unitaria, margen neto y precio de venta recomendado al instante."
          actionText="Registrar mi Primer Producto"
          actionIcon={Plus}
          onAction={onOpenNewProduct}
          benefits={[
            {
              icon: TrendingUp,
              title: 'Cálculo de Margen en Vivo',
              description: 'Visualiza la ganancia neta proyectada y el porcentaje de retorno neto por pieza antes de fijar precio.',
            },
            {
              icon: Truck,
              title: 'Flete y Empaque Asignado',
              description: 'Distribuye el flete de importación y bolsas de terciopelo o cartón a cada artículo con precisión.',
            },
            {
              icon: AlertTriangle,
              title: 'Control de Stock y Alertas',
              description: 'Define niveles mínimos para recibir alertas automáticas cuando un producto esté por agotarse.',
            },
          ]}
        />
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            No se encontraron productos coincidentes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {search
              ? `No hay artículos que coincidan con "${search}".`
              : 'No hay artículos que coincidan con los filtros aplicados.'} Intenta con otro término o limpia los filtros.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('Todas');
                setOnlyLowStock(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={onOpenNewProduct}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Registrar Nuevo Producto
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Exact mapping of the user's spreadsheet columns) */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 dark:bg-slate-950 text-white uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-3 text-center">N°</th>
                  <th className="py-3 px-3">DESCRIPCIÓN / IMAGEN</th>
                  <th className="py-3 px-2 text-center">ITEMS</th>
                  <th className="py-3 px-2 text-center">CANT. PACK</th>
                  <th className="py-3 px-3">PRECIO PROD.</th>
                  <th className="py-3 px-3">PRECIO C/U</th>
                  <th className="py-3 px-3">EMPAQUE</th>
                  <th className="py-3 px-3">LOTE ENVÍO</th>
                  <th className="py-3 px-3">IMPUESTO TAX</th>
                  <th className="py-3 px-3">COTIZACIÓN TOTAL</th>
                  <th className="py-3 px-3">
                    P. VENTA {isBcvActive && <span className="text-amber-400">/ BCV</span>}
                  </th>
                  <th className="py-3 px-3">MONTO BRUTO</th>
                  <th className="py-3 px-3">GANANCIA</th>
                  <th className="py-3 px-3 text-center">% GANANCIA</th>
                  <th className="py-3 px-3 text-center">STOCK</th>
                  <th className="py-3 px-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredProducts.map((p, index) => {
                  const assignedBatch = shippingBatches.find((b) => b.id === p.shippingBatchId);
                  const isLow = p.stock <= p.minStock;
                  const disc = getProductDiscountInfo(p);
                  const basePrice = p.sellingPriceUnit || 0;
                  const effectivePrice = disc.effectivePrice;
                  const bcvPrice = effectivePrice * (1 + bcvPercent / 100);
                  const bsPrice = bcvPrice * bcvRate;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-400 dark:text-slate-500 text-center">
                        {p.itemNumber || index + 1}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5 max-w-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewProduct(p);
                              setZoomLevel(1);
                            }}
                            className="relative group/thumb shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                            title="Clic para ver foto en pantalla completa"
                          >
                            <img
                              src={p.photoUrl}
                              alt={p.name}
                              className="w-10 h-10 object-cover group-hover/thumb:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Maximize2 className="w-3.5 h-3.5 drop-shadow-sm" />
                            </div>
                          </button>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate" title={p.name}>
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                              {p.sku} • {p.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center font-bold text-slate-800 dark:text-slate-100">
                        {p.itemsCount || 1}
                      </td>

                      <td className="py-3 px-2 text-center font-semibold text-slate-600 dark:text-slate-300">
                        {p.piecesPerProduct || 1} uds.
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {currency} {p.productPrice?.toFixed(2) ?? '0.00'}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                        {currency} {p.unitPriceCost?.toFixed(2) ?? '0.00'}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                        <div>
                          {currency}
                          {(
                            p.packagingCost !== undefined
                              ? p.packagingCost
                              : (p.packagingCarton || 0) + (p.packagingBolsita || 0) + (p.packagingLogo || 0)
                          ).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">Empaque/Gastos</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400">
                          {currency} {p.shippingCostUnit?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          <span>{assignedBatch ? `Lote ${assignedBatch.batchNumber}` : 'Manual'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-sky-700 dark:text-sky-400 font-semibold">
                        {currency} {p.retentionCostUnit?.toFixed(2) || '0.00'}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {currency} {p.totalQuotation?.toFixed(2) || '0.00'}
                        <div className="text-[10px] text-slate-400 font-normal">
                          C/U: {currency}{p.unitQuotation?.toFixed(2) || '0.00'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {disc.hasDiscount && (
                              <span className="text-[11px] line-through text-slate-400 font-mono">
                                {currency} {basePrice.toFixed(2)}
                              </span>
                            )}
                            <span className="font-black text-slate-900 dark:text-white">
                              {currency} {effectivePrice.toFixed(2)}
                            </span>
                            {disc.hasDiscount && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-rose-500 text-white">
                                -{disc.percent}%
                              </span>
                            )}
                          </div>

                          {isBcvActive && (
                            <div className="mt-1 inline-flex flex-col text-[10px] bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg whitespace-nowrap">
                              <span className="font-bold text-amber-800 dark:text-amber-300">
                                BCV: {currency}{bcvPrice.toFixed(2)}
                              </span>
                              {bcvRate > 0 && (
                                <span className="text-amber-700 dark:text-amber-400 font-mono text-[9px]">
                                  Bs. {bsPrice.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-sky-600 dark:text-sky-400">
                        {currency} {p.grossAmount?.toFixed(2) || '0.00'}
                      </td>

                      <td className="py-3 px-3 font-black">
                        <span className={p.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {p.netProfit >= 0 ? '+' : ''}{currency} {p.netProfit?.toFixed(2) || '0.00'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            p.profitMarginPercent >= 30
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : p.profitMarginPercent > 0
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {p.profitMarginPercent?.toFixed(1) || '0'}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onUpdateStock(p.id, p.stock - 1)}
                              disabled={p.stock <= 0}
                              className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="Restar 1 unidad"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded text-xs min-w-6 text-center ${
                                isLow ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-black' : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {p.stock}
                            </span>
                            <button
                              onClick={() => onUpdateStock(p.id, p.stock + 1)}
                              className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
                              title="Sumar 1 unidad"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setProductForAddStock(p);
                              setAddStockQty(1);
                              setAddStockNote('');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                            title="Aumentar stock de unidades de este producto"
                          >
                            <Plus className="w-2.5 h-2.5 stroke-[3]" />
                            <span>+ Stock</span>
                          </button>

                          {isLow && (
                            <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                              ⚠️ Mín: {p.minStock}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setQuickDiscountProduct(p);
                              setQuickDiscountPercent(p.discountPercent || 10);
                              setQuickDiscountActive(Boolean(p.isDiscountActive && (p.discountPercent || 0) > 0));
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              disc.hasDiscount
                                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                                : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            }`}
                            title={disc.hasDiscount ? `Editar Descuento (-${disc.percent}% OFF)` : 'Agregar Descuento'}
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setProductForAddStock(p);
                              setAddStockQty(1);
                              setAddStockNote('');
                            }}
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Aumentar unidades de stock"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW (Visual for Mobile Phones, Tablets & Widescreen PC) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
          {filteredProducts.map((p) => {
            const assignedBatch = shippingBatches.find((b) => b.id === p.shippingBatchId);
            const isLow = p.stock <= p.minStock;
            const disc = getProductDiscountInfo(p);
            const basePrice = p.sellingPriceUnit || 0;
            const effectivePrice = disc.effectivePrice;
            const bcvPrice = effectivePrice * (1 + bcvPercent / 100);
            const bsPrice = bcvPrice * bcvRate;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div
                    onClick={() => {
                      setPreviewProduct(p);
                      setZoomLevel(1);
                    }}
                    className="relative aspect-4/3 bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-zoom-in group/img"
                    title="Clic para ver foto en pantalla completa"
                  >
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 text-white text-xs font-bold backdrop-blur-xs shadow-lg transform translate-y-1 group-hover/img:translate-y-0 transition-transform">
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pantalla Completa</span>
                      </span>
                    </div>
                    {(() => {
                      const disc = getProductDiscountInfo(p);
                      return (
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
                            N° {p.itemNumber}
                          </span>
                          {disc.hasDiscount && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-600 text-white shadow-xs flex items-center gap-0.5">
                              <Tag className="w-2.5 h-2.5" />
                              <span>-{disc.percent}%</span>
                            </span>
                          )}
                          {isLow && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white shadow-xs ${
                                p.stock === 0 ? 'bg-rose-700 animate-pulse' : 'bg-amber-600'
                              }`}
                            >
                              {p.stock === 0 ? '🔴 Agotado' : `⚠️ Bajo (${p.stock}/${p.minStock})`}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    {assignedBatch && (
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-emerald-900/80 px-2 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
                        <Truck className="w-3 h-3" /> Lote {assignedBatch.batchNumber}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-tight mb-2">
                      {p.name}
                    </h4>

                    {/* Financial Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/80 space-y-1 text-xs mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Pack / Piezas:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{p.itemsCount} pack • {p.piecesPerProduct} uds</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Cotización Total:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{currency} {p.totalQuotation?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">P. Venta / Pieza:</span>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            {disc.hasDiscount && (
                              <span className="text-[10px] line-through text-slate-400 font-mono">
                                {currency}{basePrice.toFixed(2)}
                              </span>
                            )}
                            <span className="font-black text-slate-900 dark:text-white">
                              {currency}{effectivePrice.toFixed(2)}
                            </span>
                            {disc.hasDiscount && (
                              <span className="text-[8.5px] font-black px-1 rounded bg-rose-500 text-white">
                                -{disc.percent}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isBcvActive && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/60 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg">
                          <span className="text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-amber-600" /> P. BCV (+{bcvPercent}%):
                          </span>
                          <div className="text-right">
                            <span className="font-black text-amber-900 dark:text-amber-200 text-xs font-mono">
                              {currency}{bcvPrice.toFixed(2)}
                            </span>
                            {bcvRate > 0 && (
                              <span className="block text-[9px] text-amber-700 dark:text-amber-400 font-mono">
                                Bs. {bsPrice.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className={`text-xs font-black ${p.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                          {p.netProfit >= 0 ? '+' : ''}{currency} {p.netProfit?.toFixed(2)}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.profitMarginPercent >= 30
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {p.profitMarginPercent?.toFixed(1)}% ROI
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-0.5">
                      <button
                        onClick={() => onUpdateStock(p.id, p.stock - 1)}
                        disabled={p.stock <= 0}
                        className="w-5 h-5 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                        title="Restar 1 unidad"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black px-1.5 text-slate-800 dark:text-slate-100 min-w-5 text-center">
                        {p.stock}
                      </span>
                      <button
                        onClick={() => onUpdateStock(p.id, p.stock + 1)}
                        className="w-5 h-5 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center cursor-pointer"
                        title="Sumar 1 unidad"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProductForAddStock(p);
                        setAddStockQty(1);
                        setAddStockNote('');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Aumentar unidades de stock"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>+ Stock</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Botón de Descuento al lado del lápiz de edición */}
                    <button
                      type="button"
                      onClick={() => {
                        setQuickDiscountProduct(p);
                        setQuickDiscountPercent(p.discountPercent || 10);
                        setQuickDiscountActive(Boolean(p.isDiscountActive && (p.discountPercent || 0) > 0));
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        disc.hasDiscount
                          ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                          : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                      title={disc.hasDiscount ? `Editar Descuento (-${disc.percent}% OFF)` : 'Agregar Descuento'}
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onEditProduct(p)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProductToDelete(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PARA AGREGAR STOCK RÁPIDO */}
      {productForAddStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-md my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Aumentar Stock de Producto
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Suma unidades al almacén y regístralo en el historial
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProductForAddStock(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const qty = Number(addStockQty);
                if (qty <= 0 || isNaN(qty)) return;
                if (onAddStock) {
                  onAddStock(productForAddStock.id, qty, addStockNote.trim() || undefined);
                } else {
                  onUpdateStock(productForAddStock.id, productForAddStock.stock + qty);
                }
                setProductForAddStock(null);
              }}
              className="p-6 space-y-4"
            >
              {/* Product preview card */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <img
                  src={productForAddStock.photoUrl}
                  alt={productForAddStock.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {productForAddStock.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    SKU: {productForAddStock.sku || 'N/A'} • {productForAddStock.category}
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                    Stock actual:{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-black">
                      {productForAddStock.stock} unidades
                    </span>
                  </div>
                </div>
              </div>

              {/* Units to add */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cantidad de unidades a sumar <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddStockQty((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-base cursor-pointer shrink-0"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    required
                    value={addStockQty}
                    onChange={(e) => setAddStockQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center py-2 text-base font-black rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAddStockQty((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-base cursor-pointer shrink-0"
                  >
                    +
                  </button>
                </div>

                {/* Quick addition chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">Accesos rápidos:</span>
                  {[5, 10, 20, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddStockQty((prev) => prev + preset)}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      +{preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddStockQty(1)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-600 underline cursor-pointer ml-auto"
                  >
                    Reiniciar a 1
                  </button>
                </div>
              </div>

              {/* Result Summary */}
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <span>Stock resultante:</span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                  {productForAddStock.stock + addStockQty} unidades (+{addStockQty})
                </span>
              </div>

              {/* Motivo o nota */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nota o Motivo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Reposición de mercancía, compra a proveedor..."
                  value={addStockNote}
                  onChange={(e) => setAddStockNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setProductForAddStock(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar y Aumentar Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!productToDelete}
        title="¿Eliminar producto del inventario?"
        message={`¿Estás seguro de que deseas eliminar permanentemente "${productToDelete?.name}"?`}
        confirmText="Eliminar Producto"
        cancelText="Conservar"
        isDestructive={true}
        onConfirm={() => {
          if (productToDelete) {
            onDeleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        onCancel={() => setProductToDelete(null)}
      />

      {/* MODAL PREVISUALIZADOR DE IMAGEN A PANTALLA COMPLETA */}
      {previewProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200 select-none"
          onClick={() => {
            setPreviewProduct(null);
            setZoomLevel(1);
          }}
        >
          {/* Barra Superior */}
          <div
            className="w-full px-4 sm:px-6 py-3 bg-black/60 backdrop-blur-sm border-b border-white/10 flex items-center justify-between text-white z-20 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white/10 border border-white/20 text-emerald-400 shrink-0">
                N° {previewProduct.itemNumber}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold truncate text-white">
                  {previewProduct.name}
                </h3>
                <p className="text-[11px] text-slate-300 truncate font-mono">
                  SKU: {previewProduct.sku || 'N/A'} • {previewProduct.category}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.6 : 1))}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title={zoomLevel === 1 ? 'Acercar zoom' : 'Ajustar a pantalla'}
              >
                {zoomLevel === 1 ? <ZoomIn className="w-4 h-4 text-emerald-400" /> : <ZoomOut className="w-4 h-4 text-amber-400" />}
                <span className="hidden sm:inline">{zoomLevel === 1 ? 'Zoom +' : 'Ajustar'}</span>
              </button>

              <a
                href={previewProduct.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Abrir imagen original"
              >
                <ExternalLink className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Original</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setPreviewProduct(null);
                  setZoomLevel(1);
                }}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 border border-rose-500/30 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Cerrar pantalla completa (Esc)"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar (Esc)</span>
              </button>
            </div>
          </div>

          {/* Área Central de Visualización de Imagen */}
          <div
            className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden relative cursor-zoom-out"
            onClick={() => {
              setPreviewProduct(null);
              setZoomLevel(1);
            }}
          >
            <div
              className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ease-out cursor-default"
              style={{ transform: `scale(${zoomLevel})` }}
              onClick={(e) => {
                e.stopPropagation();
                setZoomLevel((prev) => (prev === 1 ? 1.6 : 1));
              }}
              title="Haz clic en la imagen para acercar/alejar zoom"
            >
              <img
                src={previewProduct.photoUrl}
                alt={previewProduct.name}
                className="max-h-[68vh] sm:max-h-[74vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl border border-white/10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] cursor-pointer"
              />
            </div>
          </div>

          {/* Barra Inferior con Métricas del Producto y Acciones Rápidas */}
          <div
            className="w-full px-4 sm:px-6 py-3 bg-black/70 backdrop-blur-md border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-white z-20 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl">
                <span className="text-white/60">P. Venta:</span>
                <span className="font-bold text-white font-mono">{currency} {previewProduct.sellingPriceUnit?.toFixed(2)}</span>
              </div>
              {isBcvActive && (
                <div className="flex items-center gap-1.5 bg-amber-500/25 border border-amber-500/40 text-amber-200 px-2.5 py-1.5 rounded-xl text-xs font-bold">
                  <span>BCV (+{bcvPercent}%):</span>
                  <span className="text-white font-mono">
                    {currency}{(previewProduct.sellingPriceUnit * (1 + bcvPercent / 100)).toFixed(2)}
                    {bcvRate > 0 && ` • Bs. ${(previewProduct.sellingPriceUnit * (1 + bcvPercent / 100) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl">
                <span className="text-white/60">Costo c/u:</span>
                <span className="font-bold text-white font-mono">{currency} {previewProduct.unitPriceCost?.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl font-bold">
                <span>Ganancia:</span>
                <span className="font-mono">+{currency} {previewProduct.netProfit?.toFixed(2)} ({previewProduct.profitMarginPercent?.toFixed(1)}%)</span>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold ${
                previewProduct.stock <= previewProduct.minStock
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-white/10 text-white'
              }`}>
                <span>Stock:</span>
                <span className="font-mono">{previewProduct.stock} unidades</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onAddStock && (
                <button
                  type="button"
                  onClick={() => {
                    const p = previewProduct;
                    setPreviewProduct(null);
                    setProductForAddStock(p);
                    setAddStockQty(1);
                    setAddStockNote('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>+ Aumentar Stock</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const p = previewProduct;
                  setPreviewProduct(null);
                  onEditProduct(p);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Producto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK DISCOUNT MODAL */}
      {quickDiscountProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Descuento de Producto</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                    {quickDiscountProduct.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickDiscountProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Switch Activar / Desactivar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  ¿Activar Descuento?
                </span>
                <span className="text-[10px] text-slate-400">
                  {quickDiscountActive ? 'Descuento visible para la venta' : 'Precio regular sin rebaja'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={quickDiscountActive}
                  onChange={(e) => setQuickDiscountActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {/* Input % & Presets */}
            {quickDiscountActive && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Porcentaje de Descuento:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={quickDiscountPercent}
                      onChange={(e) => setQuickDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-base font-black font-mono text-right rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[5, 10, 15, 20, 25, 30, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuickDiscountPercent(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        quickDiscountPercent === preset
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                      }`}
                    >
                      -{preset}%
                    </button>
                  ))}
                </div>

                {/* Price Preview */}
                <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Precio Base:</span>
                    <span className="line-through font-mono font-bold">${(quickDiscountProduct.sellingPriceUnit || 0).toFixed(2)} USD</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-rose-700 dark:text-rose-300">
                    <span>Nuevo Precio de Venta:</span>
                    <span className="font-mono text-sm font-black">
                      ${((quickDiscountProduct.sellingPriceUnit || 0) * (1 - (quickDiscountPercent || 0) / 100)).toFixed(2)} USD
                    </span>
                  </div>
                  {isBcvActive && (
                    <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 pt-1 border-t border-rose-200 dark:border-rose-900/40">
                      <span>Ref. Dólar BCV (+{bcvPercent}%):</span>
                      <span className="font-mono font-bold">
                        ${(((quickDiscountProduct.sellingPriceUnit || 0) * (1 - (quickDiscountPercent || 0) / 100)) * (1 + bcvPercent / 100)).toFixed(2)}
                        {bcvRate > 0 && ` • Bs. ${((((quickDiscountProduct.sellingPriceUnit || 0) * (1 - (quickDiscountPercent || 0) / 100)) * (1 + bcvPercent / 100)) * bcvRate).toLocaleString('es-VE', { maximumFractionDigits: 0 })}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleRemoveQuickDiscount}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Quitar Descuento
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickDiscountProduct(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickDiscount}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GESTIÓN DE DESCUENTOS MASIVOS & GENERALES */}
      <DiscountManagerModal
        isOpen={isDiscountModalOpen}
        products={products}
        currency={currency}
        bcvPercent={bcvPercent}
        bcvRate={bcvRate}
        onClose={() => setIsDiscountModalOpen(false)}
        onApplyDiscounts={(updated) => {
          if (onUpdateProducts) {
            onUpdateProducts(updated);
          }
        }}
      />
    </div>
  );
};
