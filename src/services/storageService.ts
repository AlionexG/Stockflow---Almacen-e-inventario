import { Product, SaleOrder, Expense, GoogleSheetsConfig, ShippingBatch, RetentionBatch, AppSettings, PaymentDetailsConfig, HistoryRecord } from '../types';

export const DEFAULT_PRODUCT_CATEGORIES: string[] = [
  'Joyería',
  'Relojes',
  'Accesorios & Moda',
  'Accesorios & Pelo',
  'Accesorios Caballero',
  'Lentes & Gafas',
  'Bolsos & Carteras',
  'Calzado',
  'Hogar',
  'Electrónica',
  'General',
];

const STORAGE_KEYS = {
  CLEAN_INITIALIZED: 'stockflow_clean_slate_v3',
  PRODUCTS: 'stockflow_products_v3',
  SHIPPING_BATCHES: 'stockflow_shipping_batches_v3',
  RETENTION_BATCHES: 'stockflow_retention_batches_v3',
  ORDERS: 'stockflow_orders_v3',
  EXPENSES: 'stockflow_expenses_v3',
  SHEETS_CONFIG: 'stockflow_sheets_config_v3',
  CURRENCY: 'stockflow_currency_v3',
  APP_SETTINGS: 'stockflow_app_settings_v3',
  PENDING_SYNC: 'stockflow_pending_sync_v3',
  HISTORY: 'stockflow_history_records_v3',
};

// Garantizar inicio 100% limpio sin datos precargados de productos ni fletes
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.CLEAN_INITIALIZED)) {
      // Limpiar datos dummy heredados de sesiones previas
      localStorage.removeItem('stockflow_vincint_products_v2');
      localStorage.removeItem('stockflow_shipping_batches_v2');
      localStorage.removeItem('stockflow_retention_batches_v2');
      localStorage.removeItem('stockflow_orders_v2');
      localStorage.removeItem('stockflow_expenses_v2');

      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SHIPPING_BATCHES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.RETENTION_BATCHES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CLEAN_INITIALIZED, 'true');
    }
  } catch (e) {
    console.error('Storage initialization error:', e);
  }
}


export const INITIAL_SHIPPING_BATCHES: ShippingBatch[] = [
  {
    id: 'batch-ship-1',
    batchNumber: 1,
    name: 'Lote 1 - Envío Principal (160 Productos)',
    totalProducts: 160,
    totalNetShipping: 95.52,
    unitShipping: 0.60,
    courier: 'Importación Aérea Consolidada',
    date: '2026-10-01T08:00:00.000Z',
    notes: 'Tarifa calculada de $95,52 dividido entre 160 productos = $0,60 por producto',
  },
  {
    id: 'batch-ship-2',
    batchNumber: 2,
    name: 'Lote 2 - Envío Rápido Express (120 Productos)',
    totalProducts: 120,
    totalNetShipping: 84.00,
    unitShipping: 0.70,
    courier: 'DHL Express Courier',
    date: '2026-10-05T10:00:00.000Z',
    notes: 'Tarifa express dividida entre 120 piezas',
  },
  {
    id: 'batch-ship-3',
    batchNumber: 3,
    name: 'Lote 3 - Envío Económico Marítimo (200 Productos)',
    totalProducts: 200,
    totalNetShipping: 90.00,
    unitShipping: 0.45,
    courier: 'Carga Marítima Consolidada',
    date: '2026-10-10T12:00:00.000Z',
    notes: 'Tarifa económica por alto volumen',
  },
];

