import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  DollarSign,
  Package,
  Truck,
  TrendingUp,
  Percent,
  Check,
  Layers,
  Tag,
  Smartphone,
  Video,
} from 'lucide-react';
import { Product, ShippingBatch, RetentionBatch } from '../types';
import { compressImageFile, SAMPLE_PRODUCT_IMAGES } from '../services/imageUtils';
import { CameraCaptureModal } from './CameraCaptureModal';
import { storageService, DEFAULT_PRODUCT_CATEGORIES, DEFAULT_PAYMENT_DETAILS } from '../services/storageService';

interface ProductModalProps {
  isOpen: boolean;
  productToEdit?: Product | null;
  shippingBatches: ShippingBatch[];
  retentionBatches: RetentionBatch[];
  currency: string;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'itemNumber'>) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  productToEdit,
  shippingBatches,
  retentionBatches,
  currency,
  onClose,
  onSave,
}) => {
  // Dynamic categories from storage / user settings
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => {
    return storageService.getCategories();
  });

  // Form fields matching the user's "INVENTARIO VINCINT OMNIA"
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Joyería');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Cantidades y sets
  const [itemsCount, setItemsCount] = useState<number | ''>(1);
  const [piecesPerProduct, setPiecesPerProduct] = useState<number | ''>(1);
  const [productPrice, setProductPrice] = useState<number | ''>(2.5);

  // Empaque y Embalaje / Gastos Generales
  const [packagingCost, setPackagingCost] = useState<number | ''>(0);

  // Lotes
  const [selectedShippingBatchId, setSelectedShippingBatchId] = useState<string>('');
  const [shippingCostUnit, setShippingCostUnit] = useState<number | ''>(0.60);

  const [selectedRetentionBatchId, setSelectedRetentionBatchId] = useState<string>('');
  const [retentionCostUnit, setRetentionCostUnit] = useState<number | ''>(0.30);

  // Venta al público
  const [sellingPriceUnit, setSellingPriceUnit] = useState<number | ''>(5.00);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isDiscountActive, setIsDiscountActive] = useState<boolean>(false);

  // Almacén
  const [stock, setStock] = useState<number | ''>(10);
  const [minStock, setMinStock] = useState<number | ''>(5);
  const [location, setLocation] = useState('');
  const [supplier, setSupplier] = useState('Vincint Omnia Direct');

  const [isCompressing, setIsCompressing] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const cats = storageService.getCategories();
      setAvailableCategories(cats);
      if (!productToEdit && cats.length > 0 && !category) {
        setCategory(cats[0]);
      }
    }
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category || 'Joyería');
      setDescription(productToEdit.description || '');
      setPhotoUrl(productToEdit.photoUrl || '');

      setItemsCount(productToEdit.itemsCount ?? 1);
      setPiecesPerProduct(productToEdit.piecesPerProduct ?? 1);
      setProductPrice(productToEdit.productPrice ?? 2.5);

      const existingPackaging =
        productToEdit.packagingCost !== undefined
          ? productToEdit.packagingCost
          : (productToEdit.packagingCarton ?? 0) +
            (productToEdit.packagingBolsita ?? 0) +
            (productToEdit.packagingLogo ?? 0);
      setPackagingCost(existingPackaging);

      setSelectedShippingBatchId(productToEdit.shippingBatchId || '');
      setShippingCostUnit(productToEdit.shippingCostUnit ?? 0.60);

      setSelectedRetentionBatchId(productToEdit.retentionBatchId || '');
      setRetentionCostUnit(productToEdit.retentionCostUnit ?? 0.30);

      setSellingPriceUnit(productToEdit.sellingPriceUnit ?? 5.00);
      setDiscountPercent(productToEdit.discountPercent ?? 0);
      setIsDiscountActive(Boolean(productToEdit.isDiscountActive && (productToEdit.discountPercent ?? 0) > 0));
      setStock(productToEdit.stock ?? 10);
      setMinStock(productToEdit.minStock ?? 5);
      setLocation(productToEdit.location || '');
      setSupplier(productToEdit.supplier || 'Vincint Omnia Direct');
    } else {
      // Default new product with initial batch pre-selected
      const defaultShipBatch = shippingBatches[0];
      const defaultRetBatch = retentionBatches[0];

      setName('');
      setSku(`VO-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategory('Joyería');
      setDescription('');
      setPhotoUrl('');

      setItemsCount(1);
      setPiecesPerProduct(5);
      setProductPrice(8.50);

      setPackagingCost(0);

      if (defaultShipBatch) {
        setSelectedShippingBatchId(defaultShipBatch.id);
        setShippingCostUnit(defaultShipBatch.unitShipping);
      } else {
        setSelectedShippingBatchId('');
        setShippingCostUnit(0.60);
      }

      if (defaultRetBatch) {
        setSelectedRetentionBatchId(defaultRetBatch.id);
        setRetentionCostUnit(defaultRetBatch.unitRetention);
      } else {
        setSelectedRetentionBatchId('');
        setRetentionCostUnit(0.30);
      }

      setSellingPriceUnit(6.00);
      setDiscountPercent(0);
      setIsDiscountActive(false);
      setStock(25);
      setMinStock(5);
      setLocation('Estante A-01');
      setSupplier('Vincint Omnia Direct');
    }
  }, [productToEdit, isOpen, shippingBatches, retentionBatches]);

  if (!isOpen) return null;

  // Handle When Shipping Batch is Selected from Dropdown
  const handleShippingBatchChange = (batchId: string) => {
    setSelectedShippingBatchId(batchId);
    if (!batchId) return;
    const batch = shippingBatches.find((b) => b.id === batchId);
    if (batch) {
      // AUTOMATICALLY FILL THE UNIT SHIPPING PRICE FROM THE BATCH!
      setShippingCostUnit(batch.unitShipping);
    }
  };

  // Handle When Retention Batch is Selected from Dropdown
  const handleRetentionBatchChange = (batchId: string) => {
    setSelectedRetentionBatchId(batchId);
    if (!batchId) return;
    const batch = retentionBatches.find((b) => b.id === batchId);
    if (batch) {
      setRetentionCostUnit(batch.unitRetention);
    }
  };

  // Handle Photo File Upload / Camera Capture
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImageFile(file, 600, 0.82);
      setPhotoUrl(compressedDataUrl);
    } catch (err) {
      console.error('Error procesando imagen:', err);
      alert('Hubo un problema al procesar la foto.');
    } finally {
      setIsCompressing(false);
    }
  };

  // NUMERIC CONVERSIONS & LIVE CALCULATIONS
  const numItems = typeof itemsCount === 'number' && itemsCount > 0 ? itemsCount : 1;
  const numPieces = typeof piecesPerProduct === 'number' && piecesPerProduct > 0 ? piecesPerProduct : 1;
  const numProductPrice = typeof productPrice === 'number' ? productPrice : 0;

  // PRECIO DEL PRODUCTO TOTAL = ITEMS * PRECIO DEL PRODUCTO
  const calcTotalProductPrice = numItems * numProductPrice;

  // PRECIO C/U = PRECIO DEL PRODUCTO / CANTIDAD QUE TRAE EL PRODUCTO
  const calcUnitPriceCost = numPieces > 0 ? numProductPrice / numPieces : 0;

  // GASTOS DE EMPAQUE Y GENERALES
  const numPackaging = typeof packagingCost === 'number' ? packagingCost : 0;

  // ENVIO & RETENCIÓN
  const numShippingUnit = typeof shippingCostUnit === 'number' ? shippingCostUnit : 0;
  const numRetentionUnit = typeof retentionCostUnit === 'number' ? retentionCostUnit : 0;

  // COTIZACIÓN TOTAL
  // Suma de: Precio Producto Total + (Gastos Empaque + Retención + Envío) * ITEMS
  const calcTotalQuotation = calcTotalProductPrice + (numPackaging + numRetentionUnit + numShippingUnit) * numItems;

  // COTIZACIÓN C/U
  const totalPiecesAll = numItems * numPieces;
  const calcUnitQuotation = totalPiecesAll > 0 ? calcTotalQuotation / totalPiecesAll : 0;

  // MONTO BRUTO Y GANANCIA (considerando descuento individual si está activo)
  const numSellingUnit = typeof sellingPriceUnit === 'number' ? sellingPriceUnit : 0;
  const hasActiveDiscount = Boolean(isDiscountActive && discountPercent > 0);
  const effectiveSellingPrice = hasActiveDiscount
    ? Math.max(0.01, Number((numSellingUnit * (1 - discountPercent / 100)).toFixed(2)))
    : numSellingUnit;
  const calcGrossAmount = effectiveSellingPrice * totalPiecesAll;

  // GANANCIA
  const calcNetProfit = calcGrossAmount - calcTotalQuotation;

  // % GANANCIA
  const calcProfitMarginPercent = calcTotalQuotation > 0 ? (calcNetProfit / calcTotalQuotation) * 100 : 0;

  // Configuración BCV diferencial
  const appSettings = storageService.getAppSettings();
  const paymentDetails = {
    ...DEFAULT_PAYMENT_DETAILS,
    ...(appSettings.paymentDetails || {}),
  };
  const isBcvActive = Boolean(paymentDetails.enabledBcvPricing);
  const bcvPercent = typeof paymentDetails.bcvDifferentialPercent === 'number' ? paymentDetails.bcvDifferentialPercent : 15;
  const bcvRate = typeof paymentDetails.bcvRate === 'number' ? paymentDetails.bcvRate : 880;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor introduce la descripción o nombre del producto.');
      return;
    }

    onSave({
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now()}`,
      category,
      description: description.trim(),
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=80',
      itemsCount: numItems,
      piecesPerProduct: numPieces,
      productPrice: Number(numProductPrice.toFixed(2)),
      totalProductPrice: Number(calcTotalProductPrice.toFixed(2)),
      unitPriceCost: Number(calcUnitPriceCost.toFixed(2)),
      packagingCost: Number(numPackaging.toFixed(2)),
      packagingCarton: Number(numPackaging.toFixed(2)),
      packagingBolsita: 0,
      packagingLogo: 0,
      shippingBatchId: selectedShippingBatchId || undefined,
      shippingCostUnit: Number(numShippingUnit.toFixed(2)),
      retentionBatchId: selectedRetentionBatchId || undefined,
      retentionCostUnit: Number(numRetentionUnit.toFixed(2)),
      totalQuotation: Number(calcTotalQuotation.toFixed(2)),
      unitQuotation: Number(calcUnitQuotation.toFixed(2)),
      sellingPriceUnit: Number(numSellingUnit.toFixed(2)),
      discountPercent: hasActiveDiscount ? Number(discountPercent) : 0,
      isDiscountActive: hasActiveDiscount,
      grossAmount: Number(calcGrossAmount.toFixed(2)),
      netProfit: Number(calcNetProfit.toFixed(2)),
      profitMarginPercent: Number(calcProfitMarginPercent.toFixed(2)),
      stock: typeof stock === 'number' ? stock : totalPiecesAll,
      minStock: typeof minStock === 'number' ? minStock : 5,
      location: location.trim(),
      supplier: supplier.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {productToEdit ? 'Editar Producto del Almacén' : 'Registrar Nuevo Producto'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estructura oficial Vincint Omnia • Asignación automática de lote de envío y cotización
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* SECTION 1: PHOTO */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Foto del Producto (IMAGEN)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-28 h-28 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center shadow-xs shrink-0 group">
                {photoUrl ? (
                  <>
                    <img src={photoUrl} alt="Vista previa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute inset-0 bg-black/50 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      Quitar
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <Camera className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400">Sin foto</span>
                  </div>
                )}
                {isCompressing && (
                  <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300 font-bold">
                    Procesando...
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap gap-2">
                  {/* Direct Native Camera trigger (works 100% on phones and PCs) */}
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs active:scale-95 transition-all cursor-pointer"
                    title="Abre directamente la cámara de tu teléfono o dispositivo para tomar la foto"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Tomar Foto (Cámara)</span>
                  </button>

                  {/* Live Web Camera viewfinder modal */}
                  <button
                    type="button"
                    onClick={() => setIsLiveCameraOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-2xs cursor-pointer"
                    title="Abre el visor de cámara web interactivo en pantalla"
                  >
                    <Video className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Visor en Vivo</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Galería</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Muestras</span>
                  </button>
                </div>

                {showPresets && (
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-2 animate-in fade-in">
                    {SAMPLE_PRODUCT_IMAGES.map((img) => (
                      <button
                        key={img.name}
                        type="button"
                        onClick={() => {
                          setPhotoUrl(img.url);
                          if (!name) setName(img.name);
                          setShowPresets(false);
                        }}
                        className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-emerald-500 aspect-square cursor-pointer"
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] p-0.5 truncate text-center">
                          {img.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: DESCRIPCIÓN & CLASIFICACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                DESCRIPCIÓN (Nombre del Producto) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. 5 Piezas Gafas de Moda para Mujer Marco Completo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {Array.from(new Set([...availableCategories, ...(category ? [category] : [])])).map((c, idx) => (
                  <option key={`${c}-${idx}`} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 3: CANTIDADES Y PRECIO DEL PRODUCTO (ITEMS & CANTIDAD QUE TRAE) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              1. Cantidades y Precios del Producto (Costo de Compra)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ITEMS (Paquetes)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={itemsCount}
                  onChange={(e) => setItemsCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="1"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Lotes comprados</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cantidad que Trae
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={piecesPerProduct}
                  onChange={(e) => setPiecesPerProduct(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="5"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-center bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Piezas por paquete</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Precio del Producto ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="8.50"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Precio de compra</span>
              </div>

              {/* Calculated Unit Price */}
              <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">PRECIO C/U</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {currency} {calcUnitPriceCost.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">Por pieza individual</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: SELECCIÓN DEL LOTE DE ENVÍO & IMPUESTO TAX */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                2. Selección de Lote de Envío & Impuesto tax (Cálculo Automático)
              </h4>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                Autocalculado
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shipping Batch Selector */}
              <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Seleccionar Lote de Envío:
                </label>
                <select
                  value={selectedShippingBatchId}
                  onChange={(e) => handleShippingBatchChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Personalizado / Manual</option>
                  {shippingBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      Lote {b.batchNumber}: {b.name} ({b.totalProducts} uds • {currency}{b.unitShipping.toFixed(2)}/u)
                    </option>
                  ))}
                </select>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Precio de Envío Individual:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingCostUnit}
                      onChange={(e) => setShippingCostUnit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 text-sm font-black text-emerald-700 dark:text-emerald-400 text-right bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Retention / Impuesto tax Batch Selector */}
              <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/60">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Seleccionar Lote de Impuesto tax:
                </label>
                <select
                  value={selectedRetentionBatchId}
                  onChange={(e) => handleRetentionBatchChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Personalizado / Manual</option>
                  {retentionBatches.map((rb) => (
                    <option key={rb.id} value={rb.id}>
                      Lote {rb.batchNumber}: {rb.name} ({currency}{rb.unitRetention.toFixed(2)}/u)
                    </option>
                  ))}
                </select>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Impuesto tax Individual:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={retentionCostUnit}
                      onChange={(e) => setRetentionCostUnit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-20 px-2 py-1 text-sm font-black text-sky-700 dark:text-sky-400 text-right bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: GASTOS DE EMPAQUE, EMBALAJE Y GENERALES */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              3. Gastos de Empaque y Embalaje
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Casilla general para agregar el total de gastos (cajas, bolsas, etiquetas, precintos y embalaje).
            </p>

            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gastos Generales ({currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 text-sm font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                Costo por paquete que se multiplica por ITEMS
              </span>
            </div>
          </div>

          {/* SECTION 6: PRECIO DE VENTA Y COTIZACIÓN FINAL */}
          <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                4. Cotización, Venta y Ganancia Neta
              </h4>
              <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                Balance Financiero
              </span>
            </div>

            {/* Price input */}
            <div className="mb-4 bg-white/10 dark:bg-slate-800/80 p-3.5 rounded-xl flex items-center justify-between border border-white/10">
              <div>
                <label className="text-xs font-bold text-white block">
                  PRECIO UNITARIO DE VENTA AL PÚBLICO
                </label>
                <span className="text-[10px] text-slate-300">Precio por cada pieza</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-emerald-400">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={sellingPriceUnit}
                  onChange={(e) => setSellingPriceUnit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="6.00"
                  className="w-28 px-3 py-1.5 text-base font-black text-right text-white bg-slate-800 border border-emerald-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* Banner de Precio de Venta a Tasa Oficial BCV cuando está activo */}
            {isBcvActive && (
              <div className="mb-4 bg-amber-500/15 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between text-xs text-amber-200">
                <div className="flex items-center gap-2 font-bold">
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Precio de Venta BCV (+{bcvPercent}%):</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-black text-amber-300 text-sm">
                    {currency}{(numSellingUnit * (1 + bcvPercent / 100)).toFixed(2)}
                  </span>
                  {bcvRate > 0 && (
                    <span className="block text-[10px] text-amber-300/80 font-medium">
                      Bs. {(numSellingUnit * (1 + bcvPercent / 100) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* SECCIÓN DE DESCUENTO INDIVIDUAL PROMOCIONAL */}
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white block">
                      ¿Descuento Promocional en Venta?
                    </label>
                    <span className="text-[10px] text-rose-200/80">
                      Rebaja individual para este producto visible en inventario y catálogo
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDiscountActive}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsDiscountActive(checked);
                      if (checked && (!discountPercent || discountPercent <= 0)) {
                        setDiscountPercent(10);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>

              {isDiscountActive && (
                <div className="pt-2 border-t border-rose-500/20 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-rose-300">Rápidos:</span>
                      {[5, 10, 15, 20, 25, 30, 40, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountPercent(pct)}
                          className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                            discountPercent === pct
                              ? 'bg-rose-500 text-white shadow-2xs'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[10px] font-bold text-slate-300">% Descuento:</span>
                      <div className="relative w-20">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={discountPercent || ''}
                          onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                          placeholder="10"
                          className="w-full pl-2 pr-5 py-1 text-xs font-black text-right text-white bg-slate-800 border border-rose-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400"
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Previsualización del Precio Final */}
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-rose-500/25 flex items-center justify-between text-xs">
                    <div className="text-slate-300">
                      <span>Precio Final con Descuento (-{discountPercent}%):</span>
                      <div className="text-[10px] text-slate-400">
                        Precio Regular: <span className="line-through">{currency}{numSellingUnit.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-rose-400 text-sm sm:text-base">
                        {currency}{effectiveSellingPrice.toFixed(2)}
                      </span>
                      {isBcvActive && (
                        <div className="text-[10px] text-amber-300 font-mono">
                          BCV (+{bcvPercent}%): {currency}{(effectiveSellingPrice * (1 + bcvPercent / 100)).toFixed(2)}
                          {bcvRate > 0 && ` • Bs. ${(effectiveSellingPrice * (1 + bcvPercent / 100) * bcvRate).toLocaleString('es-VE', { maximumFractionDigits: 0 })}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Grid matching the user's table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-semibold">COTIZACIÓN TOTAL</span>
                <span className="text-sm font-bold text-white font-mono">
                  {currency} {calcTotalQuotation.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-400 block">Costo global</span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-semibold">COTIZACIÓN C/U</span>
                <span className="text-sm font-bold text-white font-mono">
                  {currency} {calcUnitQuotation.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-400 block">Costo por pieza</span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-semibold">MONTO BRUTO</span>
                <span className="text-sm font-bold text-sky-400 font-mono">
                  {currency} {calcGrossAmount.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-400 block">Ingreso potencial</span>
              </div>

              <div className={`p-2.5 rounded-xl border ${calcNetProfit >= 0 ? 'bg-emerald-950/80 border-emerald-500/50' : 'bg-rose-950/80 border-rose-500/50'}`}>
                <span className="text-[10px] text-slate-300 block font-semibold">GANANCIA NETA</span>
                <span className={`text-base font-black font-mono ${calcNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {calcNetProfit >= 0 ? '+' : ''}{currency} {calcNetProfit.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold block mt-0.5 text-amber-300">
                  {calcProfitMarginPercent.toFixed(1)}% ROI
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 7: STOCK & UBICACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stock Inicial en Almacén
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alerta de Stock Mínimo
              </label>
              <input
                type="number"
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ubicación en Almacén
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej. Estante A-01"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 dark:shadow-none active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {productToEdit ? 'Guardar Cambios' : 'Registrar en Inventario'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onCapture={(dataUrl) => {
          setPhotoUrl(dataUrl);
          setIsLiveCameraOpen(false);
        }}
      />
    </div>
  );
};
