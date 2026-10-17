export interface ShippingBatch {
  id: string;
  batchNumber: number | string;
  name: string;
  totalProducts: number;      // Cantidad de productos en el paquete/lote (ej: 160)
  totalNetShipping: number;   // Monto de envío neto (ej: $95.52)
  unitShipping: number;       // Monto individual calculado = totalNetShipping / totalProducts ($0.60)
  date: string;
  courier?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
}

export interface RetentionBatch {
  id: string;
  batchNumber: number | string;
  name: string;
  totalProducts: number;      // Cantidad de productos (ej: 100)
  totalNetRetention: number;  // Monto de retención neto (ej: $30.00)
  unitRetention: number;      // Monto individual calculado = totalNetRetention / totalProducts ($0.30)
  date: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
}

export interface Product {
  id: string;
  itemNumber: number;          // N° secuencial (1, 2, 3...)
  sku: string;
  name: string;                // DESCRIPCIÓN
  category: string;
  description?: string;
  photoUrl: string;            // IMAGEN
  
  // Estructura de cantidades de la base de datos Vincint Omnia
  itemsCount: number;          // ITEMS (Cantidad de sets/paquetes comprados, ej: 1)
  piecesPerProduct: number;    // CANTIDAD QUE TRAE EL PRODUCTO (ej: 5 gafas, 1 reloj, 12 pinzas, 40 anillos)
  
  // Precios de compra del producto
  productPrice: number;        // PRECIO DEL PRODUCTO unitario (ej: $8.50)
  totalProductPrice: number;   // PRECIO DEL PRODUCTO TOTAL = itemsCount * productPrice (ej: $8.50)
  unitPriceCost: number;       // PRECIO C/U individual = productPrice / piecesPerProduct (ej: $1.70)
  
  // Empaque, embalaje y gastos generales
  packagingCarton: number;     // CARTÓN (ej: $1.00)
  packagingBolsita: number;    // BOLSITA (ej: $1.00)
  packagingLogo: number;       // LOGO (ej: $1.00)
  packagingCost?: number;      // Gasto general de empaque y embalaje consolidado
  
  // Lote de Envío vinculado
  shippingBatchId?: string;    // ID del Lote de envío seleccionado
  shippingCostUnit: number;    // ENVIO individual asignado automáticamente por el lote ($0.60)
  
  // Retención de pago
  retentionBatchId?: string;   // ID del Lote de retención
  retentionCostUnit: number;   // RETENCIÓN DE PAGO individual ($0.30)
  
  // Cotizaciones y Costos Totales
  totalQuotation: number;      // COTIZACIÓN TOTAL = totalProductPrice + (cartón + bolsita + logo + retención + envío) * itemsCount
  unitQuotation: number;       // COTIZACIÓN C/U por unidad individual
  
  // Venta y Beneficio
  sellingPriceUnit: number;    // PRECIO UNITARIO de venta al público (ej: $6.00)
  discountPercent?: number;    // % DE DESCUENTO PROMOCIONAL (ej: 10 para 10% OFF)
  isDiscountActive?: boolean;  // Estado de activación del descuento
  grossAmount: number;         // MONTO BRUTO = sellingPriceUnit * (piecesPerProduct * itemsCount)
  netProfit: number;           // GANANCIA = grossAmount - totalQuotation
  profitMarginPercent: number; // % GANANCIA = (netProfit / totalQuotation) * 100
  
  // Almacén
  stock: number;               // Stock total de unidades individuales disponibles
  minStock: number;
  location?: string;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
  timestamp?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  unitShipping: number;
  photoUrl?: string;
}

export interface Installment {
  id: string;
  number: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  isPaid: boolean;
  paidDate?: string;
  paymentMethod?: 'efectivo' | 'transferencia' | 'pago_movil' | 'tarjeta' | 'mercadopago' | 'otro' | 'binance';
  paymentReference?: string;
  notes?: string;
}

