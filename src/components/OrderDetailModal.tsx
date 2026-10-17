import React, { useState } from 'react';
import {
  X,
  Phone,
  MapPin,
  Truck,
  Hash,
  Copy,
  Check,
  Calendar,
  DollarSign,
  Package,
  Layers,
  MessageSquareText,
  CreditCard,
  CheckCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Receipt,
  Share2,
  TrendingUp,
} from 'lucide-react';
import { SaleOrder, Product, Installment, AppSettings } from '../types';
import { VincitEmblem } from './brand/VincitEmblem';
import { storageService, DEFAULT_PAYMENT_DETAILS } from '../services/storageService';
import {
  openWhatsApp,
  openSMS,
  generatePaymentMessage,
  generateInstallmentMessage,
} from '../services/paymentMessageService';

const WhatsAppIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

interface OrderDetailModalProps {
  isOpen: boolean;
  order: SaleOrder | null;
  products: Product[];
  currency: string;
  settings?: AppSettings;
  onClose: () => void;
  onPayQuota?: (order: SaleOrder, installment: Installment) => void;
  onSettleFullDebt?: (order: SaleOrder) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  order,
  products,
  currency,
  settings,
  onClose,
  onPayQuota,
  onSettleFullDebt,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedQuotaId, setCopiedQuotaId] = useState<string | null>(null);

  const appSettings = settings || storageService.getAppSettings();
  const paymentDetails = {
    ...DEFAULT_PAYMENT_DETAILS,
    ...(appSettings?.paymentDetails || {}),
  };
  const isBcvActive = Boolean(paymentDetails.enabledBcvPricing);
  const bcvPercent = typeof paymentDetails.bcvDifferentialPercent === 'number' ? paymentDetails.bcvDifferentialPercent : 15;
  const bcvRate = typeof paymentDetails.bcvRate === 'number' ? paymentDetails.bcvRate : 880;

  if (!isOpen || !order) return null;

  const handleCopyRef = (refText: string) => {
    if (!refText) return;
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleCopyQuotaMessage = (inst: Installment) => {
    const msg = generateInstallmentMessage({
      customerName: order.customerName,
      installmentNumber: inst.number,
      totalInstallments: order.totalInstallments || order.installments?.length || 1,
      quotaAmount: inst.amount,
      dueDate: inst.dueDate,
      remainingAmount: order.remainingAmount || 0,
      appName: settings?.appName,
      currency,
      paymentMethod: order.paymentMethod,
      paymentDetails: settings?.paymentDetails,
    });
    navigator.clipboard.writeText(msg);
    setCopiedQuotaId(inst.id || `${inst.number}`);
    setTimeout(() => setCopiedQuotaId(null), 2500);
  };

  const handleSendQuotaWhatsApp = (inst: Installment) => {
    if (!order.customerPhone) {
      alert('Este cliente no tiene número de teléfono registrado');
      return;
    }
    const msg = generateInstallmentMessage({
      customerName: order.customerName,
      installmentNumber: inst.number,
      totalInstallments: order.totalInstallments || order.installments?.length || 1,
      quotaAmount: inst.amount,
      dueDate: inst.dueDate,
      remainingAmount: order.remainingAmount || 0,
      appName: settings?.appName,
      currency,
      paymentMethod: order.paymentMethod,
      paymentDetails: settings?.paymentDetails,
    });
    openWhatsApp(order.customerPhone, msg);
  };

  const handleSendQuotaSMS = (inst: Installment) => {
    if (!order.customerPhone) {
      alert('Este cliente no tiene número de teléfono registrado');
      return;
    }
    const msg = generateInstallmentMessage({
      customerName: order.customerName,
      installmentNumber: inst.number,
      totalInstallments: order.totalInstallments || order.installments?.length || 1,
      quotaAmount: inst.amount,
      dueDate: inst.dueDate,
      remainingAmount: order.remainingAmount || 0,
      appName: settings?.appName,
      currency,
      paymentMethod: order.paymentMethod,
      paymentDetails: settings?.paymentDetails,
    });
    openSMS(order.customerPhone, msg);
  };

  const isCredit = order.paymentType === 'credito' || (order.installments && order.installments.length > 0);
  const paid = order.paidAmount ?? (isCredit ? 0 : order.totalSale);
  const remaining = order.remainingAmount ?? Math.max(0, order.totalSale - paid);
  const progressPercent = order.totalSale > 0 ? Math.min(100, Math.round((paid / order.totalSale) * 100)) : 100;
  const installments = order.installments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Orden {order.orderNumber}
                </h3>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    order.paymentStatus === 'pagado'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : order.paymentStatus === 'parcial'
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {order.paymentStatus === 'pagado'
                    ? 'Totalmente Pagado'
                    : order.paymentStatus === 'parcial'
                    ? 'Pago Parcial / Cuotas'
                    : 'Pago Pendiente'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registrado el {new Date(order.date).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Tarjeta de Referencia Bancaria y Método de Pago Destacada */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-slate-50 to-indigo-50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-indigo-950/30 border border-sky-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Número de Referencia de Pago
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Hash className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="text-base sm:text-lg font-mono font-black text-slate-900 dark:text-white select-all">
                    {order.paymentReference?.trim() || 'Sin número de referencia'}
                  </span>
                  {order.paymentReference && (
                    <button
                      type="button"
                      onClick={() => handleCopyRef(order.paymentReference || '')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-2xs cursor-pointer ml-1"
                      title="Copiar referencia de pago"
                    >
                      {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRef ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-semibold shadow-2xs">
                  Método: <strong className="capitalize">{order.paymentMethod.replace('_', ' ')}</strong>
                </span>
                <span className="text-xs px-3 py-1 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-semibold shadow-2xs">
                  Modalidad: <strong>{isCredit ? 'A Crédito / Cuotas' : 'Al Contado'}</strong>
                </span>
              </div>
            </div>

            {order.notes && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-700 dark:text-slate-200">Notas de la orden:</strong> {order.notes}
              </div>
            )}
          </div>

          {/* Información del Cliente y Entrega */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                Datos del Comprador
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {order.customerName}
              </div>
              {order.customerPhone ? (
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customerPhone}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">Sin teléfono registrado</div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                Logística y Entrega
              </span>
              <div className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="truncate">{order.customerAddress || 'Retiro en tienda / Sin dirección'}</span>
              </div>
              {order.shippingCourier && (
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 pt-0.5">
                  <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>{order.shippingCourier}</span>
                  {order.trackingNumber && (
                    <span className="font-mono font-bold bg-white dark:bg-slate-700 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-600 ml-1">
                      {order.trackingNumber}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LISTA DE PRODUCTOS VENDIDOS EN ESTA ORDEN CON FOTO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-sky-500" />
                <span>Productos Vendidos ({order.items.length})</span>
              </h4>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {order.items.reduce((acc, i) => acc + i.quantity, 0)} unidades en total
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/50">
              {order.items.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                const photo = item.photoUrl || prod?.photoUrl;

                return (
                  <div key={idx} className="p-3.5 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                    {/* Thumbnail Photo */}
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0 flex items-center justify-center">
                      {photo ? (
                        <img
                          src={photo}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback on broken image
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <VincitEmblem className="w-6 h-6 text-amber-500" />
                      )}
                    </div>

                    {/* Product Name & SKU */}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.productName}
                      </h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {currency}{item.unitPrice.toFixed(2)} c/u
                        </span>
                        {prod?.category && (
                          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.2 rounded-full">
                            {prod.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Subtotal */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md inline-block">
                        x{item.quantity}
                      </div>
                      <div className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">
                        {currency}{(item.unitPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen Financiero y Rentabilidad */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Subtotal Productos:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {currency}{order.totalProductCost ? (order.totalSale - order.totalShippingCost).toFixed(2) : order.totalSale.toFixed(2)}
              </span>
            </div>
            {order.totalShippingCost > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Flete / Envío Cobrado:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  +{currency}{order.totalShippingCost.toFixed(2)}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-baseline justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Total de la Venta:</span>
              <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                {currency} {order.totalSale.toFixed(2)}
              </span>
            </div>

            {/* Total a Tasa Oficial BCV cuando está activo */}
            {isBcvActive && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  Total a Tasa BCV Oficial (+{bcvPercent}%):
                </span>
                <div className="text-right font-mono">
                  <span className="font-black text-amber-900 dark:text-amber-200 text-sm">
                    {currency}{(order.totalSale * (1 + bcvPercent / 100)).toFixed(2)}
                  </span>
                  {bcvRate > 0 && (
                    <span className="block text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      Bs. {(order.totalSale * (1 + bcvPercent / 100) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-xs pt-1 text-emerald-700 dark:text-emerald-400">
              <span className="font-semibold">Ganancia Neta Calculada:</span>
              <span className="font-mono font-bold">
                +{currency}{order.netProfit.toFixed(2)} ({order.profitMarginPercent}% ROI)
              </span>
            </div>
          </div>

          {/* SECCIÓN DETALLADA DE CUOTAS (SI ES CRÉDITO) */}
          {isCredit && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Calendario Completo de Cuotas
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {installments.filter((i) => i.isPaid).length} de {installments.length} cuotas pagadas
                    </p>
                  </div>
                </div>

                {remaining > 0 && onSettleFullDebt && (
                  <button
                    type="button"
                    onClick={() => {
                      onSettleFullDebt(order);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Liquidar Todo</span>
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-900/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Progreso del crédito ({progressPercent}%)</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                    Resta: {currency}{remaining.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Installment Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {installments.map((inst, idx) => {
                  const isOverdue = !inst.isPaid && new Date(inst.dueDate) < new Date(new Date().toISOString().slice(0, 10));
                  const isCopied = copiedQuotaId === (inst.id || `${inst.number}`);

                  return (
                    <div
                      key={`inst-${inst.id || inst.number}-${idx}`}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        inst.isPaid
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                          : isOverdue
                          ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 ring-1 ring-rose-200 dark:ring-rose-900'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              inst.isPaid
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            Cuota {inst.number}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-extrabold bg-rose-600 text-white px-1.5 py-0.5 rounded-md animate-pulse">
                              Vencida
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                          {currency} {inst.amount.toFixed(2)}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Vence: <strong>{inst.dueDate}</strong></span>
                          {inst.isPaid ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Pagada {inst.paidDate ? `(${inst.paidDate})` : ''}
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 font-semibold">Pendiente</span>
                          )}
                        </div>

                        {inst.paymentReference && (
                          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded flex items-center justify-between">
                            <span>Ref: {inst.paymentReference}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyRef(inst.paymentReference || '')}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                              title="Copiar ref"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Botones de Cobro / Pagar Cuota */}
                      {!inst.isPaid ? (
                        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSendQuotaWhatsApp(inst)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                            title="Cobrar vía WhatsApp"
                          >
                            <WhatsAppIcon className="w-3 h-3 fill-white" />
                            <span>Cobrar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendQuotaSMS(inst)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                            title="Cobrar vía SMS"
                          >
                            <MessageSquareText className="w-3 h-3" />
                            <span>SMS</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyQuotaMessage(inst)}
                            className="p-1 rounded-xl text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-700 transition-colors cursor-pointer"
                            title="Copiar mensaje"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                          {onPayQuota && (
                            <button
                              type="button"
                              onClick={() => {
                                onPayQuota(order, inst);
                                onClose();
                              }}
                              className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Pagar</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-100/60 dark:bg-emerald-950/40 p-1.5 rounded-lg text-center">
                          ✓ Cuota cobrada {inst.paymentMethod ? `mediante ${inst.paymentMethod}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cerrar Detalles
          </button>
        </div>
      </div>
    </div>
  );
};
