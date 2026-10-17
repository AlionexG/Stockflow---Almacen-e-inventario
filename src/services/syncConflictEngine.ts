import { Product, ShippingBatch, RetentionBatch, SaleOrder, Expense, HistoryRecord } from '../types';
import { FullSyncData } from './googleSheetsService';

export interface SyncComparisonSummary {
  hasDifferences: boolean;
  localCounts: { products: number; shippingBatches: number; retentionBatches: number; orders: number; expenses: number };
  cloudCounts: { products: number; shippingBatches: number; retentionBatches: number; orders: number; expenses: number };
  localLatestTimestamp?: string;
  cloudLatestTimestamp?: string;
  newerSource: 'local' | 'cloud' | 'equal';
  mergePreview: {
    totalMergedProducts: number;
    newProductsFromCloud: number;
    newProductsFromLocal: number;
    updatedProductsByTimestamp: number;
    totalMergedOrders: number;
    newOrdersFromCloud: number;
    newOrdersFromLocal: number;
    totalMergedExpenses: number;
  };
}

export const syncConflictEngine = {
  /**
   * Finds the latest timestamp (timestamp, updatedAt, createdAt, or date) across all items in a dataset
   */
  getLatestTimestamp(data: FullSyncData): string | undefined {
    let latestMs = 0;
    const checkItem = (item?: { timestamp?: string; updatedAt?: string; createdAt?: string; date?: string }) => {
      if (!item) return;
      const ts = item.timestamp || item.updatedAt || item.createdAt || item.date;
      if (ts) {
        const ms = new Date(ts).getTime();
        if (!isNaN(ms) && ms > latestMs) {
          latestMs = ms;
        }
      }
    };

    (data.products || []).forEach(checkItem);
    (data.orders || []).forEach(checkItem);
    (data.expenses || []).forEach(checkItem);
    (data.shippingBatches || []).forEach(checkItem);
    (data.retentionBatches || []).forEach(checkItem);
    (data.historyRecords || []).forEach(checkItem);

    if (data.lastSyncedAt) {
      const ms = new Date(data.lastSyncedAt).getTime();
      if (!isNaN(ms) && ms > latestMs) latestMs = ms;
    }

    return latestMs > 0 ? new Date(latestMs).toISOString() : undefined;
  },

  /**
   * Compares local data with cloud data to determine if a conflict/difference exists
   * and which device holds newer updates.
   */
  compare(local: FullSyncData, cloud: FullSyncData): SyncComparisonSummary {
    const localLatest = this.getLatestTimestamp(local);
    const cloudLatest = this.getLatestTimestamp(cloud);

    const localMs = localLatest ? new Date(localLatest).getTime() : 0;
    const cloudMs = cloudLatest ? new Date(cloudLatest).getTime() : 0;

    let newerSource: 'local' | 'cloud' | 'equal' = 'equal';
    if (Math.abs(localMs - cloudMs) > 2000) {
      newerSource = localMs > cloudMs ? 'local' : 'cloud';
    }

    // Merge preview metrics for products
    const localProductMap = new Map((local.products || []).map((p) => [p.id || p.sku || p.name, p]));
    const cloudProductMap = new Map((cloud.products || []).map((p) => [p.id || p.sku || p.name, p]));

    let newProductsFromCloud = 0;
    let newProductsFromLocal = 0;
    let updatedProductsByTimestamp = 0;

    for (const [key, cloudP] of cloudProductMap.entries()) {
      if (!localProductMap.has(key)) {
        newProductsFromCloud++;
      } else {
        const localP = localProductMap.get(key)!;
        const cloudTime = new Date(cloudP.timestamp || cloudP.updatedAt || cloudP.createdAt || 0).getTime();
        const localTime = new Date(localP.timestamp || localP.updatedAt || localP.createdAt || 0).getTime();
        if (Math.abs(cloudTime - localTime) > 2000) {
          updatedProductsByTimestamp++;
        }
      }
    }

    for (const [key] of localProductMap.entries()) {
      if (!cloudProductMap.has(key)) {
        newProductsFromLocal++;
      }
    }

    // Merge preview metrics for orders
    const localOrderMap = new Map((local.orders || []).map((o) => [o.id || o.orderNumber, o]));
    const cloudOrderMap = new Map((cloud.orders || []).map((o) => [o.id || o.orderNumber, o]));

    let newOrdersFromCloud = 0;
    let newOrdersFromLocal = 0;
    for (const [key] of cloudOrderMap.entries()) {
      if (!localOrderMap.has(key)) newOrdersFromCloud++;
    }
    for (const [key] of localOrderMap.entries()) {
      if (!cloudOrderMap.has(key)) newOrdersFromLocal++;
    }

    const hasDifferences =
      newProductsFromCloud > 0 ||
      newProductsFromLocal > 0 ||
      updatedProductsByTimestamp > 0 ||
      newOrdersFromCloud > 0 ||
      newOrdersFromLocal > 0 ||
      (local.expenses || []).length !== (cloud.expenses || []).length ||
      (local.shippingBatches || []).length !== (cloud.shippingBatches || []).length;

    return {
      hasDifferences,
      localCounts: {
        products: (local.products || []).length,
        shippingBatches: (local.shippingBatches || []).length,
        retentionBatches: (local.retentionBatches || []).length,
        orders: (local.orders || []).length,
        expenses: (local.expenses || []).length,
      },
      cloudCounts: {
        products: (cloud.products || []).length,
        shippingBatches: (cloud.shippingBatches || []).length,
        retentionBatches: (cloud.retentionBatches || []).length,
        orders: (cloud.orders || []).length,
        expenses: (cloud.expenses || []).length,
      },
      localLatestTimestamp: localLatest,
      cloudLatestTimestamp: cloudLatest,
      newerSource,
      mergePreview: {
        totalMergedProducts: localProductMap.size + newProductsFromCloud,
        newProductsFromCloud,
        newProductsFromLocal,
        updatedProductsByTimestamp,
        totalMergedOrders: localOrderMap.size + newOrdersFromCloud,
        newOrdersFromCloud,
        newOrdersFromLocal,
        totalMergedExpenses: Math.max((local.expenses || []).length, (cloud.expenses || []).length),
      },
    };
  },

  /**
   * Intelligently merges local and cloud datasets by comparing timestamp of each entity.
   * Prioritizes the most recently updated item while preserving records unique to either device.
   */
  merge(local: FullSyncData, cloud: FullSyncData): FullSyncData {
    const nowIso = new Date().toISOString();

    // 1. Merge Products: match by ID or SKU or Name
    const productMap = new Map<string, Product>();
    const allProducts = [...(cloud.products || []), ...(local.products || [])];

    for (const p of allProducts) {
      const key = p.id || p.sku || p.name;
      if (!productMap.has(key)) {
        productMap.set(key, { ...p, updatedAt: p.updatedAt || nowIso, timestamp: p.timestamp || p.updatedAt || nowIso });
      } else {
        const existing = productMap.get(key)!;
        const existingTime = new Date(existing.timestamp || existing.updatedAt || existing.createdAt || 0).getTime();
        const incomingTime = new Date(p.timestamp || p.updatedAt || p.createdAt || 0).getTime();
        if (incomingTime > existingTime) {
          productMap.set(key, { ...p, updatedAt: p.updatedAt || nowIso, timestamp: p.timestamp || p.updatedAt || nowIso });
        }
      }
    }
    const mergedProducts = Array.from(productMap.values());

    // 2. Merge Shipping Batches
    const shippingMap = new Map<string, ShippingBatch>();
    const allShipping = [...(cloud.shippingBatches || []), ...(local.shippingBatches || [])];
    for (const b of allShipping) {
      const key = b.id || String(b.batchNumber);
      if (!shippingMap.has(key)) {
        shippingMap.set(key, { ...b, updatedAt: b.updatedAt || nowIso, timestamp: b.timestamp || b.updatedAt || nowIso });
      } else {
        const existing = shippingMap.get(key)!;
        const existingTime = new Date(existing.timestamp || existing.updatedAt || existing.createdAt || existing.date || 0).getTime();
        const incomingTime = new Date(b.timestamp || b.updatedAt || b.createdAt || b.date || 0).getTime();
        if (incomingTime > existingTime) {
          shippingMap.set(key, { ...b, updatedAt: b.updatedAt || nowIso, timestamp: b.timestamp || b.updatedAt || nowIso });
        }
      }
    }
    const mergedShipping = Array.from(shippingMap.values());

    // 3. Merge Retention Batches
    const retentionMap = new Map<string, RetentionBatch>();
    const allRetention = [...(cloud.retentionBatches || []), ...(local.retentionBatches || [])];
    for (const r of allRetention) {
      const key = r.id || String(r.batchNumber);
      if (!retentionMap.has(key)) {
        retentionMap.set(key, { ...r, updatedAt: r.updatedAt || nowIso, timestamp: r.timestamp || r.updatedAt || nowIso });
      } else {
        const existing = retentionMap.get(key)!;
        const existingTime = new Date(existing.timestamp || existing.updatedAt || existing.createdAt || existing.date || 0).getTime();
        const incomingTime = new Date(r.timestamp || r.updatedAt || r.createdAt || r.date || 0).getTime();
        if (incomingTime > existingTime) {
          retentionMap.set(key, { ...r, updatedAt: r.updatedAt || nowIso, timestamp: r.timestamp || r.updatedAt || nowIso });
        }
      }
    }
    const mergedRetention = Array.from(retentionMap.values());

    // 4. Merge Orders
    const orderMap = new Map<string, SaleOrder>();
    const allOrders = [...(cloud.orders || []), ...(local.orders || [])];
    for (const o of allOrders) {
      const key = o.id || o.orderNumber;
      if (!orderMap.has(key)) {
        orderMap.set(key, { ...o, updatedAt: o.updatedAt || nowIso, timestamp: o.timestamp || o.updatedAt || nowIso });
      } else {
        const existing = orderMap.get(key)!;
        const existingTime = new Date(existing.timestamp || existing.updatedAt || existing.createdAt || existing.date || 0).getTime();
        const incomingTime = new Date(o.timestamp || o.updatedAt || o.createdAt || o.date || 0).getTime();
        if (incomingTime > existingTime) {
          orderMap.set(key, { ...o, updatedAt: o.updatedAt || nowIso, timestamp: o.timestamp || o.updatedAt || nowIso });
        }
      }
    }
    const mergedOrders = Array.from(orderMap.values());

    // 5. Merge Expenses
    const expenseMap = new Map<string, Expense>();
    const allExpenses = [...(cloud.expenses || []), ...(local.expenses || [])];
    for (const e of allExpenses) {
      const key = e.id || `${e.concept}_${e.date}_${e.amount}`;
      if (!expenseMap.has(key)) {
        expenseMap.set(key, { ...e, updatedAt: e.updatedAt || nowIso, timestamp: e.timestamp || e.updatedAt || nowIso });
      } else {
        const existing = expenseMap.get(key)!;
        const existingTime = new Date(existing.timestamp || existing.updatedAt || existing.createdAt || existing.date || 0).getTime();
        const incomingTime = new Date(e.timestamp || e.updatedAt || e.createdAt || e.date || 0).getTime();
        if (incomingTime > existingTime) {
          expenseMap.set(key, { ...e, updatedAt: e.updatedAt || nowIso, timestamp: e.timestamp || e.updatedAt || nowIso });
        }
      }
    }
    const mergedExpenses = Array.from(expenseMap.values());

    // 6. Merge History Records (Preserve all historical audit events across devices)
    const historyMap = new Map<string, HistoryRecord>();
    const allHistory = [...(cloud.historyRecords || []), ...(local.historyRecords || [])];
    for (const h of allHistory) {
      const key = h.id;
      if (!historyMap.has(key)) {
        historyMap.set(key, h);
      } else {
        const existing = historyMap.get(key)!;
        const existingTime = existing.dateMs || new Date(existing.timestamp).getTime() || 0;
        const incomingTime = h.dateMs || new Date(h.timestamp).getTime() || 0;
        if (incomingTime >= existingTime) {
          historyMap.set(key, h);
        }
      }
    }
    const mergedHistory = Array.from(historyMap.values()).sort((a, b) => {
      const timeA = a.dateMs || new Date(a.timestamp).getTime() || 0;
      const timeB = b.dateMs || new Date(b.timestamp).getTime() || 0;
      return timeB - timeA;
    });

    return {
      products: mergedProducts,
      shippingBatches: mergedShipping,
      retentionBatches: mergedRetention,
      orders: mergedOrders,
      expenses: mergedExpenses,
      historyRecords: mergedHistory,
      lastSyncedAt: nowIso,
    };
  },
};