export interface SaleOrder {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: SaleItem[];
  totalSale: number;
  totalProductCost: number;
  totalShippingCost: number;
  extraExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  shippingStatus: 'pendiente' | 'preparando' | 'enviado' | 'entregado';
  paymentStatus: 'pendiente' | 'parcial' | 'pagado';
  paymentMethod: 'efectivo' | 'transferencia' | 'pago_movil' | 'tarjeta' | 'mercadopago' | 'otro' | 'binance';
  paymentReference?: string;
  shippingCourier?: string;
  trackingNumber?: string;
  notes?: string;
  // Ventas a crédito o a plazos
  paymentType?: 'contado' | 'credito';
  totalInstallments?: number;
  installments?: Installment[];
  paidAmount?: number;
  remainingAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
}

export interface BankTransferConfig {
  bankName: string;
  accountNumber: string;
  accountType: string;
  accountHolder: string;
  idNumber: string;
  email?: string;
}

export interface PagoMovilConfig {
  bankName: string;
  phone: string;
  idNumber: string;
}

export interface BinancePayConfig {
  binanceId: string; // Binance ID / Pay ID (UID de 9 dígitos)
  email?: string;    // Correo registrado en Binance
  alias?: string;    // Nombre / Nickname en Binance
  notes?: string;    // Instrucción para el pago
}

export interface PaymentDetailsConfig {
  enabledBankTransfer: boolean;
  bankTransfer: BankTransferConfig;
  enabledPagoMovil: boolean;
  pagoMovil: PagoMovilConfig;
  customInstructions?: string;
  // Precio de Venta BCV (con porcentaje diferencial sobre USD)
  enabledBcvPricing?: boolean;
  bcvDifferentialPercent?: number; // Porcentaje de aumento (ej: 15%)
  bcvRate?: number;                // Tasa BCV en Bs/USD
  // Precio USDT (Binance P2P / Paralelo para mensajes de cobro)
  enabledUsdtPricing?: boolean;
  binanceUsdtRate?: number;        // Tasa USDT en Bs/USDT
  // Método de Pago Binance Pay (USDT)
  enabledBinancePay?: boolean;
  binancePay?: BinancePayConfig;
}

export interface Expense {
  id: string;
  date: string;
  category: 'envio' | 'empaque' | 'publicidad' | 'almacenaje' | 'servicios' | 'otro';
  concept: string;
  amount: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string | null;
  spreadsheetName: string;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  autoSync: boolean;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  monthName: string;
  totalSales: number;
  totalProductCost: number;
  totalShippingCost: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  unitsSold: number;
  ordersCount: number;
  inventoryValueCost: number;
  inventoryValueRetail: number;
  potentialProfit: number;
}

export interface AppSettings {
  appName: string;
  appSubtitle: string;
  theme: 'emerald' | 'amber' | 'indigo' | 'purple' | 'rose' | 'slate' | 'sky' | 'custom';
  customAccentColor?: string; // Custom hex color code (ej: #f59e0b)
  currency: string;
  paymentDetails?: PaymentDetailsConfig;
  darkMode?: boolean;
  themeMode?: 'light' | 'dark' | 'system';
  customLogoUrl?: string; // Data URL (Base64) or external URL for image/svg
  customLogoType?: 'image' | 'svg' | 'default';
  iconSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Size selector for the navbar and branding icon
  fontStyle?: 'serif' | 'sans';
  density?: 'comfortable' | 'compact';
  categories?: string[];
}

export interface HistoryRecord {
  id: string;
  type: 'stock_in' | 'stock_add' | 'sale' | 'stock_alert' | 'expense' | 'product_created';
  title: string;
  subtitle: string;
  timestamp: string;
  dateMs: number;
  productId?: string;
  productName?: string;
  sku?: string;
  quantityChange?: number;
  amount?: number;
  netProfit?: number;
  badgeText: string;
  badgeVariant: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  customer?: string;
  itemsSummary?: string;
}
