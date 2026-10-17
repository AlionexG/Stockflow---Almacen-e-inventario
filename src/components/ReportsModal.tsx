import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Truck,
  Package,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Product, SaleOrder, Expense, ShippingBatch, RetentionBatch, AppSettings } from '../types';
import { exportService } from '../services/exportService';
import { VincitEmblem } from './brand/VincitEmblem';

interface ReportsModalProps {
  isOpen: boolean;
  products: Product[];
  shippingBatches: ShippingBatch[];
  retentionBatches: RetentionBatch[];
  orders: SaleOrder[];
  expenses: Expense[];
  currency: string;
  settings?: AppSettings;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  products,
  shippingBatches,
  retentionBatches,
  orders,
  expenses,
  currency,
  settings,
  onClose,
}) => {
  // Current month string "YYYY-MM"
  const defaultMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate stats for selected month
  const stats = exportService.calculateMonthlyStats(selectedMonth, products, orders, expenses);
  const monthOrders = orders.filter((o) => o.date.startsWith(selectedMonth));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

  // Available months list (last 12 months)
  const availableMonths = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    availableMonths.push({
      key: monthKey,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    });
  }

  const handleDownloadExcel = () => {
    try {
      exportService.exportToExcel(selectedMonth, products, shippingBatches, retentionBatches, orders, expenses, currency);
      setDownloadSuccess('Reporte en Excel descargado exitosamente (.xlsx)');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (e) {
      console.error('Error al generar Excel:', e);
      alert('Hubo un error al generar el archivo Excel.');
    }
  };

  const handleDownloadPDF = () => {
    try {
      exportService.exportToPDF(selectedMonth, products, shippingBatches, orders, expenses, currency);
      setDownloadSuccess('Reporte oficial en PDF descargado exitosamente (.pdf)');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (e) {
      console.error('Error al generar PDF:', e);
      alert('Hubo un error al generar el archivo PDF.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/40 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
              <VincitEmblem
                className="w-8 h-8"
                customLogoUrl={settings?.customLogoUrl}
                customLogoType={settings?.customLogoType}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Reportes {settings?.appName || 'Vincit Omnia'}</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">Excel & PDF</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Balances de ingresos, costos de accesorios, envíos y márgenes netos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Download feedback banner */}
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Month Selector Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Seleccionar Mes del Reporte:</label>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Export Buttons (Highlighted) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadExcel}
              className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md shadow-emerald-200 dark:shadow-none flex items-center justify-between transition-all active:scale-98 group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold uppercase tracking-wider">
                    Descargar en Excel (.xlsx)
                  </div>
                  <div className="text-[11px] text-emerald-100">
                    4 pestañas con formato contable completo
                  </div>
                </div>
              </div>
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={handleDownloadPDF}
              className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-md shadow-rose-200 dark:shadow-none flex items-center justify-between transition-all active:scale-98 group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold uppercase tracking-wider">
                    Descargar en PDF (.pdf)
                  </div>
                  <div className="text-[11px] text-rose-100">
                    Membrete, tablas y balance ejecutivo
                  </div>
                </div>
              </div>
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Executive Summary Card with Official Brand Emblem */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/70 text-white rounded-3xl p-5 border border-amber-500/30 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/40 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
                  <VincitEmblem
                    className="w-8 h-8"
                    customLogoUrl={settings?.customLogoUrl}
                    customLogoType={settings?.customLogoType}
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block font-serif">
                    {settings?.appName || 'VINCIT OMNIA'} • BALANCE CONTABLE
                  </span>
                  <h3 className="text-base font-bold text-white font-serif">{stats.monthName}</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                  Ganancia Neta Real
                </span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  +{currency} {stats.netProfit.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-t border-slate-800 pt-3">
              <div>
                <span className="text-[10px] text-slate-400 block">Ventas Facturadas</span>
                <span className="text-sm font-bold text-slate-200">
                  {currency} {stats.totalSales.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400">{stats.ordersCount} pedidos</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Costo de Mercancía</span>
                <span className="text-sm font-bold text-slate-300">
                  {currency} {stats.totalProductCost.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400">{stats.unitsSold} uds. vendidas</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Costos de Envío</span>
                <span className="text-sm font-bold text-amber-300">
                  {currency} {stats.totalShippingCost.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400">Logística & fletes</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Margen Rentabilidad</span>
                <span className="text-sm font-black text-emerald-400">
                  {stats.profitMarginPercent}% ROI
                </span>
                <span className="text-[10px] text-slate-400">Retorno neto</span>
              </div>
            </div>
          </div>

          {/* Orders Preview for that month */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Detalle de Ventas ({monthOrders.length} transacciones)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Incluidas en el informe a exportar
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {monthOrders.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500">
                  No hay transacciones registradas en este período.
                </div>
              ) : (
                monthOrders.map((o) => (
                  <div key={o.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white">
                        {o.orderNumber} - {o.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(o.date).toLocaleDateString()} • {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">{currency} {o.totalSale.toFixed(2)}</div>
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">+{currency} {o.netProfit.toFixed(2)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
