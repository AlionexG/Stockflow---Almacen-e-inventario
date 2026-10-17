import React, { useState, useMemo } from 'react';
import {
  History,
  ShoppingCart,
  Box,
  AlertTriangle,
  Receipt,
  Search,
  Filter,
  Calendar,
  ArrowDown,
  ArrowUp,
  Clock,
  User,
  Download,
  ArrowLeft,
  Package,
  Layers,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Trash2,
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { Product, SaleOrder, Expense, HistoryRecord } from '../types';
import { storageService } from '../services/storageService';

interface ActivityHistoryViewProps {
  products: Product[];
  orders: SaleOrder[];
  expenses: Expense[];
  currency: string;
  historyRecords?: HistoryRecord[];
  onSelectTab: (tab: 'dashboard' | 'products' | 'batches' | 'sales' | 'expenses' | 'history') => void;
  onOpenNewOrder?: () => void;
  onOpenNewProduct?: () => void;
  onOpenNewExpense?: () => void;
  onDeleteHistoryRecord?: (recordId: string) => void;
  onClearHistory?: () => void;
}

export interface ActivityMovement {
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
}

export const ActivityHistoryView: React.FC<ActivityHistoryViewProps> = ({
  products,
  orders,
  expenses,
  currency,
  historyRecords,
  onSelectTab,
  onOpenNewOrder,
  onOpenNewProduct,
  onOpenNewExpense,
  onDeleteHistoryRecord,
  onClearHistory,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'stock' | 'expenses'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Password Security for History Deletion
  const SECURITY_PASSWORD = 'Vincit2409*';
  const [deleteTarget, setDeleteTarget] = useState<'all' | ActivityMovement | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleOpenDelete = (target: 'all' | ActivityMovement) => {
    setDeleteTarget(target);
    setPasswordInput('');
    setPasswordError(null);
    setShowPassword(false);
  };

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput !== SECURITY_PASSWORD) {
      setPasswordError('Contraseña incorrecta. Se requiere autorización ("Vincit2409*") para borrar registros del historial.');
      return;
    }

    if (deleteTarget === 'all') {
      if (onClearHistory) {
        onClearHistory();
      } else {
        storageService.clearHistoryRecords();
      }
    } else if (deleteTarget) {
      if (onDeleteHistoryRecord) {
        onDeleteHistoryRecord(deleteTarget.id);
      } else {
        storageService.deleteHistoryRecord(deleteTarget.id);
      }
    }

    setDeleteTarget(null);
    setPasswordInput('');
    setPasswordError(null);
  };

  // Build full chronological list of movements from persistent storage
  const allMovements: ActivityMovement[] = useMemo(() => {
    const records = historyRecords || storageService.getHistoryRecords();
    const list: ActivityMovement[] = records.map((r) => ({
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
    }));

    // Stock alerts dinámicas para los productos actualmente en stock bajo
    products.forEach((p) => {
      if (p.stock <= (p.minStock ?? 5)) {
        list.push({
          id: `alert-${p.id}`,
          type: 'stock_alert',
          title: p.stock === 0 ? `Stock Agotado: ${p.name}` : `Alerta de Stock Mínimo: ${p.name}`,
          subtitle: `Quedan ${p.stock} unidad${p.stock !== 1 ? 'es' : ''} en almacén (Mínimo: ${p.minStock} unid.) • SKU: ${p.sku || 'N/A'}`,
          timestamp: p.updatedAt || p.createdAt || new Date().toISOString(),
          dateMs: (new Date(p.updatedAt || p.createdAt || Date.now()).getTime()) + 1,
          badgeText: p.stock === 0 ? '¡Agotado!' : '¡Stock Bajo!',
          badgeVariant: p.stock === 0 ? 'danger' : 'warning',
        });
      }
    });

    return list.sort((a, b) => (sortOrder === 'desc' ? b.dateMs - a.dateMs : a.dateMs - b.dateMs));
  }, [historyRecords, products, sortOrder]);

  // Date filtering logic
  const filteredMovements = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return allMovements.filter((m) => {
      // Type filter
      if (filterType === 'sales' && m.type !== 'sale') return false;
      if (filterType === 'stock' && m.type !== 'stock_in' && m.type !== 'stock_alert') return false;
      if (filterType === 'expenses' && m.type !== 'expense') return false;

      // Date range filter
      if (dateFilter === 'today' && m.dateMs < todayStart) return false;
      if (dateFilter === 'week' && m.dateMs < sevenDaysAgo) return false;
      if (dateFilter === 'month' && m.dateMs < thisMonthStart) return false;

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(query);
        const matchesSub = m.subtitle.toLowerCase().includes(query);
        const matchesBadge = m.badgeText.toLowerCase().includes(query);
        const matchesCustomer = m.customer?.toLowerCase().includes(query);
        const matchesItems = m.itemsSummary?.toLowerCase().includes(query);
        return matchesTitle || matchesSub || matchesBadge || matchesCustomer || matchesItems;
      }

      return true;
    });
  }, [allMovements, filterType, dateFilter, search]);

  // Statistics
  const stats = useMemo(() => {
    const totalSalesMovements = allMovements.filter((m) => m.type === 'sale').length;
    const totalStockMovements = allMovements.filter((m) => m.type === 'stock_in').length;
    const totalAlerts = allMovements.filter((m) => m.type === 'stock_alert').length;
    const totalExpenseMovements = allMovements.filter((m) => m.type === 'expense').length;

    const totalSoldUnits = allMovements
      .filter((m) => m.type === 'sale' && m.quantityChange)
      .reduce((sum, m) => sum + Math.abs(m.quantityChange || 0), 0);

    const totalRevenue = allMovements
      .filter((m) => m.type === 'sale' && m.amount)
      .reduce((sum, m) => sum + (m.amount || 0), 0);

    return {
      totalSalesMovements,
      totalStockMovements,
      totalAlerts,
      totalExpenseMovements,
      totalSoldUnits,
      totalRevenue,
    };
  }, [allMovements]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredMovements.length === 0) return;

    const headers = ['ID', 'Tipo', 'Fecha', 'Título', 'Detalles', 'Cliente', 'Variación Unidades', 'Monto', 'Ganancia Neta', 'Estado'];
    const rows = filteredMovements.map((m) => [
      m.id,
      m.type,
      new Date(m.timestamp).toLocaleString('es-ES'),
      `"${m.title.replace(/"/g, '""')}"`,
      `"${m.subtitle.replace(/"/g, '""')}"`,
      `"${(m.customer || '').replace(/"/g, '""')}"`,
      m.quantityChange ?? 0,
      m.amount ?? 0,
      m.netProfit ?? 0,
      m.badgeText,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historial-trazabilidad-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
            title="Volver al Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Historial de Actividad & Trazabilidad</span>
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                {allMovements.length} eventos registrados
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registro cronológico completo e inmutable de entradas y salidas de stock, ventas, cuotas y gastos.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto flex-wrap">
          {allMovements.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenDelete('all')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-2xs"
              title="Borrar todo el historial (requiere contraseña)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Borrar Historial</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Descargar historial en formato CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span>Ir al Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ventas Registradas</span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalSalesMovements} pedidos
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.totalSoldUnits} unidades despachadas
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Entradas de Stock</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalStockMovements} productos
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {products.length} artículos en catálogo
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Alertas de Stock</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalAlerts} avisos
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
            Stock mínimo o agotado
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gastos Operativos</span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalExpenseMovements} registros
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Empaques, envíos y publicidad
          </div>
        </div>
      </div>

      {/* Main Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Movement Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
            {[
              { id: 'all', label: 'Todos los Cambios', count: allMovements.length },
              { id: 'sales', label: 'Ventas & Salidas', count: allMovements.filter((m) => m.type === 'sale').length },
              { id: 'stock', label: 'Stock & Alertas', count: allMovements.filter((m) => m.type === 'stock_in' || m.type === 'stock_alert').length },
              { id: 'expenses', label: 'Gastos', count: allMovements.filter((m) => m.type === 'expense').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterType === tab.id
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filterType === tab.id
                      ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950 font-black'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Date Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Date filter dropdown */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 shrink-0" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 py-1 px-2 focus:outline-none cursor-pointer"
              >
                <option value="all">Todo el Historial</option>
                <option value="today">Solo Hoy</option>
                <option value="week">Últimos 7 días</option>
                <option value="month">Este Mes</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-0 sm:min-w-[220px] w-full sm:w-64 flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, SKU, producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Movements Timeline List */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {filteredMovements.length > 0 ? (
            filteredMovements.map((mov, index) => {
              const isSale = mov.type === 'sale';
              const isStockIn = mov.type === 'stock_in';
              const isAlert = mov.type === 'stock_alert';

              return (
                <div
                  key={`hist-mov-${mov.id}-${index}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Event Type Icon */}
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

                    {/* Description & metadata */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {mov.title}
                        </span>
                        {/* Status Badge */}
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

                  {/* Financial & Stock impact + Individual Delete Action */}
                  <div className="flex sm:flex-row items-center gap-3 sm:gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0 justify-between sm:justify-end">
                    <div className="flex flex-col items-start sm:items-end justify-center">
                      {/* Quantity Variation */}
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

                      {/* Financial Amount */}
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

                      {/* Sale profit */}
                      {isSale && mov.netProfit !== undefined && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Ganancia: +{currency} {mov.netProfit.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Botón para eliminar este registro individual con contraseña */}
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(mov)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer"
                      title="Eliminar este registro del historial (requiere contraseña)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {search
                  ? 'No se encontraron movimientos que coincidan con la búsqueda.'
                  : 'Aún no se han registrado movimientos con los filtros seleccionados.'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Los nuevos pedidos, altas de productos y aumentos de stock aparecerán automáticamente aquí.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE SEGURIDAD CON CONTRASEÑA PARA BORRAR HISTORIAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-md my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/70 dark:bg-rose-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {deleteTarget === 'all' ? 'Borrar Todo el Historial' : 'Borrar Registro del Historial'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Se requiere contraseña de autorización
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelete} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300">
                {deleteTarget === 'all' ? (
                  <p>
                    ⚠️ <strong>Atención:</strong> Esta acción eliminará permanentemente todos los registros del historial de trazabilidad.
                  </p>
                ) : (
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Registro a eliminar:</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {deleteTarget.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {deleteTarget.subtitle}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ingresa la contraseña de seguridad <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Contraseña de autorización"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1.5 animate-in fade-in">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleteTarget === 'all' ? 'Confirmar y Borrar Todo' : 'Confirmar y Borrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
