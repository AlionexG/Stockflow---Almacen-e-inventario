import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Package,
  DollarSign,
  Truck,
  AlertTriangle,
  Download,
  Plus,
  ShoppingCart,
  Calculator,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ArrowDownRight,
  Receipt,
  Zap,
  History,
  Search,
  ArrowDown,
  ArrowUp,
  Clock,
  CheckCircle2,
  Box,
  User,
  Filter,
} from 'lucide-react';
import { VincitEmblem } from './brand/VincitEmblem';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Product, SaleOrder, Expense, AppSettings, HistoryRecord } from '../types';
import { storageService } from '../services/storageService';

interface DashboardProps {
  products: Product[];
  orders: SaleOrder[];
  expenses: Expense[];
  currency: string;
  settings?: AppSettings;
  historyRecords?: HistoryRecord[];
  onOpenNewProduct: () => void;
  onOpenNewOrder: () => void;
  onOpenNewExpense: () => void;
  onOpenCalculator: () => void;
  onOpenReports: () => void;
  onOpenSheetsModal: () => void;
  onSelectTab?: (tab: 'dashboard' | 'products' | 'batches' | 'sales' | 'expenses' | 'history') => void;
}

interface MonthlyChartData {
  monthKey: string;
  monthLabel: string;
  fullMonthName: string;
  ventas: number;
  costos: number;
  ganancia: number;
  costoProductos: number;
  costoEnvios: number;
  gastosOperativos: number;
  margen: number;
  pedidos: number;
}

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const MONTH_SHORT_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  orders,
  expenses,
  currency,
  settings,
  historyRecords,
  onOpenNewProduct,
  onOpenNewOrder,
  onOpenNewExpense,
  onOpenCalculator,
  onOpenReports,
  onOpenSheetsModal,
  onSelectTab,
}) => {
  const [chartView, setChartView] = useState<'grouped' | 'profitOnly'>('grouped');

  // Current month calculation
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
  const currentMonthOrders = orders.filter((o) => o.date && o.date.startsWith(currentMonthStr));
  const currentMonthExpenses = expenses.filter((e) => e.date && e.date.startsWith(currentMonthStr));

  const totalSales = currentMonthOrders.reduce((sum, o) => sum + (o.totalSale || 0), 0);
  const totalProductCost = currentMonthOrders.reduce((sum, o) => sum + (o.totalProductCost || 0), 0);
  const totalShippingCost = currentMonthOrders.reduce((sum, o) => sum + (o.totalShippingCost || 0), 0);
  const totalOperationalExpenses = currentMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalCostsAll = totalProductCost + totalShippingCost + totalOperationalExpenses;
  const netProfit = totalSales - totalCostsAll;
  const roiMargin = totalCostsAll > 0 ? (netProfit / totalCostsAll) * 100 : 0;

  // Inventory valuation
  const inventoryCostValue = products.reduce(
    (sum, p) => sum + (p.unitQuotation || p.unitPriceCost || 0) * (p.stock || 0),
    0
  );
  const inventoryRetailValue = products.reduce((sum, p) => sum + (p.sellingPriceUnit || 0) * (p.stock || 0), 0);
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  // Activity History State & Logic
  const [activityFilter, setActivityFilter] = useState<'all' | 'sales' | 'stock' | 'expenses'>('all');
  const [activitySearch, setActivitySearch] = useState<string>('');
  const [visibleActivityCount, setVisibleActivityCount] = useState<number>(10);

  const formatMovementDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return timestamp;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);

      if (diffMin < 1) return 'Hace un momento';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHours < 24 && date.getDate() === now.getDate()) {
        return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const activityMovements = useMemo(() => {
    const list: {
      id: string;
      type: 'sale' | 'stock_in' | 'stock_alert' | 'expense';
      title: string;
      subtitle: string;
      timestamp: string;
      dateMs: number;
      quantityChange?: number;
      amount?: number;
      netProfit?: number;
      badgeText: string;
      badgeVariant: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
      customer?: string;
      itemsSummary?: string;
    }[] = [];

    const records = historyRecords || storageService.getHistoryRecords();
    records.forEach((r) => {
      list.push({
        id: r.id,
        type: (r.type === 'stock_add' ? 'stock_in' : r.type) as any,
        title: r.title,
        subtitle: r.subtitle,
        timestamp: r.timestamp,
        dateMs: r.dateMs || new Date(r.timestamp).getTime() || 0,
        quantityChange: r.quantityChange,
        amount: r.amount,
        netProfit: r.netProfit,
        badgeText: r.badgeText,
        badgeVariant: r.badgeVariant,
        customer: r.customer,
        itemsSummary: r.itemsSummary,
      });
    });

    // Stock Alerts para productos actualmente en stock bajo
    products.forEach((p) => {
      if (p.stock <= (p.minStock ?? 5)) {
        list.push({
          id: `alert-${p.id}`,
          type: 'stock_alert',
          title: p.stock === 0 ? `Stock Agotado: ${p.name}` : `Alerta de Stock Mínimo: ${p.name}`,
          subtitle: `Quedan ${p.stock} unidad${p.stock !== 1 ? 'es' : ''} en almacén (Mínimo: ${p.minStock} unid.)`,
          timestamp: p.updatedAt || p.createdAt || new Date().toISOString(),
          dateMs: (new Date(p.updatedAt || p.createdAt || Date.now()).getTime()) + 1,
          badgeText: p.stock === 0 ? '¡Agotado!' : '¡Stock Bajo!',
          badgeVariant: p.stock === 0 ? 'danger' : 'warning',
        });
      }
    });

    return list.sort((a, b) => b.dateMs - a.dateMs);
  }, [historyRecords, products]);

  // Filtered movements
  const filteredActivityMovements = useMemo(() => {
    return activityMovements.filter((m) => {
      if (activityFilter === 'sales' && m.type !== 'sale') return false;
      if (activityFilter === 'stock' && m.type !== 'stock_in' && m.type !== 'stock_alert') return false;
      if (activityFilter === 'expenses' && m.type !== 'expense') return false;

      if (activitySearch.trim()) {
        const query = activitySearch.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(query);
        const matchesSub = m.subtitle.toLowerCase().includes(query);
        const matchesBadge = m.badgeText.toLowerCase().includes(query);
        const matchesCustomer = m.customer?.toLowerCase().includes(query);
        const matchesItems = m.itemsSummary?.toLowerCase().includes(query);
        return matchesTitle || matchesSub || matchesBadge || matchesCustomer || matchesItems;
      }
      return true;
    });
  }, [activityMovements, activityFilter, activitySearch]);

  // Compute monthly data for Recharts Bar Chart
  const monthlyData: MonthlyChartData[] = useMemo(() => {
    const now = new Date();
    const monthsMap = new Map<
      string,
      {
        monthKey: string;
        monthLabel: string;
        fullMonthName: string;
        ventas: number;
        costoProductos: number;
        costoEnvios: number;
        gastosOperativos: number;
        pedidos: number;
      }
    >();

    // Generate past 6 months chronologically leading up to the current date
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const shortName = `${MONTH_SHORT_ES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
      const fullName = `${MONTH_NAMES_ES[d.getMonth()]} ${d.getFullYear()}`;
      monthsMap.set(key, {
        monthKey: key,
        monthLabel: shortName,
        fullMonthName: fullName,
        ventas: 0,
        costoProductos: 0,
        costoEnvios: 0,
        gastosOperativos: 0,
        pedidos: 0,
      });
    }

    // Include any other months found in user orders
    orders.forEach((o) => {
      if (!o.date) return;
      const key = o.date.slice(0, 7);
      if (key && !monthsMap.has(key)) {
        const [yStr, mStr] = key.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10);
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
          const shortName = `${MONTH_SHORT_ES[m - 1]} '${String(y).slice(2)}`;
          const fullName = `${MONTH_NAMES_ES[m - 1]} ${y}`;
          monthsMap.set(key, {
            monthKey: key,
            monthLabel: shortName,
            fullMonthName: fullName,
            ventas: 0,
            costoProductos: 0,
            costoEnvios: 0,
            gastosOperativos: 0,
            pedidos: 0,
          });
        }
      }
    });

    // Include any other months found in user expenses
    expenses.forEach((e) => {
      if (!e.date) return;
      const key = e.date.slice(0, 7);
      if (key && !monthsMap.has(key)) {
        const [yStr, mStr] = key.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10);
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
          const shortName = `${MONTH_SHORT_ES[m - 1]} '${String(y).slice(2)}`;
          const fullName = `${MONTH_NAMES_ES[m - 1]} ${y}`;
          monthsMap.set(key, {
            monthKey: key,
            monthLabel: shortName,
            fullMonthName: fullName,
            ventas: 0,
            costoProductos: 0,
            costoEnvios: 0,
            gastosOperativos: 0,
            pedidos: 0,
          });
        }
      }
    });

    // Accumulate orders
    orders.forEach((o) => {
      if (!o.date) return;
      const key = o.date.slice(0, 7);
      const entry = monthsMap.get(key);
      if (entry) {
        entry.ventas += o.totalSale || 0;
        entry.costoProductos += o.totalProductCost || 0;
        entry.costoEnvios += o.totalShippingCost || 0;
        entry.pedidos += 1;
      }
    });

    // Accumulate expenses
    expenses.forEach((e) => {
      if (!e.date) return;
      const key = e.date.slice(0, 7);
      const entry = monthsMap.get(key);
      if (entry) {
        entry.gastosOperativos += e.amount || 0;
      }
    });

    // Sort chronologically by monthKey
    const sortedKeys = Array.from(monthsMap.keys()).sort();
    return sortedKeys.map((key) => {
      const item = monthsMap.get(key)!;
      const totalCost = item.costoProductos + item.costoEnvios + item.gastosOperativos;
      const profit = item.ventas - totalCost;
      const margin = totalCost > 0 ? (profit / totalCost) * 100 : item.ventas > 0 ? 100 : 0;

      return {
        monthKey: item.monthKey,
        monthLabel: item.monthLabel,
        fullMonthName: item.fullMonthName,
        ventas: Number(item.ventas.toFixed(2)),
        costos: Number(totalCost.toFixed(2)),
        ganancia: Number(profit.toFixed(2)),
        costoProductos: Number(item.costoProductos.toFixed(2)),
        costoEnvios: Number(item.costoEnvios.toFixed(2)),
        gastosOperativos: Number(item.gastosOperativos.toFixed(2)),
        margen: Number(margin.toFixed(1)),
        pedidos: item.pedidos,
      };
    });
  }, [orders, expenses]);

  // Aggregate stats across the displayed trend months
  const totalPeriodProfit = useMemo(
    () => monthlyData.reduce((acc, curr) => acc + curr.ganancia, 0),
    [monthlyData]
  );
  const totalPeriodSales = useMemo(
    () => monthlyData.reduce((acc, curr) => acc + curr.ventas, 0),
    [monthlyData]
  );
  const avgMonthlyProfit = useMemo(
    () => (monthlyData.length > 0 ? totalPeriodProfit / monthlyData.length : 0),
    [monthlyData, totalPeriodProfit]
  );
  const bestMonth = useMemo(() => {
    if (monthlyData.length === 0) return null;
    return monthlyData.reduce((max, curr) => (curr.ganancia > max.ganancia ? curr : max), monthlyData[0]);
  }, [monthlyData]);

  // Custom Interactive Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: MonthlyChartData = payload[0].payload;
      const isPositive = item.ganancia >= 0;

      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800 text-xs min-w-56 space-y-2.5 animate-in fade-in duration-100">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-white text-sm">{item.fullMonthName}</span>
              <div className="text-[10px] text-slate-400 font-normal">
                {item.pedidos} pedido{item.pedidos !== 1 ? 's' : ''} registrado{item.pedidos !== 1 ? 's' : ''}
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {item.margen}% ROI
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {/* Ventas */}
            <div className="flex items-center justify-between text-sky-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                Ventas (Ingresos):
              </span>
              <span className="font-bold">
                {currency} {item.ventas.toFixed(2)}
              </span>
            </div>

            {/* Costos */}
            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Costos & Envíos:
              </span>
              <span className="font-bold">
                {currency} {item.costos.toFixed(2)}
              </span>
            </div>

            {/* Desglose interno de costos */}
            <div className="pl-3.5 text-[10.5px] text-slate-400 space-y-0.5 border-l-2 border-slate-800 py-0.5">
              <div className="flex justify-between">
                <span>Mercancía base:</span>
                <span>
                  {currency} {item.costoProductos.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Envíos:</span>
                <span>
                  {currency} {item.costoEnvios.toFixed(2)}
                </span>
              </div>
              {item.gastosOperativos > 0 && (
                <div className="flex justify-between">
                  <span>Gastos operativos:</span>
                  <span>
                    {currency} {item.gastosOperativos.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Ganancia Neta */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-1.5 text-slate-200">
                <span
                  className={`w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-rose-400'}`}
                ></span>
                Ganancia Neta:
              </span>
              <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                {currency} {item.ganancia.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Mobile/Android PWA Installation Banner (Dismissible, only if not in standalone) */}
      <PWAInstallButton variant="banner" />

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Alerta de Stock Bajo ({lowStockProducts.length} producto{lowStockProducts.length > 1 ? 's' : ''})
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {lowStockProducts.map((p) => `${p.name} (${p.stock} uds.)`).slice(0, 3).join(', ')}
                {lowStockProducts.length > 3 ? ' y más...' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onSelectTab) {
                onSelectTab('products');
              } else {
                onOpenNewProduct();
              }
            }}
            className="text-xs font-bold px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors whitespace-nowrap active:scale-95"
          >
            Revisar Inventario ({lowStockProducts.length})
          </button>
        </div>
      )}

      {/* BIENVENIDA CUANDO LA APP ESTÁ LIMPIA */}
      {products.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-sm shrink-0">
              <Sparkles className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                ¡Bienvenido a Vincit Omnia! Tu aplicación está lista y limpia
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
                Comienza agregando tus primeros productos al inventario o creando lotes de flete. Los gráficos de rendimiento, ventas y métricas financieras cobrarán vida automáticamente conforme registres operaciones.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={onOpenNewProduct}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95"
            >
              + Cargar Primer Producto
            </button>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS BAR - OPTIMIZADA PARA PC, TABLET Y MÓVIL (Sin duplicados) */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300/90 font-mono">
              Acceso Rápido de 1 Clic
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Registra operaciones sin cambiar de pantalla
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Quick Add: Nueva Venta */}
          <button
            onClick={onOpenNewOrder}
            className="group relative flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-800/90 hover:bg-sky-950/80 border border-slate-700/80 hover:border-sky-500/60 shadow-xs transition-all duration-200 text-left active:scale-[0.98]"
            title="Crear nueva venta directamente"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                  + Nueva Venta / Pedido
                </span>
                <Plus className="w-3.5 h-3.5 text-sky-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Cliente, productos y cobro directo
              </p>
            </div>
          </button>

          {/* Quick Add: Nuevo Producto */}
          <button
            onClick={onOpenNewProduct}
            className="group relative flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-800/90 hover:bg-emerald-950/80 border border-slate-700/80 hover:border-emerald-500/60 shadow-xs transition-all duration-200 text-left active:scale-[0.98]"
            title="Registrar nuevo producto en inventario"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  + Nuevo Producto
                </span>
                <Plus className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Foto, cálculo de flete y precio
              </p>
            </div>
          </button>

          {/* Quick Add: Nuevo Gasto */}
          <button
            onClick={onOpenNewExpense}
            className="group relative flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-800/90 hover:bg-amber-950/80 border border-slate-700/80 hover:border-amber-500/60 shadow-xs transition-all duration-200 text-left active:scale-[0.98]"
            title="Registrar nuevo gasto operativo"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  + Nuevo Gasto Operativo
                </span>
                <Plus className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Empaques, envíos o servicios
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Main KPI Grid - Optimized for Mobile (2 cols), Tablet & PC (4 cols) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4 2xl:gap-5">
        {/* Ganancia Neta Real */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white p-4.5 sm:p-5 2xl:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
                Ganancia Neta (Mes)
              </span>
              <div className="p-1.5 rounded-lg bg-white/20">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              {currency} {netProfit.toFixed(2)}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-emerald-100 pt-2 border-t border-emerald-500/40">
            <span>ROI sobre Costos:</span>
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded-md">
              {roiMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Facturado / Ventas */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ventas del Mes
              </span>
              <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {currency} {totalSales.toFixed(2)}
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>{currentMonthOrders.length} pedidos</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
              Activo <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Gastos y Envíos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Costos & Envíos
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {currency} {totalCostsAll.toFixed(2)}
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Envíos: {currency} {totalShippingCost.toFixed(2)}</span>
            <span>Mercancía: {currency} {totalProductCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Valor Total de Almacén */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Valor en Almacén
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {currency} {inventoryCostValue.toFixed(2)}
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>{totalStockUnits} unidades</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold" title="Valor si vendes todo al precio actual">
              Venta: {currency} {inventoryRetailValue.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* RECHARTS BAR CHART: TENDENCIA DE GANANCIAS MENSUALES */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 transition-colors">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tendencia de Ganancias Mensuales
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evolución comparativa de ingresos por ventas, costos y ganancia neta mes a mes
            </p>
          </div>

          {/* KPI Mini-Cards & View Switcher */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {/* KPI Badges */}
            <div className="hidden lg:flex items-center gap-3 mr-2">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Ganancia Período</div>
                <div className="text-xs font-bold text-emerald-600">
                  {currency} {totalPeriodProfit.toFixed(2)}
                </div>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Promedio / Mes</div>
                <div className="text-xs font-bold text-slate-700">
                  {currency} {avgMonthlyProfit.toFixed(2)}
                </div>
              </div>
              {bestMonth && (
                <>
                  <div className="h-6 w-px bg-slate-200"></div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Mejor Mes</div>
                    <div className="text-xs font-bold text-indigo-600">
                      {bestMonth.monthLabel} ({currency}{bestMonth.ganancia.toFixed(0)})
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartView('grouped')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartView === 'grouped'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>Comparativa Completa</span>
              </button>
              <button
                type="button"
                onClick={() => setChartView('profitOnly')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  chartView === 'profitOnly'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Solo Ganancia Neta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas Area - Responsive Height for Mobile, Tablet & Widescreen PC */}
        <div className="w-full h-72 sm:h-80 lg:h-88 2xl:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 20, right: 15, left: -10, bottom: 5 }}
              barGap={4}
              barCategoryGap="22%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(value) => `${currency}${value}`}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />

              {chartView === 'grouped' ? (
                <>
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
                    formatter={(value) => {
                      if (value === 'ventas') return 'Ventas Totales';
                      if (value === 'costos') return 'Costos & Envíos';
                      if (value === 'ganancia') return 'Ganancia Neta';
                      return value;
                    }}
                  />
                  {/* Barra de Ventas (Sky Blue) */}
                  <Bar
                    dataKey="ventas"
                    name="ventas"
                    fill="#0ea5e9"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  {/* Barra de Costos Totales (Amber/Orange) */}
                  <Bar
                    dataKey="costos"
                    name="costos"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                  {/* Barra de Ganancia Neta (Emerald) */}
                  <Bar
                    dataKey="ganancia"
                    name="ganancia"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </>
              ) : (
                <>
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
                    formatter={() => 'Ganancia Neta del Mes'}
                  />
                  <Bar
                    dataKey="ganancia"
                    name="ganancia"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={55}
                  >
                    {monthlyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.ganancia >= 0 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Insights & Notes */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              La ganancia se calcula descontando los costos de compra, empaques, envíos por lote y gastos operativos.
            </span>
          </div>
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            Total facturado en el período: <span className="text-slate-900 dark:text-white font-bold">{currency} {totalPeriodSales.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Financial Health Breakdown Bar - Responsive & Dark Mode */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Desglose de Ingresos, Gastos y Margen del Mes Actual
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualización de a dónde va cada peso ingresado este mes
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/80">
            {totalSales > 0 ? `${((netProfit / totalSales) * 100).toFixed(1)}% Margen Neto` : '0%'}
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        {totalSales > 0 ? (
          <div className="space-y-3">
            <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${Math.min(100, Math.max(5, (totalProductCost / totalSales) * 100))}%` }}
                className="bg-indigo-500 h-full transition-all"
                title={`Costo Mercancía: ${currency} ${totalProductCost.toFixed(2)}`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(5, (totalShippingCost / totalSales) * 100))}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Gastos Envío: ${currency} ${totalShippingCost.toFixed(2)}`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(5, (totalOperationalExpenses / totalSales) * 100))}%` }}
                className="bg-slate-400 dark:bg-slate-500 h-full transition-all"
                title={`Gastos Operativos: ${currency} ${totalOperationalExpenses.toFixed(2)}`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(5, (Math.max(0, netProfit) / totalSales) * 100))}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Ganancia Neta Limpia: ${currency} ${netProfit.toFixed(2)}`}
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  Costo Base ({totalSales > 0 ? ((totalProductCost / totalSales) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  Envíos ({totalSales > 0 ? ((totalShippingCost / totalSales) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  Operativos ({totalSales > 0 ? ((totalOperationalExpenses / totalSales) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-emerald-700 dark:text-emerald-400 truncate">
                  Ganancia Neta ({totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Registra ventas este mes para ver la barra de distribución de costos y ganancias.
          </div>
        )}
      </div>

      {/* HISTORIAL DE ACTIVIDAD & TRAZABILIDAD (MOVIMIENTOS DE STOCK Y VENTAS) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-indigo-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Historial de Actividad & Trazabilidad</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {activityMovements.length} eventos
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Seguimiento cronológico en tiempo real de salidas por ventas, entradas de stock y alertas
              </p>
            </div>
          </div>

          {/* Enlaces rápidos a pestañas y botón Ver Todos */}
          <div className="flex items-center gap-2 flex-wrap">
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('history')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs hover:shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Abrir pestaña completa con todo el historial de cambios"
              >
                <History className="w-3.5 h-3.5" />
                <span>Ver todos ({activityMovements.length}) →</span>
              </button>
            )}
            {onSelectTab && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab('sales')}
                  className="hidden xl:inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                >
                  Ventas →
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('products')}
                  className="hidden xl:inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                >
                  Inventario →
                </button>
              </>
            )}
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Tabs de Filtro */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Todos', count: activityMovements.length },
              { id: 'sales', label: 'Ventas & Salidas', count: activityMovements.filter((m) => m.type === 'sale').length },
              { id: 'stock', label: 'Stock & Alertas', count: activityMovements.filter((m) => m.type === 'stock_in' || m.type === 'stock_alert').length },
              { id: 'expenses', label: 'Gastos', count: activityMovements.filter((m) => m.type === 'expense').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivityFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activityFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activityFilter === tab.id
                      ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950 font-black'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Buscador de Actividad */}
          <div className="relative min-w-0 sm:min-w-[200px] w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en el historial..."
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500"
            />
            {activitySearch && (
              <button
                type="button"
                onClick={() => setActivitySearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Lista de Movimientos */}
        <div className="space-y-2.5">
          {filteredActivityMovements.length > 0 ? (
            filteredActivityMovements.slice(0, visibleActivityCount).map((mov, index) => {
              const isSale = mov.type === 'sale';
              const isStockIn = mov.type === 'stock_in';
              const isAlert = mov.type === 'stock_alert';

              return (
                <div
                  key={`mov-${mov.id}-${index}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Icono del Movimiento */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                        isSale
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                          : isStockIn
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : isAlert
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30'
                      }`}
                    >
                      {isSale ? (
                        <ShoppingCart className="w-4 h-4" />
                      ) : isStockIn ? (
                        <Box className="w-4 h-4" />
                      ) : isAlert ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Receipt className="w-4 h-4" />
                      )}
                    </div>

                    {/* Descripción y Detalles */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {mov.title}
                        </span>
                        {/* Insignia de Estado */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            mov.badgeVariant === 'success'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : mov.badgeVariant === 'warning'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : mov.badgeVariant === 'info'
                              ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                              : mov.badgeVariant === 'danger'
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {mov.badgeText}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {mov.subtitle}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatMovementDate(mov.timestamp)}
                        </span>
                        {mov.customer && (
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                            <User className="w-3 h-3" />
                            {mov.customer}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Impacto Financiero y de Stock */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
                    {/* Variación de Inventario */}
                    {mov.quantityChange !== undefined && (
                      <div
                        className={`text-xs font-bold flex items-center gap-1 ${
                          mov.quantityChange < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {mov.quantityChange < 0 ? (
                          <ArrowDown className="w-3 h-3 stroke-[3]" />
                        ) : (
                          <ArrowUp className="w-3 h-3 stroke-[3]" />
                        )}
                        <span>
                          {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange} unid.
                        </span>
                      </div>
                    )}

                    {/* Monto Financiero */}
                    {mov.amount !== undefined && (
                      <div
                        className={`text-xs font-black ${
                          mov.amount < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {mov.amount >= 0 ? '+' : '-'}{currency} {Math.abs(mov.amount).toFixed(2)}
                      </div>
                    )}

                    {/* Ganancia en ventas */}
                    {isSale && mov.netProfit !== undefined && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Ganancia: +{currency} {mov.netProfit.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {activitySearch
                  ? 'No se encontraron movimientos que coincidan con la búsqueda.'
                  : 'Aún no se han registrado movimientos de inventario o ventas.'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Los nuevos pedidos y altas de productos aparecerán automáticamente aquí.
              </p>
            </div>
          )}
        </div>

        {/* Pie de lista: Enlace a Ver Todos en la pestaña dedicada de Historial */}
        <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando los {Math.min(visibleActivityCount, filteredActivityMovements.length)} cambios más recientes ({filteredActivityMovements.length} eventos registrados)
          </span>
          {onSelectTab && (
            <button
              type="button"
              onClick={() => onSelectTab('history')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-amber-300 bg-amber-400 hover:bg-amber-300 dark:bg-amber-950/70 dark:hover:bg-amber-900 border border-amber-500/40 dark:border-amber-700/80 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <History className="w-3.5 h-3.5" />
              <span>Ver todo el historial completo ({filteredActivityMovements.length} eventos) →</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