export const INITIAL_RETENTION_BATCHES: RetentionBatch[] = [
  {
    id: 'batch-ret-1',
    batchNumber: 1,
    name: 'Lote 1 - Retención Estándar Pasarela (100 Productos)',
    totalProducts: 100,
    totalNetRetention: 30.00,
    unitRetention: 0.30,
    date: '2026-10-01T08:00:00.000Z',
    notes: '$30,00 neto entre 100 productos = $0,30 por producto',
  },
  {
    id: 'batch-ret-2',
    batchNumber: 2,
    name: 'Lote 2 - Retención Especial (50 Productos)',
    totalProducts: 50,
    totalNetRetention: 20.00,
    unitRetention: 0.40,
    date: '2026-10-08T09:00:00.000Z',
    notes: 'Tarifa de retención pasarela de pago mercado',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    itemNumber: 1,
    sku: 'GAF-MOD-01',
    name: '5 Piezas Gafas de Moda para Mujer Marco Completo',
    category: 'Accesorios & Moda',
    description: 'Set de 5 gafas de sol marco completo estilo vintage y elegante.',
    photoUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 5,
    productPrice: 8.50,
    totalProductPrice: 8.50,
    unitPriceCost: 1.70,
    packagingCarton: 1.00,
    packagingBolsita: 1.00,
    packagingLogo: 1.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 24.40,
    unitQuotation: 4.88,
    sellingPriceUnit: 6.00,
    grossAmount: 30.00,
    netProfit: 5.60,
    profitMarginPercent: 22.95,
    stock: 25,
    minStock: 5,
    location: 'Estante A-01',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-002',
    itemNumber: 2,
    sku: 'REL-CUARZ-02',
    name: '1 Set/1 Pieza Reloj de Cuarzo de Silicona con Esfera Cuadrada de Tres Colores para Mujer',
    category: 'Relojes',
    description: 'Reloj analógico de cuarzo con correa de silicona suave y diseño moderno.',
    photoUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 1,
    productPrice: 2.27,
    totalProductPrice: 2.27,
    unitPriceCost: 2.27,
    packagingCarton: 1.00,
    packagingBolsita: 1.00,
    packagingLogo: 1.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 6.17,
    unitQuotation: 6.17,
    sellingPriceUnit: 8.50,
    grossAmount: 8.50,
    netProfit: 2.33,
    profitMarginPercent: 37.76,
    stock: 18,
    minStock: 4,
    location: 'Estante A-04',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-01T10:30:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-003',
    itemNumber: 3,
    sku: 'PIN-PELO-03',
    name: '12 piezas de pinzas de pelo de aleación con textura asimétrica',
    category: 'Accesorios & Pelo',
    description: 'Set de 12 pinzas doradas y plateadas de sujeción firme para peinados.',
    photoUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 12,
    productPrice: 2.37,
    totalProductPrice: 2.37,
    unitPriceCost: 0.20,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 3.27,
    unitQuotation: 0.27,
    sellingPriceUnit: 0.90,
    grossAmount: 10.80,
    netProfit: 7.53,
    profitMarginPercent: 230.28,
    stock: 48,
    minStock: 12,
    location: 'Cajón B-02',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-02T11:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-004',
    itemNumber: 4,
    sku: 'ANI-NARIZ-04',
    name: '40 piezas de anillos de nariz minimalistas de acero inoxidable dorado',
    category: 'Joyería',
    description: 'Pack de 40 piercings / aros nasales hipoalergénicos.',
    photoUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 40,
    productPrice: 1.55,
    totalProductPrice: 1.55,
    unitPriceCost: 0.04,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 2.45,
    unitQuotation: 0.06,
    sellingPriceUnit: 0.50,
    grossAmount: 20.00,
    netProfit: 17.55,
    profitMarginPercent: 716.33,
    stock: 80,
    minStock: 20,
    location: 'Cajón B-05',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-02T11:30:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-005',
    itemNumber: 5,
    sku: 'PER-NARIZ-05',
    name: '10 piezas/set Perno de nariz de acero inoxidable, decoración de diamantes de imitación',
    category: 'Joyería',
    description: 'Pernos nasales brillantes con circonita cúbica incrustada.',
    photoUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 10,
    productPrice: 1.20,
    totalProductPrice: 1.20,
    unitPriceCost: 0.12,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 2.10,
    unitQuotation: 0.21,
    sellingPriceUnit: 0.80,
    grossAmount: 8.00,
    netProfit: 5.90,
    profitMarginPercent: 280.95,
    stock: 30,
    minStock: 10,
    location: 'Cajón B-06',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-03T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-006',
    itemNumber: 6,
    sku: 'PUL-CAD-DOR-06',
    name: 'Juego de 5/12/24 pulseras abiertas de cadena de metal ancha DORADO',
    category: 'Joyería',
    description: 'Brazaletes abiertos combinables en acabado oro brillante.',
    photoUrl: 'https://images.unsplash.com/photo-1611591475879-1144a9846b9a?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 24,
    productPrice: 4.38,
    totalProductPrice: 4.38,
    unitPriceCost: 0.18,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 5.28,
    unitQuotation: 0.22,
    sellingPriceUnit: 0.90,
    grossAmount: 21.60,
    netProfit: 16.32,
    profitMarginPercent: 309.09,
    stock: 48,
    minStock: 12,
    location: 'Estante C-01',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-03T14:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-007',
    itemNumber: 7,
    sku: 'PUL-CAD-PLA-07',
    name: 'juego de 5/11/24 pulseras abiertas de cadena de metal PLATA',
    category: 'Joyería',
    description: 'Brazaletes abiertos combinables en acabado plata pulida.',
    photoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 24,
    productPrice: 3.53,
    totalProductPrice: 3.53,
    unitPriceCost: 0.15,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 4.43,
    unitQuotation: 0.18,
    sellingPriceUnit: 0.80,
    grossAmount: 19.20,
    netProfit: 14.77,
    profitMarginPercent: 333.41,
    stock: 24,
    minStock: 10,
    location: 'Estante C-02',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-04T09:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-008',
    itemNumber: 8,
    sku: 'ARE-CLIP-08',
    name: '1 set de 3 piezas de pendientes de clip con forma de C minimalista y vintage con strass',
    category: 'Joyería',
    description: 'Aros a presión tipo ear-cuff con cristales de imitación.',
    photoUrl: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 1,
    productPrice: 0.80,
    totalProductPrice: 0.80,
    unitPriceCost: 0.80,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 1.70,
    unitQuotation: 1.70,
    sellingPriceUnit: 3.99,
    grossAmount: 3.99,
    netProfit: 2.29,
    profitMarginPercent: 134.71,
    stock: 15,
    minStock: 5,
    location: 'Cajón B-08',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-04T10:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-009',
    itemNumber: 9,
    sku: 'ARE-PERLA-09',
    name: '36 piezas Juego de aretes con perlas falsas de colores',
    category: 'Joyería',
    description: 'Pack múltiple de 18 pares de aretes de botón con perlas surtidas.',
    photoUrl: 'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 18,
    productPrice: 1.26,
    totalProductPrice: 1.26,
    unitPriceCost: 0.07,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 2.16,
    unitQuotation: 0.12,
    sellingPriceUnit: 0.60,
    grossAmount: 10.80,
    netProfit: 8.64,
    profitMarginPercent: 400.00,
    stock: 36,
    minStock: 10,
    location: 'Cajón B-10',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-05T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-010',
    itemNumber: 10,
    sku: 'BRAZ-HOM-PLA-10',
    name: '1 pieza Brazalete de hombre sencillo trenzado y acero inoxidable, personalizable PLATA',
    category: 'Accesorios Caballero',
    description: 'Brazalete masculino con placa de acero para grabado y cordón trenzado reforzado.',
    photoUrl: 'https://images.unsplash.com/photo-1611591475879-1144a9846b9a?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 1,
    productPrice: 1.40,
    totalProductPrice: 1.40,
    unitPriceCost: 1.40,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 2.30,
    unitQuotation: 2.30,
    sellingPriceUnit: 5.50,
    grossAmount: 5.50,
    netProfit: 3.20,
    profitMarginPercent: 139.13,
    stock: 20,
    minStock: 5,
    location: 'Estante C-05',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-05T15:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-011',
    itemNumber: 11,
    sku: 'BRAZ-HOM-NEG-11',
    name: '1 pieza Brazalete de hombre sencillo trenzado y acero inoxidable, personalizable NEGRO',
    category: 'Accesorios Caballero',
    description: 'Brazalete negro mate con placa personalizable para hombres.',
    photoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 1,
    productPrice: 1.40,
    totalProductPrice: 1.40,
    unitPriceCost: 1.40,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 2.30,
    unitQuotation: 2.30,
    sellingPriceUnit: 5.50,
    grossAmount: 5.50,
    netProfit: 3.20,
    profitMarginPercent: 139.13,
    stock: 22,
    minStock: 5,
    location: 'Estante C-06',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-05T15:30:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-012',
    itemNumber: 13,
    sku: 'SCR-SATEN-12',
    name: 'Set de 10 scrunchies de satén estilo Jaffa, lazos para el cabello versátiles a juego con seda',
    category: 'Accesorios & Pelo',
    description: 'Coleteros suaves anti-frizz de satén brillante en tonos surtidos.',
    photoUrl: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 10,
    productPrice: 1.82,
    totalProductPrice: 1.82,
    unitPriceCost: 0.18,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 2.72,
    unitQuotation: 0.27,
    sellingPriceUnit: 0.80,
    grossAmount: 8.00,
    netProfit: 5.28,
    profitMarginPercent: 194.12,
    stock: 40,
    minStock: 10,
    location: 'Estante D-01',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-06T10:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-013',
    itemNumber: 15,
    sku: 'REL-ASTRO-AZU-13',
    name: '1 pieza Reloj deportivo electrónico LED con diseño de astronauta y avión AZUL',
    category: 'Relojes',
    description: 'Reloj digital infantil/juvenil con luces LED y temática espacial azul.',
    photoUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 1,
    productPrice: 1.59,
    totalProductPrice: 1.59,
    unitPriceCost: 1.59,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 2.49,
    unitQuotation: 2.49,
    sellingPriceUnit: 5.00,
    grossAmount: 5.00,
    netProfit: 2.51,
    profitMarginPercent: 100.80,
    stock: 14,
    minStock: 5,
    location: 'Estante A-08',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-06T11:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-014',
    itemNumber: 16,
    sku: 'REL-ASTRO-BLA-14',
    name: '2 pieza Reloj deportivo electrónico LED con diseño de astronauta y avión BLANCO',
    category: 'Relojes',
    description: 'Reloj digital astronauta blanco con correa de silicona.',
    photoUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 1,
    productPrice: 1.42,
    totalProductPrice: 1.42,
    unitPriceCost: 1.42,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 2.32,
    unitQuotation: 2.32,
    sellingPriceUnit: 5.00,
    grossAmount: 5.00,
    netProfit: 2.68,
    profitMarginPercent: 115.52,
    stock: 12,
    minStock: 4,
    location: 'Estante A-09',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-06T11:30:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-015',
    itemNumber: 17,
    sku: 'REL-ASTRO-NEG-15',
    name: '3 pieza Reloj deportivo electrónico LED con diseño de astronauta y avión NEGRO',
    category: 'Relojes',
    description: 'Reloj digital astronauta negro mate con pantalla iluminada.',
    photoUrl: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 1,
    productPrice: 1.21,
    totalProductPrice: 1.21,
    unitPriceCost: 1.21,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 2.11,
    unitQuotation: 2.11,
    sellingPriceUnit: 5.00,
    grossAmount: 5.00,
    netProfit: 2.89,
    profitMarginPercent: 136.97,
    stock: 20,
    minStock: 5,
    location: 'Estante A-10',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-06T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-016',
    itemNumber: 26,
    sku: 'PUL-BRAZ-35-16',
    name: 'Juego de 35 pulseras tipo brazalete de metal brillante minimalista liso',
    category: 'Joyería',
    description: 'Set apilable de 35 aros finos dorados para muñeca.',
    photoUrl: 'https://images.unsplash.com/photo-1611591475879-1144a9846b9a?w=500&auto=format&fit=crop&q=80',
    itemsCount: 1,
    piecesPerProduct: 35,
    productPrice: 8.59,
    totalProductPrice: 8.59,
    unitPriceCost: 0.25,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 0.60,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.30,
    totalQuotation: 9.49,
    unitQuotation: 0.27,
    sellingPriceUnit: 0.70,
    grossAmount: 24.50,
    netProfit: 15.01,
    profitMarginPercent: 158.17,
    stock: 70,
    minStock: 15,
    location: 'Estante C-08',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-07T14:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-017',
    itemNumber: 27,
    sku: 'PUL-BOHEM-17',
    name: '1 pieza Pulsera de cordón trenzado hecho a mano de colores, joyería bohemia regalo para mujeres',
    category: 'Joyería',
    description: 'Pulsera artesanal multicolor con nudo corredizo ajustable.',
    photoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=80',
    itemsCount: 2,
    piecesPerProduct: 1,
    productPrice: 2.07,
    totalProductPrice: 4.14,
    unitPriceCost: 2.07,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 1.19,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 0.60,
    totalQuotation: 7.73,
    unitQuotation: 3.86,
    sellingPriceUnit: 6.00,
    grossAmount: 12.00,
    netProfit: 4.27,
    profitMarginPercent: 55.24,
    stock: 16,
    minStock: 4,
    location: 'Estante C-09',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-07T16:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'prod-018',
    itemNumber: 49,
    sku: 'BUF-PUNT-18',
    name: '1 pieza Bufanda gruesa de punto de unicolor para mujer, cálida bufanda de cuello para invierno',
    category: 'Accesorios & Moda',
    description: 'Bufanda tipo cuello infinito de tejido térmico abrigador.',
    photoUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&auto=format&fit=crop&q=80',
    itemsCount: 4,
    piecesPerProduct: 1,
    productPrice: 2.44,
    totalProductPrice: 9.76,
    unitPriceCost: 2.44,
    packagingCarton: 0.00,
    packagingBolsita: 0.00,
    packagingLogo: 0.00,
    shippingBatchId: 'batch-ship-1',
    shippingCostUnit: 2.39,
    retentionBatchId: 'batch-ret-1',
    retentionCostUnit: 1.20,
    totalQuotation: 24.11,
    unitQuotation: 6.03,
    sellingPriceUnit: 12.00,
    grossAmount: 48.00,
    netProfit: 23.89,
    profitMarginPercent: 99.09,
    stock: 12,
    minStock: 4,
    location: 'Estante D-06',
    supplier: 'Vincint Omnia Direct',
    createdAt: '2026-10-08T18:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
];

export const INITIAL_ORDERS: SaleOrder[] = [
  {
    id: 'ord-095',
    orderNumber: 'PED-0995',
    date: '2026-05-12T11:00:00.000Z',
    customerName: 'Laura Domínguez',
    customerPhone: '+34 600 123 456',
    customerAddress: 'Av. Diagonal 340, Barcelona',
    items: [
      {
        productId: 'prod-001',
        productName: '5 Piezas Gafas de Moda para Mujer',
        quantity: 2,
        unitCost: 4.88,
        unitPrice: 6.00,
        unitShipping: 0.60,
      },
    ],
    totalSale: 60.00,
    totalProductCost: 38.80,
    totalShippingCost: 1.20,
    extraExpenses: 0.00,
    netProfit: 20.00,
    profitMarginPercent: 50.0,
    shippingStatus: 'entregado',
    paymentStatus: 'pagado',
    paymentMethod: 'tarjeta',
    shippingCourier: 'DHL Express',
  },
  {
    id: 'ord-096',
    orderNumber: 'PED-0996',
    date: '2026-06-18T15:30:00.000Z',
    customerName: 'Martín Rivas',
    customerPhone: '+34 655 987 654',
    customerAddress: 'Gran Vía 28, Madrid',
    items: [
      {
        productId: 'prod-002',
        productName: 'Reloj de Cuarzo de Silicona Cuadrado',
        quantity: 3,
        unitCost: 6.17,
        unitPrice: 8.50,
        unitShipping: 0.60,
      },
    ],
    totalSale: 102.00,
    totalProductCost: 65.50,
    totalShippingCost: 1.80,
    extraExpenses: 2.00,
    netProfit: 32.70,
    profitMarginPercent: 47.1,
    shippingStatus: 'entregado',
    paymentStatus: 'pagado',
    paymentMethod: 'transferencia',
    shippingCourier: 'Correos',
  },
  {
    id: 'ord-097',
    orderNumber: 'PED-0997',
    date: '2026-07-22T10:15:00.000Z',
    customerName: 'Isabel Ortega',
    customerPhone: '+34 677 334 455',
    customerAddress: 'Calle Colón 15, Valencia',
    items: [
      {
        productId: 'prod-001',
        productName: '5 Piezas Gafas de Moda para Mujer',
        quantity: 4,
        unitCost: 4.88,
        unitPrice: 6.00,
        unitShipping: 0.60,
      },
    ],
    totalSale: 145.00,
    totalProductCost: 89.20,
    totalShippingCost: 2.40,
    extraExpenses: 0.00,
    netProfit: 53.40,
    profitMarginPercent: 58.3,
    shippingStatus: 'entregado',
    paymentStatus: 'pagado',
    paymentMethod: 'tarjeta',
    shippingCourier: 'SEUR Express',
  },
  {
    id: 'ord-098',
    orderNumber: 'PED-0998',
    date: '2026-08-14T17:45:00.000Z',
    customerName: 'Javier Morales',
    customerPhone: '+34 622 889 900',
    customerAddress: 'Plaza Mayor 8, Salamanca',
    items: [
      {
        productId: 'prod-002',
        productName: 'Reloj de Cuarzo de Silicona Cuadrado',
        quantity: 5,
        unitCost: 6.17,
        unitPrice: 8.50,
        unitShipping: 0.60,
      },
    ],
    totalSale: 198.00,
    totalProductCost: 118.50,
    totalShippingCost: 3.00,
    extraExpenses: 0.00,
    netProfit: 76.50,
    profitMarginPercent: 62.9,
    shippingStatus: 'entregado',
    paymentStatus: 'pagado',
    paymentMethod: 'tarjeta',
    shippingCourier: 'DHL Express',
  },
  {
    id: 'ord-099',
    orderNumber: 'PED-0999',
    date: '2026-09-20T12:00:00.000Z',
    customerName: 'Elena Garrido',
    customerPhone: '+34 644 112 299',
    customerAddress: 'Calle Betis 4, Sevilla',
    items: [
      {
        productId: 'prod-001',
        productName: '5 Piezas Gafas de Moda',
        quantity: 3,
        unitCost: 4.88,
        unitPrice: 6.00,
        unitShipping: 0.60,
      },
      {
        productId: 'prod-002',
        productName: 'Reloj de Cuarzo de Silicona',
        quantity: 2,
        unitCost: 6.17,
        unitPrice: 8.50,
        unitShipping: 0.60,
      },
    ],
    totalSale: 245.00,
    totalProductCost: 142.00,
    totalShippingCost: 3.00,
    extraExpenses: 5.00,
    netProfit: 95.00,
    profitMarginPercent: 63.3,
    shippingStatus: 'entregado',
    paymentStatus: 'pagado',
    paymentMethod: 'tarjeta',
    shippingCourier: 'MRW',
  },
  {
    id: 'ord-101',
    orderNumber: 'PED-1001',
    date: '2026-10-02T14:30:00.000Z',
    customerName: 'Carolina Méndez',
    customerPhone: '+34 612 345 678',
    customerAddress: 'Calle Serrano 45, Madrid',
    items: [
      {
        productId: 'prod-001',
        productName: '5 Piezas Gafas de Moda para Mujer Marco Completo',
        quantity: 1,
        unitCost: 4.88,
        unitPrice: 6.00,
        unitShipping: 0.60,
      },
    ],
    totalSale: 30.00,
    totalProductCost: 24.40,
    totalShippingCost: 0.60,
    extraExpenses: 3.00,
    netProfit: 5.60,
    profitMarginPercent: 22.95,
    shippingStatus: 'entregado',
    paymentStatus: 'pagado',
    paymentMethod: 'tarjeta',
    shippingCourier: 'DHL Express',
    trackingNumber: 'DHL987123456',
  },
  {
    id: 'ord-102',
    orderNumber: 'PED-1002',
    date: '2026-10-05T16:15:00.000Z',
    customerName: 'Valeria Santos',
    customerPhone: '+34 689 112 233',
    customerAddress: 'Paseo de Gracia 110, Barcelona',
    items: [
      {
        productId: 'prod-002',
        productName: 'Reloj de Cuarzo de Silicona Cuadrado',
        quantity: 1,
        unitCost: 6.17,
        unitPrice: 8.50,
        unitShipping: 0.60,
      },
      {
        productId: 'prod-003',
        productName: '12 pinzas de pelo de aleación',
        quantity: 2,
        unitCost: 0.27,
        unitPrice: 0.90,
        unitShipping: 0.60,
      },
    ],
    totalSale: 10.30,
    totalProductCost: 6.71,
    totalShippingCost: 1.20,
    extraExpenses: 0.00,
    netProfit: 3.59,
    profitMarginPercent: 53.5,
    shippingStatus: 'entregado',
    paymentStatus: 'pagado',
    paymentMethod: 'transferencia',
    shippingCourier: 'Correos Express',
    trackingNumber: 'CRX44019283',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-098',
    date: '2026-06-05T09:00:00.000Z',
    category: 'empaque',
    concept: 'Bolsas Kraft y cajas de envío pequeñas',
    amount: 18.00,
  },
  {
    id: 'exp-099',
    date: '2026-08-01T10:00:00.000Z',
    category: 'publicidad',
    concept: 'Pauta Instagram & TikTok Ads',
    amount: 35.00,
  },
  {
    id: 'exp-100',
    date: '2026-09-02T11:00:00.000Z',
    category: 'almacenaje',
    concept: 'Estanterías modulares y cajas organizadoras',
    amount: 25.00,
  },
  {
    id: 'exp-001',
    date: '2026-10-01T08:00:00.000Z',
    category: 'empaque',
    concept: 'Cartón troquelado, Bolsitas transparentes y Logos autoadhesivos',
    amount: 45.00,
    notes: 'Insumos de embalaje y personalización de marca',
  },
  {
    id: 'exp-002',
    date: '2026-10-04T10:00:00.000Z',
    category: 'publicidad',
    concept: 'Publicidad en Redes Sociales para Joyería & Gafas',
    amount: 60.00,
    notes: 'Campaña de catálogo Vincint Omnia',
  },
];

export const DEFAULT_PAYMENT_DETAILS: PaymentDetailsConfig = {
  enabledBankTransfer: true,
  bankTransfer: {
    bankName: 'Banesco Banco Universal',
    accountNumber: '0134-0123-45-0001234567',
    accountType: 'Cuenta Corriente',
    accountHolder: 'Vincint Omnia C.A.',
    idNumber: 'J-50123456-7',
    email: 'pagos@vincintomnia.com',
  },
  enabledPagoMovil: true,
  pagoMovil: {
    bankName: 'Banesco (0134)',
    phone: '0414-1234567',
    idNumber: 'V-20123456',
  },
  customInstructions: 'Por favor envía el comprobante o captura de pago con el número de referencia para procesar y despachar tu pedido.',
  enabledBcvPricing: false,
  bcvDifferentialPercent: 15,
  bcvRate: 880,
  enabledUsdtPricing: false,
  binanceUsdtRate: 1010,
  enabledBinancePay: false,
  binancePay: {
    binanceId: '',
    email: '',
    alias: '',
    notes: 'Enviar vía Binance Pay a este Pay ID sin comisiones.',
  },
};

export const getProductDiscountInfo = (product?: Product | null) => {
  if (!product) {
    return {
      hasDiscount: false,
      percent: 0,
      originalPrice: 0,
      effectivePrice: 0,
    };
  }
  const hasDiscount = Boolean(product.isDiscountActive && (product.discountPercent || 0) > 0);
  const percent = product.discountPercent || 0;
  const originalPrice = product.sellingPriceUnit || 0;
  const effectivePrice = hasDiscount
    ? Math.max(0.01, Number((originalPrice * (1 - percent / 100)).toFixed(2)))
    : originalPrice;
  return {
    hasDiscount,
    percent,
    originalPrice,
    effectivePrice,
  };
};

export const getProductEffectivePrice = (product?: Product | null): number => {
  return getProductDiscountInfo(product).effectivePrice;
};

export const storageService = {
  // PRODUCTS
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading products:', e);
    }
    return [];
  },

  saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products:', e);
    }
  },

  addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'itemNumber'>): Product {
    const products = this.getProducts();
    const nextItemNumber = products.length > 0 ? Math.max(...products.map((p) => p.itemNumber || 0)) + 1 : 1;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      itemNumber: nextItemNumber,
      createdAt: now,
      updatedAt: now,
      timestamp: now,
    };
    products.unshift(newProduct);
    this.saveProducts(products);

    // Registrar permanentemente el primer cambio (alta de producto e ingreso de stock inicial) en el historial
    this.addHistoryRecord({
      type: 'stock_in',
      title: `Ingreso de Stock: ${newProduct.name}`,
      subtitle: `SKU: ${newProduct.sku || 'N/A'} • Categoría: ${newProduct.category || 'General'} • P. Venta: ${this.getCurrency()} ${(newProduct.sellingPriceUnit || 0).toFixed(2)} • Stock inicial: ${newProduct.stock || 0} uds.`,
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      quantityChange: newProduct.stock || 0,
      amount: (newProduct.unitPriceCost || newProduct.productPrice || 0) * (newProduct.stock || 0),
      badgeText: (newProduct.stock || 0) > 0 ? `${newProduct.stock} en stock` : 'Sin inventario',
      badgeVariant: (newProduct.stock || 0) > 0 ? 'success' : 'danger',
      timestamp: now,
    });

    return newProduct;
  },

  updateProduct(product: Product): void {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      const now = new Date().toISOString();
      products[index] = {
        ...product,
        updatedAt: now,
        timestamp: now,
      };
      this.saveProducts(products);
    }
  },

  deleteProduct(productId: string): void {
    const products = this.getProducts().filter((p) => p.id !== productId);
    this.saveProducts(products);
    // NOTA: El historial y el primer cambio del producto permanecen preservados intactos
    // para cumplir con la trazabilidad solicitada, no se eliminan sus registros históricos.
  },

  addStock(productId: string, quantityToAdd: number, note?: string): { product: Product; historyRecord: HistoryRecord } | null {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return null;
    const prevStock = product.stock || 0;
    const newStock = Math.max(0, prevStock + quantityToAdd);
    const now = new Date().toISOString();
    product.stock = newStock;
    product.updatedAt = now;
    product.timestamp = now;
    this.saveProducts(products);

    const historyRecord = this.addHistoryRecord({
      type: 'stock_add',
      title: `Aumento de Stock: ${product.name}`,
      subtitle: `Se sumaron +${quantityToAdd} unidades (Stock anterior: ${prevStock} → Nuevo stock: ${newStock}) • SKU: ${product.sku || 'N/A'}${note ? ` • Nota: ${note}` : ''}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantityChange: quantityToAdd,
      amount: (product.unitPriceCost || product.productPrice || 0) * quantityToAdd,
      badgeText: `+${quantityToAdd} agregadas`,
      badgeVariant: 'success',
      timestamp: now,
    });

    return { product, historyRecord };
  },

  updateStock(productId: string, newStock: number): void {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (product) {
      const prevStock = product.stock || 0;
      const safeNewStock = Math.max(0, newStock);
      const diff = safeNewStock - prevStock;
      const now = new Date().toISOString();
      product.stock = safeNewStock;
      product.updatedAt = now;
      product.timestamp = now;
      this.saveProducts(products);

      if (diff !== 0) {
        this.addHistoryRecord({
          type: diff > 0 ? 'stock_add' : 'stock_in',
          title: `${diff > 0 ? 'Aumento' : 'Ajuste'} de Stock: ${product.name}`,
          subtitle: `Ajuste manual de inventario: ${prevStock} → ${safeNewStock} uds (${diff > 0 ? `+${diff}` : diff} uds) • SKU: ${product.sku || 'N/A'}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantityChange: diff,
          amount: (product.unitPriceCost || product.productPrice || 0) * Math.abs(diff),
          badgeText: diff > 0 ? `+${diff} uds` : `${diff} uds`,
          badgeVariant: diff > 0 ? 'success' : 'warning',
          timestamp: now,
        });
      }
    }
  },

  applyGlobalDiscount(percent: number, category?: string): Product[] {
    const products = this.getProducts();
    const now = new Date().toISOString();
    const safePercent = Math.max(0, Math.min(99, percent));
    const isActivating = safePercent > 0;
    const updated = products.map((p) => {
      if (category && category !== 'Todas' && p.category !== category) {
        return p;
      }
      return {
        ...p,
        discountPercent: safePercent,
        isDiscountActive: isActivating,
        updatedAt: now,
        timestamp: now,
      };
    });
    this.saveProducts(updated);

    this.addHistoryRecord({
      type: 'stock_in',
      title: isActivating ? `Descuento Global Aplicado: -${safePercent}%` : `Descuentos Restablecidos`,
      subtitle: category && category !== 'Todas'
        ? `Se aplicó descuento del ${safePercent}% a la categoría "${category}"`
        : `Se aplicó descuento general del ${safePercent}% a todo el inventario`,
      badgeText: isActivating ? `-${safePercent}% OFF` : 'Precios Normales',
      badgeVariant: isActivating ? 'warning' : 'neutral',
      timestamp: now,
    });

    return updated;
  },

  clearDiscounts(category?: string): Product[] {
    const products = this.getProducts();
    const now = new Date().toISOString();
    const updated = products.map((p) => {
      if (category && category !== 'Todas' && p.category !== category) {
        return p;
      }
      return {
        ...p,
        discountPercent: 0,
        isDiscountActive: false,
        updatedAt: now,
        timestamp: now,
      };
    });
    this.saveProducts(updated);

    this.addHistoryRecord({
      type: 'stock_in',
      title: 'Descuentos Retirados del Inventario',
      subtitle: category && category !== 'Todas'
        ? `Se retiraron los descuentos de la categoría "${category}"`
        : 'Se restablecieron todos los precios de venta regulares',
      badgeText: 'Precios Base',
      badgeVariant: 'neutral',
      timestamp: now,
    });

    return updated;
  },

  setProductDiscount(productId: string, discountPercent: number, isActive: boolean): Product | null {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return null;
    const now = new Date().toISOString();
    const safePercent = Math.max(0, Math.min(99, discountPercent));
    product.discountPercent = safePercent;
    product.isDiscountActive = Boolean(isActive && safePercent > 0);
    product.updatedAt = now;
    product.timestamp = now;
    this.saveProducts(products);

    this.addHistoryRecord({
      type: 'stock_in',
      title: product.isDiscountActive ? `Descuento Asignado: ${product.name}` : `Descuento Desactivado: ${product.name}`,
      subtitle: product.isDiscountActive
        ? `Precio original: ${this.getCurrency()} ${(product.sellingPriceUnit || 0).toFixed(2)} → Con -${safePercent}%: ${this.getCurrency()} ${(product.sellingPriceUnit * (1 - safePercent / 100)).toFixed(2)}`
        : `Se restauró el precio original ${this.getCurrency()} ${(product.sellingPriceUnit || 0).toFixed(2)}`,
      productId: product.id,
      productName: product.name,
      badgeText: product.isDiscountActive ? `-${safePercent}% OFF` : 'Sin Descuento',
      badgeVariant: product.isDiscountActive ? 'warning' : 'neutral',
      timestamp: now,
    });

    return product;
  },

  // SHIPPING BATCHES
  getShippingBatches(): ShippingBatch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHIPPING_BATCHES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading shipping batches:', e);
    }
    return [];
  },

  saveShippingBatches(batches: ShippingBatch[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SHIPPING_BATCHES, JSON.stringify(batches));
    } catch (e) {
      console.error('Error saving shipping batches:', e);
    }
  },

  addShippingBatch(batch: Omit<ShippingBatch, 'id' | 'date' | 'unitShipping'> & { date?: string }): ShippingBatch {
    const batches = this.getShippingBatches();
    const unitShipping = batch.totalProducts > 0 ? Number((batch.totalNetShipping / batch.totalProducts).toFixed(2)) : 0;
    const now = new Date().toISOString();
    const newBatch: ShippingBatch = {
      ...batch,
      id: `batch-ship-${Date.now()}`,
      unitShipping,
      date: batch.date || now,
      createdAt: now,
      updatedAt: now,
      timestamp: now,
    };
    batches.unshift(newBatch);
    this.saveShippingBatches(batches);
    return newBatch;
  },

  updateShippingBatch(batch: ShippingBatch): void {
    const batches = this.getShippingBatches();
    const index = batches.findIndex((b) => b.id === batch.id);
    if (index !== -1) {
      const now = new Date().toISOString();
      const unitShipping = batch.totalProducts > 0 ? Number((batch.totalNetShipping / batch.totalProducts).toFixed(2)) : 0;
      batches[index] = {
        ...batch,
        unitShipping,
        updatedAt: now,
        timestamp: now,
      };
      this.saveShippingBatches(batches);
    }
  },

  deleteShippingBatch(batchId: string): void {
    const batches = this.getShippingBatches().filter((b) => b.id !== batchId);
    this.saveShippingBatches(batches);
  },

  // RETENTION BATCHES
  getRetentionBatches(): RetentionBatch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RETENTION_BATCHES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading retention batches:', e);
    }
    return [];
  },

  saveRetentionBatches(batches: RetentionBatch[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RETENTION_BATCHES, JSON.stringify(batches));
    } catch (e) {
      console.error('Error saving retention batches:', e);
    }
  },

  addRetentionBatch(batch: Omit<RetentionBatch, 'id' | 'date' | 'unitRetention'> & { date?: string }): RetentionBatch {
    const batches = this.getRetentionBatches();
    const unitRetention = batch.totalProducts > 0 ? Number((batch.totalNetRetention / batch.totalProducts).toFixed(2)) : 0;
    const now = new Date().toISOString();
    const newBatch: RetentionBatch = {
      ...batch,
      id: `batch-ret-${Date.now()}`,
      unitRetention,
      date: batch.date || now,
      createdAt: now,
      updatedAt: now,
      timestamp: now,
    };
    batches.unshift(newBatch);
    this.saveRetentionBatches(batches);
    return newBatch;
  },

  updateRetentionBatch(batch: RetentionBatch): void {
    const batches = this.getRetentionBatches();
    const index = batches.findIndex((b) => b.id === batch.id);
    if (index !== -1) {
      const now = new Date().toISOString();
      const unitRetention = batch.totalProducts > 0 ? Number((batch.totalNetRetention / batch.totalProducts).toFixed(2)) : 0;
      batches[index] = {
        ...batch,
        unitRetention,
        updatedAt: now,
        timestamp: now,
      };
      this.saveRetentionBatches(batches);
    }
  },

  deleteRetentionBatch(batchId: string): void {
    const batches = this.getRetentionBatches().filter((b) => b.id !== batchId);
    this.saveRetentionBatches(batches);
  },

  // ORDERS
  getOrders(): SaleOrder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading orders:', e);
    }
    return [];
  },

  saveOrders(orders: SaleOrder[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving orders:', e);
    }
  },

  addOrder(order: Omit<SaleOrder, 'id' | 'orderNumber'>): SaleOrder {
    const orders = this.getOrders();
    const nextNum = 1000 + orders.length + 1;
    const now = new Date().toISOString();
    const newOrder: SaleOrder = {
      ...order,
      id: `ord-${Date.now()}`,
      orderNumber: `PED-${nextNum}`,
      date: order.date || now,
      createdAt: now,
      updatedAt: now,
      timestamp: now,
    };
    orders.unshift(newOrder);
    this.saveOrders(orders);

    // Decrement stock
    const products = this.getProducts();
    for (const item of newOrder.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        prod.updatedAt = now;
        prod.timestamp = now;
      }
    }
    this.saveProducts(products);

    // Registrar en el historial persistente
    const totalUnits = (newOrder.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    const itemsSummary = (newOrder.items || []).map((it) => `${it.productName} (x${it.quantity})`).join(', ');
    this.addHistoryRecord({
      type: 'sale',
      title: `Venta ${newOrder.orderNumber || ''} • ${newOrder.customerName || 'Cliente General'}`,
      subtitle: `${totalUnits} unid. deducida${totalUnits !== 1 ? 's' : ''} de almacén • ${itemsSummary || 'Venta de productos'}`,
      timestamp: newOrder.date || now,
      quantityChange: -totalUnits,
      amount: newOrder.totalSale || 0,
      netProfit: newOrder.netProfit,
      badgeText: newOrder.paymentStatus === 'pagado' ? 'Pagado' : newOrder.paymentStatus === 'parcial' ? 'Parcial' : 'Pendiente / Crédito',
      badgeVariant: newOrder.paymentStatus === 'pagado' ? 'success' : newOrder.paymentStatus === 'parcial' ? 'warning' : 'info',
      customer: newOrder.customerName,
      itemsSummary,
    });

    return newOrder;
  },

  updateOrder(order: SaleOrder): void {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === order.id);
    if (index !== -1) {
      const now = new Date().toISOString();
      orders[index] = {
        ...order,
        updatedAt: now,
        timestamp: now,
      };
      this.saveOrders(orders);
    }
  },

  deleteOrder(orderId: string): void {
    const orders = this.getOrders().filter((o) => o.id !== orderId);
    this.saveOrders(orders);
  },

  // EXPENSES
  getExpenses(): Expense[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading expenses:', e);
    }
    return [];
  },

  saveExpenses(expenses: Expense[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error('Error saving expenses:', e);
    }
  },

  addExpense(expense: Omit<Expense, 'id'>): Expense {
    const expenses = this.getExpenses();
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      date: expense.date || now,
      createdAt: now,
      updatedAt: now,
      timestamp: now,
    };
    expenses.unshift(newExpense);
    this.saveExpenses(expenses);

    // Registrar en el historial persistente
    this.addHistoryRecord({
      type: 'expense',
      title: `Gasto: ${newExpense.concept || 'Gasto operativo'}`,
      subtitle: `Categoría: ${newExpense.category || 'General'}${newExpense.notes ? ` • ${newExpense.notes}` : ''}`,
      timestamp: newExpense.date || now,
      amount: -(newExpense.amount || 0),
      badgeText: newExpense.category ? newExpense.category.toUpperCase() : 'GASTO',
      badgeVariant: 'neutral',
    });

    return newExpense;
  },

  updateExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    const index = expenses.findIndex((e) => e.id === expense.id);
    if (index !== -1) {
      const now = new Date().toISOString();
      expenses[index] = {
        ...expense,
        updatedAt: now,
        timestamp: now,
      };
      this.saveExpenses(expenses);
    }
  },

  deleteExpense(expenseId: string): void {
    const expenses = this.getExpenses().filter((e) => e.id !== expenseId);
    this.saveExpenses(expenses);
  },

  // BULK PERSISTENCE FOR CLOUD MERGE & IMPORT
  saveAllData(data: {
    products?: Product[];
    shippingBatches?: ShippingBatch[];
    retentionBatches?: RetentionBatch[];
    orders?: SaleOrder[];
    expenses?: Expense[];
    historyRecords?: HistoryRecord[];
  }): void {
    try {
      const now = new Date().toISOString();
      if (data.products) {
        const enriched = data.products.map(p => ({
          ...p,
          timestamp: p.timestamp || p.updatedAt || p.createdAt || now,
        }));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(enriched));
      }
      if (data.shippingBatches) {
        const enriched = data.shippingBatches.map(b => ({
          ...b,
          timestamp: b.timestamp || b.updatedAt || b.createdAt || now,
        }));
        localStorage.setItem(STORAGE_KEYS.SHIPPING_BATCHES, JSON.stringify(enriched));
      }
      if (data.retentionBatches) {
        const enriched = data.retentionBatches.map(r => ({
          ...r,
          timestamp: r.timestamp || r.updatedAt || r.createdAt || now,
        }));
        localStorage.setItem(STORAGE_KEYS.RETENTION_BATCHES, JSON.stringify(enriched));
      }
      if (data.orders) {
        const enriched = data.orders.map(o => ({
          ...o,
          timestamp: o.timestamp || o.updatedAt || o.createdAt || now,
        }));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(enriched));
      }
      if (data.expenses) {
        const enriched = data.expenses.map(e => ({
          ...e,
          timestamp: e.timestamp || e.updatedAt || e.createdAt || now,
        }));
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(enriched));
      }
      if (data.historyRecords && Array.isArray(data.historyRecords)) {
        this.saveHistoryRecords(data.historyRecords);
      }
    } catch (e) {
      console.error('Error saving all data:', e);
    }
  },

  // RESET / DEMO DATA HELPERS
  clearAllData(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SHIPPING_BATCHES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.RETENTION_BATCHES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    } catch (e) {
      console.error('Error clearing all data:', e);
    }
  },

  loadDemoData(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem(STORAGE_KEYS.SHIPPING_BATCHES, JSON.stringify(INITIAL_SHIPPING_BATCHES));
      localStorage.setItem(STORAGE_KEYS.RETENTION_BATCHES, JSON.stringify(INITIAL_RETENTION_BATCHES));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    } catch (e) {
      console.error('Error loading demo data:', e);
    }
  },

  // CONFIG & CURRENCY
  getSheetsConfig(): GoogleSheetsConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading sheets config:', e);
    }
    return {
      spreadsheetId: null,
      spreadsheetName: 'StockFlow - Almacén y Finanzas',
      spreadsheetUrl: null,
      lastSyncedAt: null,
      autoSync: true,
    };
  },

  saveSheetsConfig(config: GoogleSheetsConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving sheets config:', e);
    }
  },

  getCurrency(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || '$';
  },

  setCurrency(symbol: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, symbol);
  },

  getAppSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          appName: parsed.appName || 'Vincit Omnia',
          appSubtitle: parsed.appSubtitle || 'Accesorios y Más',
          theme: parsed.theme || 'amber',
          customAccentColor: parsed.customAccentColor || '#f59e0b',
          currency: parsed.currency || '$',
          paymentDetails: parsed.paymentDetails
            ? { ...DEFAULT_PAYMENT_DETAILS, ...parsed.paymentDetails }
            : DEFAULT_PAYMENT_DETAILS,
          darkMode: parsed.darkMode ?? false,
          themeMode: parsed.themeMode || (parsed.darkMode ? 'dark' : 'light'),
          customLogoUrl: parsed.customLogoUrl || undefined,
          customLogoType: parsed.customLogoType || 'default',
          iconSize: parsed.iconSize || 'lg',
          fontStyle: parsed.fontStyle || 'serif',
          density: parsed.density || 'comfortable',
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : DEFAULT_PRODUCT_CATEGORIES,
        };
      }
    } catch (e) {
      console.error('Error reading app settings:', e);
    }
    return {
      appName: 'Vincit Omnia',
      appSubtitle: 'Accesorios y Más',
      theme: 'amber',
      customAccentColor: '#f59e0b',
      currency: '$',
      paymentDetails: DEFAULT_PAYMENT_DETAILS,
      darkMode: false,
      themeMode: 'light',
      customLogoType: 'default',
      iconSize: 'lg',
      fontStyle: 'serif',
      density: 'comfortable',
      categories: DEFAULT_PRODUCT_CATEGORIES,
    };
  },

  saveAppSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
      if (settings.currency) {
        localStorage.setItem(STORAGE_KEYS.CURRENCY, settings.currency);
      }
    } catch (e) {
      console.error('Error saving app settings:', e);
    }
  },

  getCategories(): string[] {
    const settings = this.getAppSettings();
    return Array.isArray(settings.categories) && settings.categories.length > 0 ? settings.categories : DEFAULT_PRODUCT_CATEGORIES;
  },

  saveCategories(categories: string[]): void {
    const settings = this.getAppSettings();
    this.saveAppSettings({
      ...settings,
      categories,
    });
  },

  addCategory(newCategory: string): string[] {
    const clean = newCategory.trim();
    if (!clean) return this.getCategories();
    const current = this.getCategories();
    if (!current.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      const updated = [...current, clean];
      this.saveCategories(updated);
      return updated;
    }
    return current;
  },

  deleteCategory(categoryToDelete: string): string[] {
    const current = this.getCategories();
    const updated = current.filter((c) => c.toLowerCase() !== categoryToDelete.toLowerCase());
    this.saveCategories(updated);
    return updated;
  },

  getAllData(): {
    products: Product[];
    shippingBatches: ShippingBatch[];
    retentionBatches: RetentionBatch[];
    orders: SaleOrder[];
    expenses: Expense[];
    historyRecords?: HistoryRecord[];
    lastSyncedAt?: string;
  } {
    return {
      products: this.getProducts(),
      shippingBatches: this.getShippingBatches(),
      retentionBatches: this.getRetentionBatches(),
      orders: this.getOrders(),
      expenses: this.getExpenses(),
      historyRecords: this.getHistoryRecords(),
      lastSyncedAt: this.getSheetsConfig().lastSyncedAt || undefined,
    };
  },

  hasPendingSync(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) === 'true';
    } catch {
      return false;
    }
  },

  setPendingSync(pending: boolean): void {
    try {
      if (pending) {
        localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
      }
    } catch (e) {
      console.error('Error setting pending sync flag:', e);
    }
  },

  // HISTORIAL Y TRAZABILIDAD PERSISTENTE
  getHistoryRecords(): HistoryRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading history records:', e);
    }

    // Inicialización automática si aún no hay registros guardados
    const initialList: HistoryRecord[] = [];
    const products = this.getProducts();
    const orders = this.getOrders();
    const expenses = this.getExpenses();
    const curr = this.getCurrency();

    // 1. Entradas y primer cambio de productos existentes
    products.forEach((p) => {
      const dateMs = new Date(p.createdAt || p.updatedAt || Date.now()).getTime();
      initialList.push({
        id: `prod-in-${p.id}`,
        type: 'stock_in',
        title: `Ingreso de Stock: ${p.name}`,
        subtitle: `SKU: ${p.sku || 'N/A'} • Categoría: ${p.category || 'General'} • P. Venta: ${curr} ${(p.sellingPriceUnit || 0).toFixed(2)} • Inicial: ${p.stock || 0} uds.`,
        timestamp: p.createdAt || p.updatedAt || new Date().toISOString(),
        dateMs,
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        quantityChange: p.stock || 0,
        amount: (p.unitPriceCost || p.productPrice || 0) * (p.stock || 0),
        badgeText: (p.stock || 0) > 0 ? `${p.stock} en stock` : 'Sin inventario',
        badgeVariant: (p.stock || 0) > 0 ? 'success' : 'danger',
      });
    });

    // 2. Pedidos y ventas existentes
    orders.forEach((o) => {
      const totalUnits = (o.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
      const itemsSummary = (o.items || []).map((it) => `${it.productName} (x${it.quantity})`).join(', ');
      const dateMs = new Date(o.date).getTime() || 0;
      initialList.push({
        id: `sale-${o.id}`,
        type: 'sale',
        title: `Venta ${o.orderNumber || ''} • ${o.customerName || 'Cliente General'}`,
        subtitle: `${totalUnits} unid. deducida${totalUnits !== 1 ? 's' : ''} de almacén • ${itemsSummary || 'Venta de productos'}`,
        timestamp: o.date,
        dateMs,
        quantityChange: -totalUnits,
        amount: o.totalSale || 0,
        netProfit: o.netProfit,
        badgeText: o.paymentStatus === 'pagado' ? 'Pagado' : o.paymentStatus === 'parcial' ? 'Parcial' : 'Pendiente / Crédito',
        badgeVariant: o.paymentStatus === 'pagado' ? 'success' : o.paymentStatus === 'parcial' ? 'warning' : 'info',
        customer: o.customerName,
        itemsSummary,
      });
    });

    // 3. Gastos existentes
    expenses.forEach((e) => {
      const dateMs = new Date(e.date).getTime() || 0;
      initialList.push({
        id: `exp-${e.id}`,
        type: 'expense',
        title: `Gasto: ${e.concept || 'Gasto operativo'}`,
        subtitle: `Categoría: ${e.category || 'General'}${e.notes ? ` • ${e.notes}` : ''}`,
        timestamp: e.date,
        dateMs,
        amount: -(e.amount || 0),
        badgeText: e.category ? e.category.toUpperCase() : 'GASTO',
        badgeVariant: 'neutral',
      });
    });

    // Ordenar cronológicamente (más recientes primero)
    initialList.sort((a, b) => b.dateMs - a.dateMs);
    this.saveHistoryRecords(initialList);
    return initialList;
  },

  saveHistoryRecords(records: HistoryRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving history records:', e);
    }
  },

  addHistoryRecord(record: Omit<HistoryRecord, 'id' | 'dateMs'> & { id?: string; dateMs?: number }): HistoryRecord {
    const records = this.getHistoryRecords();
    const now = new Date().toISOString();
    const timestamp = record.timestamp || now;
    const dateMs = record.dateMs || new Date(timestamp).getTime() || Date.now();
    const newRecord: HistoryRecord = {
      ...record,
      id: record.id || `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      dateMs,
    };
    records.unshift(newRecord);
    this.saveHistoryRecords(records);
    return newRecord;
  },

  deleteHistoryRecord(recordId: string): void {
    const records = this.getHistoryRecords().filter((r) => r.id !== recordId);
    this.saveHistoryRecords(records);
  },

  clearHistoryRecords(): void {
    this.saveHistoryRecords([]);
  },
};
