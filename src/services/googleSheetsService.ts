import { Product, SaleOrder, Expense, ShippingBatch, RetentionBatch, AppSettings, HistoryRecord } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  lastSyncedAt: string;
}

export interface DriveSpreadsheetItem {
  id: string;
  name: string;
  url: string;
  modifiedTime: string;
  createdTime?: string;
  productsCount?: number;
  ordersCount?: number;
  isStockFlowDatabase?: boolean;
}

export interface FullSyncData {
  products: Product[];
  shippingBatches: ShippingBatch[];
  retentionBatches: RetentionBatch[];
  orders: SaleOrder[];
  expenses: Expense[];
  historyRecords?: HistoryRecord[];
  settings?: AppSettings;
  lastSyncedAt?: string;
}

export const googleSheetsService = {
  /**
   * Searches the user's Google Drive for existing StockFlow/Vincit Omnia databases.
   * Solves multi-device desync by discovering existing spreadsheets instead of creating duplicates.
   */
  async findUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetItem[]> {
    try {
      const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id, name, webViewLink, modifiedTime, createdTime, description)&pageSize=30`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        console.warn('Could not query Google Drive API files:', res.status);
        return [];
      }

      const data = await res.json();
      const files: any[] = data.files || [];

      return files.map((f) => {
        const nameLower = (f.name || '').toLowerCase();
        const descLower = (f.description || '').toLowerCase();
        const isStockFlowDatabase =
          nameLower.includes('base de datos') ||
          nameLower.includes('stockflow') ||
          nameLower.includes('vincit') ||
          nameLower.includes('inventario') ||
          nameLower.includes('almacén') ||
          nameLower.includes('almacen') ||
          descLower.includes('stockflow');

        return {
          id: f.id,
          name: f.name || 'Hoja de Cálculo sin nombre',
          url: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
          modifiedTime: f.modifiedTime || new Date().toISOString(),
          createdTime: f.createdTime,
          isStockFlowDatabase,
        };
      });
    } catch (err) {
      console.warn('Error in findUserSpreadsheets:', err);
      return [];
    }
  },

  /**
   * Inspects a spreadsheet to quickly count existing products and orders.
   * Allows users to distinguish between active databases and empty/duplicate ones.
   */
  async getSpreadsheetSummary(
    accessToken: string,
    spreadsheetId: string
  ): Promise<{ productsCount: number; ordersCount: number; lastSyncedAt?: string; hasMetadata: boolean }> {
    try {
      const ranges = [
        'INVENTARIO_PRODUCTOS!A2:A200',
        'VENTAS_PEDIDOS!A2:A200',
        '_STOCKFLOW_SYNC_METADATA!A1:B5',
      ];
      const rangeParams = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangeParams}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        return { productsCount: 0, ordersCount: 0, hasMetadata: false };
      }

      const data = await res.json();
      const valueRanges = data.valueRanges || [];

      const productRows = valueRanges[0]?.values || [];
      const orderRows = valueRanges[1]?.values || [];
      const metadataRows = valueRanges[2]?.values || [];

      let lastSyncedAt: string | undefined;
      const syncRow = metadataRows.find((r: string[]) => r[0] === 'LAST_SYNCED_AT');
      if (syncRow && syncRow[1]) {
        lastSyncedAt = syncRow[1];
      }

      return {
        productsCount: productRows.length,
        ordersCount: orderRows.length,
        lastSyncedAt,
        hasMetadata: metadataRows.length > 0,
      };
    } catch {
      return { productsCount: 0, ordersCount: 0, hasMetadata: false };
    }
  },

  /**
   * Creates a dedicated spreadsheet with tabs for Products, Shipping Batches, Retention, Sales, Expenses, Historial and Sync Metadata
   */
  async createSpreadsheet(accessToken: string, title = 'INVENTARIO VINCINT OMNIA'): Promise<{ id: string; url: string; name: string }> {
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: [
          { properties: { title: 'INVENTARIO_PRODUCTOS' } },
          { properties: { title: 'CALCULO_DE_ENVIO' } },
          { properties: { title: 'CALCULO_DE_RETENCION' } },
          { properties: { title: 'VENTAS_PEDIDOS' } },
          { properties: { title: 'GASTOS_OPERATIVOS' } },
          { properties: { title: 'HISTORIAL_ACTIVIDAD' } },
          { properties: { title: '_STOCKFLOW_SYNC_METADATA' } },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Error al crear hoja de cálculo (${response.status})`);
    }

    const data = await response.json();
    const id = data.spreadsheetId;
    const url = `https://docs.google.com/spreadsheets/d/${id}/edit`;

    // Mark description in Google Drive so it's always recognized as StockFlow Master Database
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'StockFlow Master Database - Base de Datos Sincronizada Vincit Omnia',
        }),
      });
    } catch {
      // Ignore non-fatal metadata write
    }

    return {
      id,
      url,
      name: title,
    };
  },

  /**
   * Pushes full inventory, shipping batches, retention, sales orders, expenses, history records, and a sync snapshot to Google Sheets
   */
  async syncAllToSheets(
    accessToken: string,
    spreadsheetId: string,
    data: {
      products: Product[];
      shippingBatches: ShippingBatch[];
      retentionBatches: RetentionBatch[];
      orders: SaleOrder[];
      expenses: Expense[];
      historyRecords?: HistoryRecord[];
    }
  ): Promise<SyncResult> {
    const nowIso = new Date().toISOString();

    // 1. Prepare INVENTARIO_PRODUCTOS sheet (matching the user's base de datos)
    const productHeaders = [
      'N',
      'DESCRIPCIÓN',
      'IMAGEN',
      'ITEMS',
      'CANTIDAD QUE TRAE EL PRODUCTO',
      'PRECIO DEL PRODUCTO',
      'PRECIO DEL PRODUCTO TOTAL',
      'PRECIO C/U',
      'CARTÓN',
      'BOLSITA',
      'LOGO',
      'IMPUESTO TAX',
      'ENVIO',
      'COTIZACIÓN TOTAL',
      'COTIZACIÓN C/U',
      'PRECIO UNITARIO',
      'MONTO BRUTO',
      'GANANCIA',
      '% GANANCIA',
      'STOCK ACTUAL',
      'LOTE DE ENVÍO VINCULADO',
      'ID_SISTEMA',
      'TIMESTAMP_ACTUALIZACION',
    ];

    const productRows = data.products.map((p, idx) => {
      const batch = data.shippingBatches.find((b) => b.id === p.shippingBatchId);
      return [
        p.itemNumber || idx + 1,
        p.name,
        p.photoUrl || '',
        p.itemsCount || 1,
        p.piecesPerProduct || 1,
        p.productPrice || 0,
        p.totalProductPrice || 0,
        p.unitPriceCost || 0,
        p.packagingCarton || 0,
        p.packagingBolsita || 0,
        p.packagingLogo || 0,
        p.retentionCostUnit || 0,
        p.shippingCostUnit || 0,
        p.totalQuotation || 0,
        p.unitQuotation || 0,
        p.sellingPriceUnit || 0,
        p.grossAmount || 0,
        p.netProfit || 0,
        `${(p.profitMarginPercent || 0).toFixed(2)}%`,
        p.stock || 0,
        batch ? `Lote ${batch.batchNumber} (${batch.name})` : 'Manual',
        p.id,
        p.updatedAt || p.createdAt || nowIso,
      ];
    });

    // 2. Prepare CALCULO_DE_ENVIO sheet (Lotes de envío)
    const shippingHeaders = [
      'N° PEDIDO / LOTE',
      'DESCRIPCIÓN LOTE',
      'CANTIDAD DE PRODUCTOS',
      'MONTO DE ENVIO NETO',
      'MONTO INDIVIDUAL (C/U)',
      'EMPRESA / COURIER',
      'FECHA',
      'NOTAS',
      'ID_LOTE',
      'TIMESTAMP_ACTUALIZACION',
    ];

    const shippingRows = data.shippingBatches.map((b) => [
      b.batchNumber,
      b.name,
      b.totalProducts,
      b.totalNetShipping,
      b.unitShipping,
      b.courier || '',
      new Date(b.date).toLocaleDateString(),
      b.notes || '',
      b.id,
      b.updatedAt || b.createdAt || b.date || nowIso,
    ]);

    // 3. Prepare CALCULO_DE_RETENCION (Impuesto Tax) sheet
    const retentionHeaders = [
      'N° PEDIDO / LOTE',
      'DESCRIPCIÓN',
      'CANTIDAD DE PRODUCTOS',
      'MONTO DE IMPUESTO TAX NETO',
      'MONTO INDIVIDUAL (C/U)',
      'FECHA',
      'ID_RETENCION',
      'TIMESTAMP_ACTUALIZACION',
    ];

    const retentionRows = data.retentionBatches.map((r) => [
      r.batchNumber,
      r.name,
      r.totalProducts,
      r.totalNetRetention,
      r.unitRetention,
      new Date(r.date).toLocaleDateString(),
      r.id,
      r.updatedAt || r.createdAt || r.date || nowIso,
    ]);

    // 4. Prepare VENTAS_PEDIDOS sheet
    const orderHeaders = [
      'ID',
      'N° Pedido',
      'Fecha',
      'Cliente',
      'Teléfono',
      'Productos Vendidos',
      'Total Venta ($)',
      'Costo Total ($)',
      'Ganancia Neta ($)',
      'Estado Envío',
      'Método Pago',
      'TIMESTAMP_ACTUALIZACION',
    ];

    const orderRows = data.orders.map((o) => [
      o.id,
      o.orderNumber,
      new Date(o.date).toLocaleDateString(),
      o.customerName,
      o.customerPhone || '',
      (o.items || []).map((i) => `${i.productName} (x${i.quantity})`).join(', '),
      o.totalSale,
      (o.totalProductCost || 0) + (o.totalShippingCost || 0) + (o.extraExpenses || 0),
      o.netProfit,
      o.shippingStatus,
      o.paymentMethod,
      o.updatedAt || o.createdAt || o.date || nowIso,
    ]);

    // 5. Prepare GASTOS_OPERATIVOS sheet
    const expenseHeaders = [
      'ID',
      'FECHA',
      'CONCEPTO',
      'MONTO ($)',
      'CATEGORÍA',
      'NOTAS',
      'TIMESTAMP_ACTUALIZACION',
    ];

    const expenseRows = data.expenses.map((e) => [
      e.id,
      new Date(e.date).toLocaleDateString(),
      e.concept || '',
      e.amount || 0,
      e.category || 'otro',
      e.notes || '',
      e.updatedAt || e.createdAt || e.date || nowIso,
    ]);

    // 6. Prepare HISTORIAL_ACTIVIDAD sheet (Historial persistente en la nube)
    const historyHeaders = [
      'N°',
      'FECHA Y HORA',
      'TIPO DE EVENTO',
      'TÍTULO',
      'DETALLE / NOTAS',
      'CAMBIO DE STOCK',
      'MONTO ($)',
      'GANANCIA NETA ($)',
      'CLIENTE',
      'PRODUCTO / SKU',
      'ETIQUETA / ESTADO',
      'ID_REGISTRO',
      'TIMESTAMP_ISO',
    ];

    const historyRows = (data.historyRecords || []).map((h, idx) => [
      idx + 1,
      new Date(h.timestamp || Date.now()).toLocaleString('es-ES'),
      h.type === 'product_created'
        ? 'Alta de Producto'
        : h.type === 'stock_add'
        ? 'Aumento de Stock'
        : h.type === 'stock_in'
        ? 'Ingreso a Almacén'
        : h.type === 'sale'
        ? 'Venta Realizada'
        : h.type === 'expense'
        ? 'Gasto Operativo'
        : h.type === 'stock_alert'
        ? 'Alerta de Stock'
        : h.type,
      h.title,
      h.subtitle || '',
      h.quantityChange != null ? (h.quantityChange > 0 ? `+${h.quantityChange}` : `${h.quantityChange}`) : '',
      h.amount != null ? h.amount : '',
      h.netProfit != null ? h.netProfit : '',
      h.customer || '',
      h.productName || h.sku ? `${h.productName || ''}${h.sku ? ` (${h.sku})` : ''}` : (h.itemsSummary || ''),
      h.badgeText || '',
      h.id,
      h.timestamp || nowIso,
    ]);

    // 7. Prepare _STOCKFLOW_SYNC_METADATA tab (Compact JSON state snapshot for 100% fidelity multi-device syncing)
    const metadataHeaders = ['CLAVE_METADATO', 'VALOR'];
    const snapshotObj = {
      version: 2,
      lastSyncedAt: nowIso,
      products: data.products,
      shippingBatches: data.shippingBatches,
      retentionBatches: data.retentionBatches,
      orders: data.orders,
      expenses: data.expenses,
      historyRecords: data.historyRecords || [],
    };

    const snapshotString = JSON.stringify(snapshotObj);
    // Split snapshot into <= 40000 char chunks to stay well below Google Sheets 50,000 char-per-cell limit
    const chunkSize = 40000;
    const chunks: string[] = [];
    for (let i = 0; i < snapshotString.length; i += chunkSize) {
      chunks.push(snapshotString.substring(i, i + chunkSize));
    }

    const metadataRows = [
      ['VERSION', '2'],
      ['LAST_SYNCED_AT', nowIso],
      ['PRODUCTS_COUNT', String(data.products.length)],
      ['ORDERS_COUNT', String(data.orders.length)],
      ['EXPENSES_COUNT', String(data.expenses.length)],
      ['HISTORY_COUNT', String((data.historyRecords || []).length)],
      ['CHUNKS_COUNT', String(chunks.length)],
      ...chunks.map((ch, idx) => [`PAYLOAD_CHUNK_${idx}`, ch]),
    ];

    // Ensure all 7 tabs exist
    await this.ensureSheetTabsExist(accessToken, spreadsheetId, [
      'INVENTARIO_PRODUCTOS',
      'CALCULO_DE_ENVIO',
      'CALCULO_DE_RETENCION',
      'VENTAS_PEDIDOS',
      'GASTOS_OPERATIVOS',
      'HISTORIAL_ACTIVIDAD',
      '_STOCKFLOW_SYNC_METADATA',
    ]);

    // Batch update values
    const updateRequests = [
      {
        range: 'INVENTARIO_PRODUCTOS!A1:W' + Math.max(2, productRows.length + 1),
        values: [productHeaders, ...productRows],
      },
      {
        range: 'CALCULO_DE_ENVIO!A1:J' + Math.max(2, shippingRows.length + 1),
        values: [shippingHeaders, ...shippingRows],
      },
      {
        range: 'CALCULO_DE_RETENCION!A1:H' + Math.max(2, retentionRows.length + 1),
        values: [retentionHeaders, ...retentionRows],
      },
      {
        range: 'VENTAS_PEDIDOS!A1:L' + Math.max(2, orderRows.length + 1),
        values: [orderHeaders, ...orderRows],
      },
      {
        range: 'GASTOS_OPERATIVOS!A1:G' + Math.max(2, expenseRows.length + 1),
        values: [expenseHeaders, ...expenseRows],
      },
      {
        range: 'HISTORIAL_ACTIVIDAD!A1:M' + Math.max(2, historyRows.length + 1),
        values: [historyHeaders, ...historyRows],
      },
      {
        range: '_STOCKFLOW_SYNC_METADATA!A1:B' + Math.max(2, metadataRows.length + 1),
        values: [metadataHeaders, ...metadataRows],
      },
    ];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: updateRequests,
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'Error al sincronizar con Google Sheets');
    }

    return {
      success: true,
      message: 'Sincronizado con éxito en tiempo real en todos tus dispositivos',
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      lastSyncedAt: nowIso,
    };
  },

  /**
   * Ensures specified tabs exist in the Google Sheet, creating any that are missing
   */
  async ensureSheetTabsExist(accessToken: string, spreadsheetId: string, sheetTitles: string[]): Promise<void> {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!metaRes.ok) return;

    const meta = await metaRes.json();
    const existingTitles = (meta.sheets || []).map((s: { properties: { title: string } }) => s.properties.title);

    const requests = [];
    for (const title of sheetTitles) {
      if (!existingTitles.includes(title)) {
        requests.push({
          addSheet: {
            properties: { title },
          },
        });
      }
    }

    if (requests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    }
  },

  /**
   * Imports all collections (products, shipping batches, retention, orders, expenses, history) from Google Sheets.
   * Enables any device signed into the same Gmail account to load the complete up-to-date cloud state.
   */
  async importAllFromSheet(accessToken: string, spreadsheetId: string): Promise<FullSyncData> {
    const ranges = [
      '_STOCKFLOW_SYNC_METADATA!A1:B60',
      'INVENTARIO_PRODUCTOS!A2:V500',
      'CALCULO_DE_ENVIO!A2:I100',
      'CALCULO_DE_RETENCION!A2:G100',
      'VENTAS_PEDIDOS!A2:K200',
      'GASTOS_OPERATIVOS!A2:F200',
      'HISTORIAL_ACTIVIDAD!A2:M500',
    ];

    const rangeParams = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangeParams}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Error al leer los datos de la hoja de cálculo (${res.status})`);
    }

    const json = await res.json();
    const valueRanges = json.valueRanges || [];

    const metadataRows: string[][] = valueRanges[0]?.values || [];
    const productRows: string[][] = valueRanges[1]?.values || [];
    const shippingRows: string[][] = valueRanges[2]?.values || [];
    const retentionRows: string[][] = valueRanges[3]?.values || [];
    const orderRows: string[][] = valueRanges[4]?.values || [];
    const expenseRows: string[][] = valueRanges[5]?.values || [];
    const historyRows: string[][] = valueRanges[6]?.values || [];

    // Attempt to reconstruct from the JSON snapshot first (fast, lossless)
    if (metadataRows.length > 0) {
      try {
        const chunkRows = metadataRows.filter((r) => r[0] && r[0].startsWith('PAYLOAD_CHUNK_'));
        chunkRows.sort((a, b) => {
          const idxA = parseInt(a[0].replace('PAYLOAD_CHUNK_', ''), 10) || 0;
          const idxB = parseInt(b[0].replace('PAYLOAD_CHUNK_', ''), 10) || 0;
          return idxA - idxB;
        });

        if (chunkRows.length > 0) {
          const combinedJson = chunkRows.map((r) => r[1] || '').join('');
          const parsed = JSON.parse(combinedJson);
          if (Array.isArray(parsed.products)) {
            const now = new Date().toISOString();
            return {
              products: parsed.products.map((p: any) => ({
                ...p,
                timestamp: p.timestamp || p.updatedAt || p.createdAt || now,
                updatedAt: p.updatedAt || p.timestamp || now,
              })),
              shippingBatches: (Array.isArray(parsed.shippingBatches) ? parsed.shippingBatches : []).map((b: any) => ({
                ...b,
                timestamp: b.timestamp || b.updatedAt || b.createdAt || b.date || now,
                updatedAt: b.updatedAt || b.timestamp || now,
              })),
              retentionBatches: (Array.isArray(parsed.retentionBatches) ? parsed.retentionBatches : []).map((r: any) => ({
                ...r,
                timestamp: r.timestamp || r.updatedAt || r.createdAt || r.date || now,
                updatedAt: r.updatedAt || r.timestamp || now,
              })),
              orders: (Array.isArray(parsed.orders) ? parsed.orders : []).map((o: any) => ({
                ...o,
                timestamp: o.timestamp || o.updatedAt || o.createdAt || o.date || now,
                updatedAt: o.updatedAt || o.timestamp || now,
              })),
              expenses: (Array.isArray(parsed.expenses) ? parsed.expenses : []).map((e: any) => ({
                ...e,
                timestamp: e.timestamp || e.updatedAt || e.createdAt || e.date || now,
                updatedAt: e.updatedAt || e.timestamp || now,
              })),
              historyRecords: (Array.isArray(parsed.historyRecords) ? parsed.historyRecords : []).map((h: any) => ({
                ...h,
                timestamp: h.timestamp || now,
                dateMs: h.dateMs || new Date(h.timestamp || now).getTime(),
              })),
              lastSyncedAt: parsed.lastSyncedAt || new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn('Metadata snapshot parse failed, falling back to tabular parsing:', err);
      }
    }

    // Fallback: parse tabular data from individual sheets
    const nowIso = new Date().toISOString();

    const parsedShippingBatches: ShippingBatch[] = shippingRows
      .filter((r) => r && r[1])
      .map((r, idx) => ({
        id: r[8] || `batch-ship-imported-${idx}`,
        batchNumber: parseInt(r[0], 10) || idx + 1,
        name: r[1] || `Lote ${idx + 1}`,
        totalProducts: parseInt(r[2], 10) || 0,
        totalNetShipping: parseFloat(r[3]) || 0,
        unitShipping: parseFloat(r[4]) || 0,
        courier: r[5] || undefined,
        date: r[6] ? new Date(r[6]).toISOString() : nowIso,
        notes: r[7] || undefined,
        createdAt: r[9] || nowIso,
        updatedAt: r[9] || nowIso,
        timestamp: r[9] || nowIso,
      }));

    const parsedRetentionBatches: RetentionBatch[] = retentionRows
      .filter((r) => r && r[1])
      .map((r, idx) => ({
        id: r[6] || `batch-ret-imported-${idx}`,
        batchNumber: parseInt(r[0], 10) || idx + 1,
        name: r[1] || `Lote Retención ${idx + 1}`,
        totalProducts: parseInt(r[2], 10) || 0,
        totalNetRetention: parseFloat(r[3]) || 0,
        unitRetention: parseFloat(r[4]) || 0,
        date: r[5] ? new Date(r[5]).toISOString() : nowIso,
        createdAt: r[7] || nowIso,
        updatedAt: r[7] || nowIso,
        timestamp: r[7] || nowIso,
      }));

    const parsedProducts: Product[] = productRows
      .filter((r) => r && r.length > 1 && r[1])
      .map((r, idx) => ({
        id: r[21] || `prod-imported-${idx}-${Date.now()}`,
        itemNumber: parseInt(r[0], 10) || idx + 1,
        sku: `SKU-${1000 + idx}`,
        name: r[1] || 'Producto sin nombre',
        category: 'Joyería & Accesorios',
        photoUrl: r[2] || '',
        itemsCount: parseInt(r[3], 10) || 1,
        piecesPerProduct: parseInt(r[4], 10) || 1,
        productPrice: parseFloat(r[5]) || 0,
        totalProductPrice: parseFloat(r[6]) || 0,
        unitPriceCost: parseFloat(r[7]) || 0,
        packagingCarton: parseFloat(r[8]) || 0,
        packagingBolsita: parseFloat(r[9]) || 0,
        packagingLogo: parseFloat(r[10]) || 0,
        retentionCostUnit: parseFloat(r[11]) || 0,
        shippingCostUnit: parseFloat(r[12]) || 0,
        totalQuotation: parseFloat(r[13]) || 0,
        unitQuotation: parseFloat(r[14]) || 0,
        sellingPriceUnit: parseFloat(r[15]) || 0,
        grossAmount: parseFloat(r[16]) || 0,
        netProfit: parseFloat(r[17]) || 0,
        profitMarginPercent: parseFloat(String(r[18] || '0').replace('%', '')) || 0,
        stock: parseInt(r[19], 10) || 0,
        minStock: 5,
        location: '',
        supplier: 'Vincit Omnia Direct',
        createdAt: r[22] || nowIso,
        updatedAt: r[22] || nowIso,
        timestamp: r[22] || nowIso,
      }));

    const parsedOrders: SaleOrder[] = orderRows
      .filter((r) => r && r[1])
      .map((r, idx) => ({
        id: r[0] || `ord-imported-${idx}-${Date.now()}`,
        orderNumber: r[1] || `PED-${1000 + idx}`,
        date: r[2] ? new Date(r[2]).toISOString() : nowIso,
        customerName: r[3] || 'Cliente General',
        customerPhone: r[4] || '',
        items: [],
        totalSale: parseFloat(r[6]) || 0,
        totalProductCost: parseFloat(r[7]) || 0,
        totalShippingCost: 0,
        extraExpenses: 0,
        netProfit: parseFloat(r[8]) || 0,
        profitMarginPercent: (parseFloat(r[7]) || 0) > 0 ? ((parseFloat(r[8]) || 0) / (parseFloat(r[7]) || 1)) * 100 : 0,
        shippingStatus: (r[9] as any) || 'entregado',
        paymentMethod: (r[10] as any) || 'efectivo',
        paymentStatus: 'pagado',
        createdAt: r[11] || nowIso,
        updatedAt: r[11] || nowIso,
        timestamp: r[11] || nowIso,
      }));

    const parsedExpenses: Expense[] = expenseRows
      .filter((r) => r && r[2])
      .map((r, idx) => ({
        id: r[0] || `exp-imported-${idx}-${Date.now()}`,
        date: r[1] ? new Date(r[1]).toISOString() : nowIso,
        concept: r[2] || 'Gasto operativo',
        amount: parseFloat(r[3]) || 0,
        category: (r[4] as any) || 'otro',
        notes: r[5] || '',
        createdAt: r[6] || nowIso,
        updatedAt: r[6] || nowIso,
        timestamp: r[6] || nowIso,
      }));

    const parsedHistory: HistoryRecord[] = historyRows
      .filter((r) => r && r[3])
      .map((r, idx) => {
        const rawType = r[2] || '';
        let mappedType: HistoryRecord['type'] = 'stock_in';
        if (rawType.includes('Alta') || rawType === 'product_created') mappedType = 'product_created';
        else if (rawType.includes('Aumento') || rawType === 'stock_add') mappedType = 'stock_add';
        else if (rawType.includes('Venta') || rawType === 'sale') mappedType = 'sale';
        else if (rawType.includes('Gasto') || rawType === 'expense') mappedType = 'expense';
        else if (rawType.includes('Alerta') || rawType === 'stock_alert') mappedType = 'stock_alert';

        const timestamp = r[12] || nowIso;
        return {
          id: r[11] || `hist-imported-${idx}-${Date.now()}`,
          type: mappedType,
          title: r[3] || 'Registro Histórico',
          subtitle: r[4] || '',
          quantityChange: r[5] ? parseInt(r[5].replace('+', ''), 10) : undefined,
          amount: r[6] ? parseFloat(r[6]) : undefined,
          netProfit: r[7] ? parseFloat(r[7]) : undefined,
          customer: r[8] || undefined,
          itemsSummary: r[9] || undefined,
          badgeText: r[10] || 'Registrado',
          badgeVariant: mappedType === 'sale' ? 'info' : mappedType === 'expense' ? 'warning' : 'success',
          timestamp,
          dateMs: new Date(timestamp).getTime() || Date.now(),
        };
      });

    return {
      products: parsedProducts,
      shippingBatches: parsedShippingBatches,
      retentionBatches: parsedRetentionBatches,
      orders: parsedOrders,
      expenses: parsedExpenses,
      historyRecords: parsedHistory,
      lastSyncedAt: nowIso,
    };
  },

  /**
   * Clears all rows in the spreadsheet across all tabs, keeping clean header rows.
   * Allows the user to wipe cloud data and start fresh or create another database.
   */
  async clearCloudData(accessToken: string, spreadsheetId: string): Promise<boolean> {
    const emptyDataset = {
      products: [],
      shippingBatches: [],
      retentionBatches: [],
      orders: [],
      expenses: [],
      historyRecords: [],
    };
    await this.syncAllToSheets(accessToken, spreadsheetId, emptyDataset);
    return true;
  },

  /**
   * Backwards-compatible import method for products only
   */
  async importProductsFromSheet(accessToken: string, spreadsheetId: string): Promise<Product[]> {
    const full = await this.importAllFromSheet(accessToken, spreadsheetId);
    return full.products;
  },
};
