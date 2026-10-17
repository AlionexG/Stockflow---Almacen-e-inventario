import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  Trash2,
  X,
  TrendingUp,
  User,
  DollarSign,
  Phone,
  MapPin,
  MessageSquareText,
  Send,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Settings,
  CreditCard,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Wallet,
  CheckCheck,
  Sparkles,
  Receipt,
  Layers,
  LayoutGrid,
  List,
  Eye,
  Hash,
  Minus,
} from 'lucide-react';
import { SaleOrder, SaleItem, Product, AppSettings, Installment } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { QuotaPaymentModal } from './QuotaPaymentModal';
import { OrderDetailModal } from './OrderDetailModal';
import { VincitEmblem } from './brand/VincitEmblem';
import {
  generatePaymentMessage,
  generateInstallmentMessage,
  openWhatsApp,
  openSMS,
} from '../services/paymentMessageService';
import { SalesIllustration, CreditSalesIllustration } from './empty-states/EmptyStateIllustration';
import { EmptyStateCard } from './empty-states/EmptyStateCard';
import { storageService, DEFAULT_PAYMENT_DETAILS, getProductDiscountInfo } from '../services/storageService';

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

interface SalesManagerProps {
  orders: SaleOrder[];
  products: Product[];
  currency: string;
  settings?: AppSettings;
  onOpenSettings?: (tab?: 'general' | 'google' | 'themes' | 'payments') => void;
  onAddOrder: (order: Omit<SaleOrder, 'id' | 'orderNumber'>) => void;
  onUpdateOrder?: (order: SaleOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  isOpenNewOrderModal: boolean;
  onCloseNewOrderModal: () => void;
  onOpenNewOrderModal: () => void;
}

export const SalesManager: React.FC<SalesManagerProps> = ({
  orders,
  products,
  currency,
  settings,
  onOpenSettings,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  isOpenNewOrderModal,
  onCloseNewOrderModal,
  onOpenNewOrderModal,
}) => {
  // Sub-menu Tab: 'completed' (Ventas Realizadas / Pagadas) | 'credit' (Ventas a Crédito / Pagos Pendientes)
  const [salesSubTab, setSalesSubTab] = useState<'completed' | 'credit'>('completed');

  // Configuración BCV diferencial
  const paymentDetails = {
    ...DEFAULT_PAYMENT_DETAILS,
    ...(settings?.paymentDetails || storageService.getAppSettings().paymentDetails || {}),
  };
  const isBcvActive = Boolean(paymentDetails.enabledBcvPricing);
  const bcvPercent = typeof paymentDetails.bcvDifferentialPercent === 'number' ? paymentDetails.bcvDifferentialPercent : 15;
  const bcvRate = typeof paymentDetails.bcvRate === 'number' ? paymentDetails.bcvRate : 880;

  // View Mode: 'grid' | 'table' (works on Mobile & PC)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [search, setSearch] = useState('');
  const [orderToDelete, setOrderToDelete] = useState<SaleOrder | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<SaleOrder | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedQuotaId, setCopiedQuotaId] = useState<string | null>(null);
  const [copiedModal, setCopiedModal] = useState(false);
  const [showPaymentMessagePreview, setShowPaymentMessagePreview] = useState(false);
  const [debtSettledToast, setDebtSettledToast] = useState<string | null>(null);

  // Modal for paying a quota
  const [payingOrder, setPayingOrder] = useState<SaleOrder | null>(null);
  const [payingInstallment, setPayingInstallment] = useState<Installment | null>(null);

  // New Order Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 1 },
  ]);
  const [shippingCourier, setShippingCourier] = useState('DHL Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [actualShippingCost, setActualShippingCost] = useState<number | ''>(5);
  const [shippingChargedToCustomer, setShippingChargedToCustomer] = useState<number | ''>(5);
  const [paymentMethod, setPaymentMethod] = useState<SaleOrder['paymentMethod']>('pago_movil');
  const [notes, setNotes] = useState('');

  // Credit / Installments configuration in New Order form
  const [paymentType, setPaymentType] = useState<'contado' | 'credito'>('contado');
  const [installmentCount, setInstallmentCount] = useState<number>(3);
  const [installmentFrequency, setInstallmentFrequency] = useState<'semanal' | 'quincenal' | 'mensual'>('quincenal');
  const [initialDownPayment, setInitialDownPayment] = useState<number | ''>(0);
  const [customInstallments, setCustomInstallments] = useState<
    { number: number; amount: number; dueDate: string }[]
  >([]);

  // Calculate order preview totals
  let calculatedProductCost = 0;
  let calculatedProductSales = 0;
  let calculatedPackagingCost = 0;

  const validItems: SaleItem[] = [];
  for (const sel of selectedItems) {
    const prod = products.find((p) => p.id === sel.productId);
    if (prod && sel.quantity > 0) {
      const uCost = prod.unitQuotation || prod.unitPriceCost || prod.productPrice || 0;
      const uPackaging = (prod.packagingCarton || 0) + (prod.packagingBolsita || 0) + (prod.packagingLogo || 0);
      const disc = getProductDiscountInfo(prod);
      const effectiveSellingPrice = disc.effectivePrice;
      calculatedProductCost += uCost * sel.quantity;
      calculatedProductSales += effectiveSellingPrice * sel.quantity;
      calculatedPackagingCost += uPackaging * sel.quantity;
      validItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: sel.quantity,
        unitCost: uCost,
        unitPrice: effectiveSellingPrice,
        unitShipping: prod.shippingCostUnit || 0,
        photoUrl: prod.photoUrl,
      });
    }
  }

  const numActualShipping = typeof actualShippingCost === 'number' ? actualShippingCost : 0;
  const numChargedShipping = typeof shippingChargedToCustomer === 'number' ? shippingChargedToCustomer : 0;

  const totalSale = calculatedProductSales + numChargedShipping;
  const totalCost = calculatedProductCost + calculatedPackagingCost + numActualShipping;
  const netProfit = totalSale - totalCost;
  const profitMarginPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  // Auto-generate installments schedule whenever totalSale, installmentCount, frequency or downPayment changes
  useEffect(() => {
    if (paymentType !== 'credito') return;

    const downPay = typeof initialDownPayment === 'number' ? Math.max(0, initialDownPayment) : 0;
    const financeTotal = Math.max(0, totalSale - downPay);
    const count = Math.max(1, installmentCount);
    const baseQuota = Number((financeTotal / count).toFixed(2));

    const today = new Date();
    const newSchedule: { number: number; amount: number; dueDate: string }[] = [];

    for (let i = 1; i <= count; i++) {
      const d = new Date(today);
      if (installmentFrequency === 'semanal') {
        d.setDate(d.getDate() + 7 * i);
      } else if (installmentFrequency === 'quincenal') {
        d.setDate(d.getDate() + 15 * i);
      } else {
        d.setMonth(d.getMonth() + i);
      }

      // Adjust any rounding cent difference on the last quota
      const isLast = i === count;
      const quotaAmount = isLast
        ? Number((financeTotal - baseQuota * (count - 1)).toFixed(2))
        : baseQuota;

      newSchedule.push({
        number: i,
        amount: Math.max(0, quotaAmount),
        dueDate: d.toISOString().slice(0, 10),
      });
    }

    setCustomInstallments(newSchedule);
  }, [totalSale, installmentCount, installmentFrequency, initialDownPayment, paymentType]);

  const handleUpdateCustomInstallment = (index: number, field: 'amount' | 'dueDate', value: any) => {
    const updated = [...customInstallments];
    if (field === 'amount') {
      updated[index].amount = Math.max(0, parseFloat(value) || 0);
    } else {
      updated[index].dueDate = value;
    }
    setCustomInstallments(updated);
  };

  // Filter orders by search term
  const searchFilteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
        (o.paymentReference && o.paymentReference.toLowerCase().includes(q)) ||
        (o.shippingCourier && o.shippingCourier.toLowerCase().includes(q)) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    });
  }, [orders, search]);

  // Split into active pending credits vs general completed sales
  const activeCreditOrders = useMemo(() => {
    return searchFilteredOrders.filter((o) => {
      const remaining = o.remainingAmount ?? (o.totalSale - (o.paidAmount ?? 0));
      if (o.paymentType === 'credito') {
        return o.paymentStatus !== 'pagado' && remaining > 0;
      }
      if (o.installments && o.installments.length > 0 && remaining > 0 && o.paymentStatus !== 'pagado') {
        return true;
      }
      return false;
    });
  }, [searchFilteredOrders]);

  const completedSales = useMemo(() => {
    const activeCreditIds = new Set(activeCreditOrders.map((o) => o.id));
    return searchFilteredOrders.filter((o) => !activeCreditIds.has(o.id));
  }, [searchFilteredOrders, activeCreditOrders]);

  // Total pending receivables
  const totalReceivables = useMemo(() => {
    return activeCreditOrders.reduce((sum, o) => {
      const remaining = o.remainingAmount ?? (o.totalSale - (o.paidAmount ?? 0));
      return sum + Math.max(0, remaining);
    }, 0);
  }, [activeCreditOrders]);

  // Total collected from credits
  const totalCollectedFromCredits = useMemo(() => {
    return activeCreditOrders.reduce((sum, o) => {
      return sum + (o.paidAmount || 0);
    }, 0);
  }, [activeCreditOrders]);

  // Total pending quotas count
  const pendingQuotasCount = useMemo(() => {
    return activeCreditOrders.reduce((count, o) => {
      const pendingQuotas = (o.installments || []).filter((i) => !i.isPaid).length;
      return count + (pendingQuotas || 1);
    }, 0);
  }, [activeCreditOrders]);

  const handleAddItemRow = () => {
    const firstAvailable = products.find((p) => !selectedItems.some((s) => s.productId === p.id));
    setSelectedItems([
      ...selectedItems,
      { productId: firstAvailable ? firstAvailable.id : products[0]?.id || '', quantity: 1 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, productId: string, quantity: number) => {
    const updated = [...selectedItems];
    updated[index] = { productId, quantity: Math.max(1, quantity) };
    setSelectedItems(updated);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }
    if (validItems.length === 0) {
      alert('Debes agregar al menos un producto a la venta');
      return;
    }

    const downPay = typeof initialDownPayment === 'number' ? Math.max(0, initialDownPayment) : 0;
    const remaining = Math.max(0, totalSale - downPay);

    if (paymentType === 'credito') {
      const fullInstallments: Installment[] = customInstallments.map((ci) => ({
        id: `inst-${Date.now()}-${ci.number}`,
        number: ci.number,
        amount: Number(ci.amount.toFixed(2)),
        dueDate: ci.dueDate,
        isPaid: false,
      }));

      onAddOrder({
        date: new Date().toISOString(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        items: validItems,
        totalSale: Number(totalSale.toFixed(2)),
        totalProductCost: Number(calculatedProductCost.toFixed(2)),
        totalShippingCost: Number(numActualShipping.toFixed(2)),
        extraExpenses: Number(calculatedPackagingCost.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
        shippingStatus: 'preparando',
        paymentStatus: remaining <= 0 ? 'pagado' : downPay > 0 ? 'parcial' : 'pendiente',
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        shippingCourier,
        trackingNumber,
        notes: notes.trim(),
        paymentType: 'credito',
        totalInstallments: customInstallments.length,
        installments: fullInstallments,
        paidAmount: Number(downPay.toFixed(2)),
        remainingAmount: Number(remaining.toFixed(2)),
      });

      setSalesSubTab('credit');
    } else {
      onAddOrder({
        date: new Date().toISOString(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        items: validItems,
        totalSale: Number(totalSale.toFixed(2)),
        totalProductCost: Number(calculatedProductCost.toFixed(2)),
        totalShippingCost: Number(numActualShipping.toFixed(2)),
        extraExpenses: Number(calculatedPackagingCost.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
        shippingStatus: 'preparando',
        paymentStatus: 'pagado',
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        shippingCourier,
        trackingNumber,
        notes: notes.trim(),
        paymentType: 'contado',
        paidAmount: Number(totalSale.toFixed(2)),
        remainingAmount: 0,
        totalInstallments: 1,
        installments: [],
      });
      setSalesSubTab('completed');
    }

    // Reset Form
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setPaymentReference('');
    setSelectedItems([{ productId: products[0]?.id || '', quantity: 1 }]);
    setNotes('');
    setPaymentType('contado');
    setInstallmentCount(3);
    setInitialDownPayment(0);
    onCloseNewOrderModal();
  };

  // WhatsApp Sender for Order
  const handleSendOrderWhatsApp = (order: SaleOrder) => {
    if (!order.customerPhone) {
      alert('Este cliente no tiene número de teléfono registrado');
      return;
    }
    const message = generatePaymentMessage({
      customerName: order.customerName,
      items: order.items,
      totalSale: order.totalSale,
      shippingChargedToCustomer: order.totalShippingCost,
      paymentMethod: order.paymentMethod,
      appName: settings?.appName,
      currency,
      paymentDetails: settings?.paymentDetails,
      orderNumber: order.orderNumber,
    });
    openWhatsApp(order.customerPhone, message);
  };

  // SMS Sender for Order
  const handleSendOrderSMS = (order: SaleOrder) => {
    if (!order.customerPhone) {
      alert('Este cliente no tiene número de teléfono registrado');
      return;
    }
    const message = generatePaymentMessage({
      customerName: order.customerName,
      items: order.items,
      totalSale: order.totalSale,
      shippingChargedToCustomer: order.totalShippingCost,
      paymentMethod: order.paymentMethod,
      appName: settings?.appName,
      currency,
      paymentDetails: settings?.paymentDetails,
      orderNumber: order.orderNumber,
    });
    openSMS(order.customerPhone, message);
  };

  // Copy Order Message to Clipboard
  const handleCopyOrderMessage = (order: SaleOrder) => {
    const message = generatePaymentMessage({
      customerName: order.customerName,
      items: order.items,
      totalSale: order.totalSale,
      shippingChargedToCustomer: order.totalShippingCost,
      paymentMethod: order.paymentMethod,
      appName: settings?.appName,
      currency,
      paymentDetails: settings?.paymentDetails,
      orderNumber: order.orderNumber,
    });
    navigator.clipboard.writeText(message);
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  // Confirming quota payment and updating order state
  const handleConfirmQuotaPayment = (
    orderId: string,
    installmentNumber: number,
    quotaPaymentMethod: SaleOrder['paymentMethod'],
    quotaNotes?: string,
    quotaPaymentReference?: string
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const currentInstallments = order.installments || [];
    const targetInstallment = currentInstallments.find((i) => i.number === installmentNumber);
    if (!targetInstallment) return;

    const updatedInstallments = currentInstallments.map((inst) => {
      if (inst.number === installmentNumber) {
        return {
          ...inst,
          isPaid: true,
          paidDate: new Date().toISOString().slice(0, 10),
          paymentMethod: quotaPaymentMethod,
          paymentReference: quotaPaymentReference || inst.paymentReference,
          notes: quotaNotes,
        };
      }
      return inst;
    });

    const newPaidAmount = Number(
      ((order.paidAmount || 0) + targetInstallment.amount).toFixed(2)
    );
    const newRemainingAmount = Math.max(
      0,
      Number((order.totalSale - newPaidAmount).toFixed(2))
    );
    const isFullyPaid =
      newRemainingAmount <= 0 || updatedInstallments.every((i) => i.isPaid);

    const updatedOrder: SaleOrder = {
      ...order,
      installments: updatedInstallments,
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      paymentStatus: isFullyPaid ? 'pagado' : 'parcial',
    };

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    if (selectedDetailOrder && selectedDetailOrder.id === orderId) {
      setSelectedDetailOrder(updatedOrder);
    }

    if (isFullyPaid) {
      setDebtSettledToast(
        `🎉 ¡Deuda saldada al 100%! El pedido ${order.orderNumber} de ${order.customerName} ha completado todas sus cuotas y se ha trasladado al apartado general de ventas hechas.`
      );
      setTimeout(() => setDebtSettledToast(null), 6000);
    }
  };

  // Full debt settlement in one click
  const handleSettleFullDebt = (order: SaleOrder) => {
    if (
      !window.confirm(
        `¿Confirmas liquidar la totalidad de la deuda restante (${currency}${order.remainingAmount?.toFixed(
          2
        )}) para el cliente ${order.customerName}?`
      )
    ) {
      return;
    }

    const updatedInstallments = (order.installments || []).map((inst) => ({
      ...inst,
      isPaid: true,
      paidDate: inst.paidDate || new Date().toISOString().slice(0, 10),
    }));

    const updatedOrder: SaleOrder = {
      ...order,
      installments: updatedInstallments,
      paidAmount: order.totalSale,
      remainingAmount: 0,
      paymentStatus: 'pagado',
    };

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    if (selectedDetailOrder && selectedDetailOrder.id === order.id) {
      setSelectedDetailOrder(updatedOrder);
    }

    setDebtSettledToast(
      `🎉 ¡Deuda saldada al 100%! El pedido ${order.orderNumber} de ${order.customerName} ha sido liquidado.`
    );
    setTimeout(() => setDebtSettledToast(null), 6000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Alert when a credit debt is 100% settled */}
      {debtSettledToast && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-5 h-5 shrink-0" />
            <span>{debtSettledToast}</span>
          </div>
          <button
            onClick={() => setDebtSettledToast(null)}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SUB-MENU TABS BAR: VENTAS REALIZADAS vs CRÉDITOS & CUOTAS PENDIENTES */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 transition-colors">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800 rounded-xl overflow-x-auto no-scrollbar">
          {/* Sub-tab 1: Ventas Realizadas / Pagadas */}
          <button
            onClick={() => setSalesSubTab('completed')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              salesSubTab === 'completed'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ventas Realizadas</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-slate-200/70 dark:bg-slate-600 text-slate-800 dark:text-slate-200">
              {completedSales.length}
            </span>
          </button>

          {/* Sub-tab 2: Créditos & Cuotas Pendientes */}
          <button
            onClick={() => setSalesSubTab('credit')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
              salesSubTab === 'credit'
                ? 'bg-white dark:bg-slate-700 text-amber-900 dark:text-amber-300 shadow-xs ring-1 ring-amber-300 dark:ring-amber-500/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Créditos & Cuotas Pendientes</span>
            {activeCreditOrders.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500 text-white shadow-2xs animate-pulse">
                {activeCreditOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Button: Registrar Nueva Venta */}
        <button
          onClick={onOpenNewOrderModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Venta o Crédito</span>
        </button>
      </div>

      {/* TOOLBAR: SEARCH BAR & VIEW MODE SWITCHER (CUADRÍCULA vs LISTA EN MÓVIL Y PC) */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, N° pedido, referencia, teléfono o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* View Mode Toggle: Grid vs List (disponible para Móvil y PC) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="Vista en Cuadrícula (Móvil & PC)"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-500" />
            <span>Cuadrícula</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="Vista en Lista (Móvil & PC)"
          >
            <List className="w-3.5 h-3.5 text-sky-500" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SUB-TAB 1: VENTAS REALIZADAS / PAGADAS */}
      {/* ==================================================================== */}
      {salesSubTab === 'completed' && (
        <div className="space-y-4">
          {completedSales.length === 0 ? (
            <EmptyStateCard
              illustration={<SalesIllustration size={210} />}
              title="Aún no tienes ventas realizadas"
              description="Registra tus ventas al contado o facturadas. El sistema descontará inventario en tiempo real, calculará tu ganancia neta exacta y te permitirá enviar comprobantes con tus datos de pago por WhatsApp y SMS."
              actionText="Registrar Primera Venta"
              actionIcon={Plus}
              onAction={onOpenNewOrderModal}
              benefits={[
                {
                  icon: ShoppingCart,
                  title: 'Descuento de Stock en Vivo',
                  description: 'Sincroniza automáticamente la cantidad de piezas disponibles en tu catálogo.',
                },
                {
                  icon: TrendingUp,
                  title: 'Ganancia Neta y ROI',
                  description: 'Resta costo de mercancía, flete por lote y empaques para conocer tu beneficio real.',
                },
                {
                  icon: MessageSquareText,
                  title: 'Envío de Recibos y Cobros',
                  description: 'Genera mensajes formales listos para compartir con números de referencia bancaria.',
                },
              ]}
            />
          ) : viewMode === 'grid' ? (
            /* VISTA CUADRÍCULA: VENTAS REALIZADAS */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedSales.map((o) => {
                const isCreditFullyPaid = o.paymentType === 'credito';
                const firstItem = o.items[0];
                const matchingProd = firstItem ? products.find((p) => p.id === firstItem.productId) : null;
                const photo = firstItem?.photoUrl || matchingProd?.photoUrl;

                return (
                  <div
                    key={o.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all p-4 sm:p-5 flex flex-col justify-between gap-4 text-slate-900 dark:text-slate-100"
                  >
                    {/* Top Row: Order # & Date */}
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          {o.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(o.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="pt-2.5 space-y-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {o.customerName}
                        </h4>
                        {o.customerPhone && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{o.customerPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* Payment Reference Badge if exists */}
                      {o.paymentReference && (
                        <div className="mt-2 text-[11px] font-mono text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800/80 flex items-center gap-1.5 truncate">
                          <Hash className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span className="truncate">Ref: {o.paymentReference}</span>
                        </div>
                      )}

                      {/* Product Preview With Photo */}
                      <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                          {photo ? (
                            <img src={photo} alt={firstItem?.productName} className="w-full h-full object-cover" />
                          ) : (
                            <VincitEmblem className="w-6 h-6 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {firstItem?.productName || 'Producto'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>x{firstItem?.quantity} unidades</span>
                            {o.items.length > 1 && (
                              <span className="font-semibold text-sky-600 dark:text-sky-400">
                                +{o.items.length - 1} otro(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Financial Metrics */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Venta Total</span>
                          <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                            {currency} {o.totalSale.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold block">Ganancia</span>
                          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                            +{currency} {o.netProfit.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Precio y Conversión BCV Oficial */}
                      {isBcvActive && (
                        <div className="mt-2 p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            BCV (+{bcvPercent}%):
                          </span>
                          <div className="text-right font-mono">
                            <span className="font-black text-amber-900 dark:text-amber-200">
                              {currency}{(o.totalSale * (1 + bcvPercent / 100)).toFixed(2)}
                            </span>
                            {bcvRate > 0 && (
                              <span className="block text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                Bs. {(o.totalSale * (1 + bcvPercent / 100) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons: Ver Más, WhatsApp, SMS, Delete */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSendOrderWhatsApp(o)}
                          className="p-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                          title="Enviar resumen por WhatsApp"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendOrderSMS(o)}
                          className="p-2 rounded-xl text-white bg-sky-600 hover:bg-sky-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                          title="Enviar cobro por SMS"
                        >
                          <MessageSquareText className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailOrder(o)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-500" />
                          <span>Ver más</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOrderToDelete(o)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar venta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VISTA LISTA / TABLA: VENTAS REALIZADAS */
            <div className="space-y-3">
              {completedSales.map((o) => {
                const firstItem = o.items[0];
                const matchingProd = firstItem ? products.find((p) => p.id === firstItem.productId) : null;
                const photo = firstItem?.photoUrl || matchingProd?.photoUrl;

                return (
                  <div
                    key={o.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 text-slate-900 dark:text-slate-100"
                  >
                    {/* Left: Thumbnail & Customer info */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {photo ? (
                          <img src={photo} alt={firstItem?.productName} className="w-full h-full object-cover" />
                        ) : (
                          <VincitEmblem className="w-6 h-6 text-amber-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md">
                            {o.orderNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {new Date(o.date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {o.paymentReference && (
                            <span className="text-[10px] font-mono text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                              Ref: {o.paymentReference}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {o.customerName}
                          </h4>
                          {o.customerPhone && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              • {o.customerPhone}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Financial details */}
                    <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Total</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                          {currency} {o.totalSale.toFixed(2)}
                        </div>
                        {isBcvActive && (
                          <div className="text-[10.5px] font-bold text-amber-800 dark:text-amber-300 font-mono mt-0.5">
                            BCV: {currency}{(o.totalSale * (1 + bcvPercent / 100)).toFixed(2)}
                            {bcvRate > 0 && (
                              <span className="block text-[9px] text-amber-700 dark:text-amber-400 font-normal">
                                Bs. {(o.totalSale * (1 + bcvPercent / 100) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Ganancia</div>
                        <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                          +{currency} {o.netProfit.toFixed(2)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          type="button"
                          onClick={() => handleSendOrderWhatsApp(o)}
                          className="p-1.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                          title="Enviar por WhatsApp"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDetailOrder(o)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-500" />
                          <span>Ver más</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(o)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-TAB 2: VENTAS A CRÉDITO / CUOTAS PENDIENTES */}
      {/* ==================================================================== */}
      {salesSubTab === 'credit' && (
        <div className="space-y-4">
          {/* Credit KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-2xl shadow-sm border border-amber-400">
              <div className="flex items-center justify-between text-xs text-amber-100 uppercase tracking-wider font-semibold mb-1">
                <span>Por Cobrar (Pendiente)</span>
                <Clock className="w-4 h-4 text-amber-200" />
              </div>
              <div className="text-2xl font-black font-mono">
                {currency} {totalReceivables.toFixed(2)}
              </div>
              <div className="text-[11px] text-amber-100 mt-0.5">
                {pendingQuotasCount} cuotas por cobrar en {activeCreditOrders.length} clientes
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">
                <span>Cobrado en Cuotas</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {currency} {totalCollectedFromCredits.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">
                Abonado por compradores
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mb-1">
                <span>Créditos Activos</span>
                <Wallet className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {activeCreditOrders.length}
              </div>
              <div className="text-[11px] text-slate-400">
                Órdenes en financiamiento
              </div>
            </div>
          </div>

          {activeCreditOrders.length === 0 ? (
            <EmptyStateCard
              illustration={<CreditSalesIllustration size={210} />}
              title="No tienes ventas a crédito pendientes"
              description="¡Excelente trabajo! Todos los créditos y cuotas programadas están completamente saldados o aún no has emitido ventas en cuotas."
              actionText="Registrar Venta a Crédito"
              actionIcon={Plus}
              onAction={() => {
                setPaymentType('credito');
                onOpenNewOrderModal();
              }}
              benefits={[
                {
                  icon: Calendar,
                  title: 'Control Automatizado de Fechas',
                  description: 'Cronograma semanal, quincenal o mensual para no olvidar ningún cobro.',
                },
                {
                  icon: Wallet,
                  title: 'Progreso y Saldos Restantes',
                  description: 'Barra de progreso de liquidación y control exacto de deuda pendiente por cliente.',
                },
                {
                  icon: CheckCheck,
                  title: 'Traslado Automático al Saldar',
                  description: 'Al pagar el 100% de la deuda total, la venta pasa automáticamente al apartado general de ventas hechas.',
                },
              ]}
            />
          ) : viewMode === 'grid' ? (
            /* VISTA CUADRÍCULA OPTIMIZADA: VENTAS A CUOTAS (CON NÚMERO DE CUOTAS OCULTO Y BOTÓN VER MÁS) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCreditOrders.map((order) => {
                const paid = order.paidAmount || 0;
                const remaining = order.remainingAmount ?? (order.totalSale - paid);
                const progressPercent = order.totalSale > 0 ? Math.min(100, Math.round((paid / order.totalSale) * 100)) : 0;
                const installments = order.installments || [];
                const paidCount = installments.filter((i) => i.isPaid).length;
                const firstPending = installments.find((i) => !i.isPaid);
                const firstItem = order.items[0];
                const matchingProd = firstItem ? products.find((p) => p.id === firstItem.productId) : null;
                const photo = firstItem?.photoUrl || matchingProd?.photoUrl;

                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200/90 dark:border-amber-900/40 shadow-sm p-4 sm:p-5 flex flex-col justify-between gap-4 hover:border-amber-400 dark:hover:border-amber-700/60 transition-all text-slate-900 dark:text-slate-100"
                  >
                    <div>
                      {/* Top Header: Order #, Status & Date */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-mono font-bold text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(order.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="pt-2.5 space-y-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">
                          {order.customerName}
                        </h4>
                        {order.customerPhone && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{order.customerPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* Payment Reference Badge if exists */}
                      {order.paymentReference && (
                        <div className="mt-2 text-[11px] font-mono text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800/80 flex items-center gap-1.5 truncate">
                          <Hash className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span className="truncate">Ref: {order.paymentReference}</span>
                        </div>
                      )}

                      {/* Product Preview With Photo */}
                      <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                          {photo ? (
                            <img src={photo} alt={firstItem?.productName} className="w-full h-full object-cover" />
                          ) : (
                            <VincitEmblem className="w-6 h-6 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {firstItem?.productName || 'Producto'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>x{firstItem?.quantity} uds</span>
                            {order.items.length > 1 && (
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                +{order.items.length - 1} más
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Balances Box */}
                      <div className="mt-3.5 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-slate-50 to-orange-50/60 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {paidCount} de {order.totalInstallments || installments.length} cuotas pagadas ({progressPercent}%)
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {currency}{paid.toFixed(2)}
                          </span>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">
                            {firstPending ? `Próx. vence: ${firstPending.dueDate}` : 'Todas pagadas'}
                          </span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                            Resta: {currency}{remaining.toFixed(2)}
                          </span>
                        </div>

                        {/* BCV Reference */}
                        {isBcvActive && (
                          <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between text-[10.5px]">
                            <span className="font-bold text-amber-900 dark:text-amber-200">
                              Total BCV: {currency}{(order.totalSale * (1 + bcvPercent / 100)).toFixed(2)}
                            </span>
                            <span className="font-bold text-rose-700 dark:text-rose-400 font-mono">
                              Resta BCV: {currency}{(remaining * (1 + bcvPercent / 100)).toFixed(2)}
                              {bcvRate > 0 && ` (Bs. ${(remaining * (1 + bcvPercent / 100) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Row: Ver más, WhatsApp cobro, Liquidar Deuda */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        {firstPending && (
                          <button
                            type="button"
                            onClick={() => {
                              const msg = generateInstallmentMessage({
                                customerName: order.customerName,
                                installmentNumber: firstPending.number,
                                totalInstallments: order.totalInstallments || installments.length,
                                quotaAmount: firstPending.amount,
                                dueDate: firstPending.dueDate,
                                remainingAmount: remaining,
                                appName: settings?.appName,
                                currency,
                                paymentMethod: order.paymentMethod,
                                paymentDetails: settings?.paymentDetails,
                              });
                              if (order.customerPhone) openWhatsApp(order.customerPhone, msg);
                            }}
                            className="p-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                            title="Cobrar próxima cuota por WhatsApp"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSettleFullDebt(order)}
                          className="p-2 rounded-xl text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 shadow-2xs active:scale-95 transition-all cursor-pointer"
                          title="Liquidar deuda completa"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/50 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Ver más</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setOrderToDelete(order)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar crédito"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VISTA LISTA / TABLA: VENTAS A CUOTAS */
            <div className="space-y-3">
              {activeCreditOrders.map((order) => {
                const paid = order.paidAmount || 0;
                const remaining = order.remainingAmount ?? (order.totalSale - paid);
                const progressPercent = order.totalSale > 0 ? Math.min(100, Math.round((paid / order.totalSale) * 100)) : 0;
                const installments = order.installments || [];
                const paidCount = installments.filter((i) => i.isPaid).length;
                const firstPending = installments.find((i) => !i.isPaid);
                const firstItem = order.items[0];
                const matchingProd = firstItem ? products.find((p) => p.id === firstItem.productId) : null;
                const photo = firstItem?.photoUrl || matchingProd?.photoUrl;

                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/90 dark:border-amber-900/40 shadow-2xs hover:shadow-xs transition-all p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 text-slate-900 dark:text-slate-100"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {photo ? (
                          <img src={photo} alt={firstItem?.productName} className="w-full h-full object-cover" />
                        ) : (
                          <VincitEmblem className="w-6 h-6 text-amber-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-md">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {new Date(order.date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {order.paymentReference && (
                            <span className="text-[10px] font-mono text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                              Ref: {order.paymentReference}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            {paidCount}/{order.totalInstallments || installments.length} cuotas pagadas
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {order.customerName}
                          </h4>
                          {order.customerPhone && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              • {order.customerPhone}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Progress and Remaining */}
                    <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Crédito</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                          {currency} {order.totalSale.toFixed(2)}
                        </div>
                        {isBcvActive && (
                          <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 font-mono mt-0.5">
                            BCV: {currency}{(order.totalSale * (1 + bcvPercent / 100)).toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className="text-right pl-3 border-l border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-semibold">Restante</div>
                        <div className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                          {currency} {remaining.toFixed(2)}
                        </div>
                        {isBcvActive && (
                          <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 font-mono mt-0.5">
                            BCV: {currency}{(remaining * (1 + bcvPercent / 100)).toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/50 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Ver más</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSettleFullDebt(order)}
                          className="p-1.5 rounded-xl text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
                          title="Liquidar deuda"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(order)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REGISTRAR NUEVA VENTA / PEDIDO (AL CONTADO O A CRÉDITO) */}
      {/* ==================================================================== */}
      {isOpenNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shadow-xs">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Registrar Nueva Venta / Pedido</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Múltiples productos, cálculo de ganancia, número de referencia y opción de cuotas
                  </p>
                </div>
              </div>
              <button
                onClick={onCloseNewOrderModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Modalidad de Pago Selector: Al Contado vs A Crédito */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Modalidad de Venta *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('contado')}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentType === 'contado'
                        ? 'border-sky-600 bg-sky-50/80 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 ring-2 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Al Contado (Pagado)</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">El cliente cancela el 100% ahora</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('credito')}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentType === 'credito'
                        ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">A Crédito / En Cuotas</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Venta a plazos con calendario</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp (para cobros)
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0414-1234567 o +58 414..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dirección de Entrega
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Calle, número, urbanización, ciudad"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* SELECCIÓN DE PRODUCTOS CON FOTO Y MÚLTIPLES ARTÍCULOS */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-sky-500" />
                      <span>Productos a Registrar ({selectedItems.length})</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Puedes añadir varios productos a la misma orden con fotos y cantidades independientes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-700 shadow-2xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar otro producto
                  </button>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {selectedItems.map((item, index) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const photo = prod?.photoUrl;
                    const disc = getProductDiscountInfo(prod);
                    const itemUnit = disc.effectivePrice;
                    const itemSubtotal = itemUnit * item.quantity;

                    return (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs"
                      >
                        {/* Product Photo Thumbnail */}
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0 flex items-center justify-center">
                          {photo ? (
                            <img src={photo} alt={prod?.name} className="w-full h-full object-cover" />
                          ) : (
                            <VincitEmblem className="w-6 h-6 text-amber-500" />
                          )}
                        </div>

                        {/* Product Selector */}
                        <div className="flex-1 min-w-0">
                          <select
                            value={item.productId}
                            onChange={(e) => handleUpdateItem(index, e.target.value, item.quantity)}
                            className="w-full text-xs font-bold py-2 px-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          >
                            {products.map((p) => {
                              const pDisc = getProductDiscountInfo(p);
                              const pEffective = pDisc.effectivePrice;
                              const bcvPriceUsd = pEffective * (1 + bcvPercent / 100);
                              return (
                                <option key={p.id} value={p.id}>
                                  {p.name} • Stock: {p.stock} • P. Venta: {currency}{pEffective.toFixed(2)}{pDisc.hasDiscount ? ` (-${pDisc.percent}% OFF)` : ''}
                                  {isBcvActive ? ` | BCV: ${currency}${bcvPriceUsd.toFixed(2)}` : ''}
                                </option>
                              );
                            })}
                          </select>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                            <span>
                              Precio:{' '}
                              {disc.hasDiscount ? (
                                <>
                                  <span className="line-through text-slate-400 mr-1">{currency}{(prod?.sellingPriceUnit || 0).toFixed(2)}</span>
                                  <strong className="text-rose-600 dark:text-rose-400">{currency}{itemUnit.toFixed(2)} (-{disc.percent}%)</strong>
                                </>
                              ) : (
                                <strong>{currency}{itemUnit.toFixed(2)}</strong>
                              )}
                            </span>
                            {isBcvActive && (
                              <span className="text-amber-800 dark:text-amber-300 font-bold bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                BCV (+{bcvPercent}%): {currency}{(itemUnit * (1 + bcvPercent / 100)).toFixed(2)}
                                {bcvRate > 0 && ` • Bs. ${(itemUnit * (1 + bcvPercent / 100) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </span>
                            )}
                            <span>•</span>
                            <span className={prod && prod.stock > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 font-bold'}>
                              {prod ? `${prod.stock} disponibles` : 'Sin stock'}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center justify-between sm:justify-start gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(index, item.productId, Math.max(1, item.quantity - 1))}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={prod?.stock || 999}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(index, item.productId, parseInt(e.target.value, 10) || 1)
                              }
                              className="w-12 text-center text-xs font-black py-1 rounded bg-transparent text-slate-900 dark:text-white font-mono focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(index, item.productId, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Line Subtotal */}
                          <div className="text-right shrink-0 min-w-[70px]">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Subtotal</div>
                            <div className="text-xs font-black font-mono text-slate-900 dark:text-white">
                              {currency}{itemSubtotal.toFixed(2)}
                            </div>
                          </div>

                          {/* Delete Item Row */}
                          {selectedItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(index)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Quitar este producto"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/80">
                  <span>{validItems.length} producto(s) en orden</span>
                  <span>Subtotal mercancía: <strong className="text-slate-900 dark:text-white font-mono">{currency}{calculatedProductSales.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* SECTION: CONFIGURACIÓN DE CUOTAS Y CRÉDITO (SI ES A CRÉDITO) */}
              {paymentType === 'credito' && (
                <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-amber-950/30 p-4 rounded-2xl border border-amber-300 dark:border-amber-800/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-200 dark:border-amber-800/60">
                    <Wallet className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-300 uppercase tracking-wider">
                      Configuración de Cuotas y Plazos de Pago
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Número de Cuotas
                      </label>
                      <select
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value={2}>2 Cuotas</option>
                        <option value={3}>3 Cuotas</option>
                        <option value={4}>4 Cuotas</option>
                        <option value={5}>5 Cuotas</option>
                        <option value={6}>6 Cuotas</option>
                        <option value={8}>8 Cuotas</option>
                        <option value={10}>10 Cuotas</option>
                        <option value={12}>12 Cuotas</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Frecuencia de Pago
                      </label>
                      <select
                        value={installmentFrequency}
                        onChange={(e) => setInstallmentFrequency(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="semanal">Semanal (Cada 7 días)</option>
                        <option value="quincenal">Quincenal (Cada 15 días)</option>
                        <option value="mensual">Mensual (Cada 30 días)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Anticipo Inicial ({currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={initialDownPayment}
                        onChange={(e) =>
                          setInitialDownPayment(e.target.value === '' ? '' : parseFloat(e.target.value))
                        }
                        placeholder="0.00"
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Quotas Schedule List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <span>Calendario de Pagos Calculado:</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Puedes editar fechas o montos</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {customInstallments.map((ci, idx) => (
                        <div
                          key={`ci-${ci.number}-${idx}`}
                          className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-amber-200/90 dark:border-amber-800 shadow-2xs flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md shrink-0">
                            Cuota #{ci.number}
                          </span>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="text-slate-400 font-bold">{currency}</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={ci.amount}
                              onChange={(e) => handleUpdateCustomInstallment(idx, 'amount', e.target.value)}
                              className="w-20 px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold font-mono text-xs text-slate-900 dark:text-white"
                            />
                            <input
                              type="date"
                              value={ci.dueDate}
                              onChange={(e) => handleUpdateCustomInstallment(idx, 'dueDate', e.target.value)}
                              className="flex-1 px-1.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping, Payment Reference & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Payment Reference Number (Highlighted) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-sky-500" />
                    <span>N° de Referencia de Pago / Comprobante</span>
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ej. 0134882910 o Ref #94812"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Quedará guardado en la orden para auditorías futuras desde «Ver más».
                  </p>
                </div>

                {/* Preferred Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as SaleOrder['paymentMethod'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="pago_movil">Pago Móvil</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="binance">🟡 Binance Pay (USDT / Binance ID)</option>
                    <option value="efectivo">Efectivo / Contraentrega</option>
                    <option value="tarjeta">Tarjeta de Crédito / Débito</option>
                    <option value="mercadopago">MercadoPago</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Empresa de Envíos
                  </label>
                  <input
                    type="text"
                    value={shippingCourier}
                    onChange={(e) => setShippingCourier(e.target.value)}
                    placeholder="DHL, Correos, MRW, Zoom, Tealca..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    N° Guía / Seguimiento
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ej. MRW-871928"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Costo Real del Envío (Lo que pagas tú)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={actualShippingCost}
                      onChange={(e) =>
                        setActualShippingCost(e.target.value === '' ? '' : parseFloat(e.target.value))
                      }
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Envío Cobrado al Cliente
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingChargedToCustomer}
                      onChange={(e) =>
                        setShippingChargedToCustomer(e.target.value === '' ? '' : parseFloat(e.target.value))
                      }
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notas del Pedido
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instrucciones especiales de empaque o entrega..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Live Profit Calculation Preview */}
              <div className="bg-slate-950 text-white rounded-2xl p-4 grid grid-cols-3 gap-2 text-center border border-slate-800 shadow-md">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Venta</span>
                  <span className="text-base font-bold text-white font-mono">
                    {currency} {totalSale.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Costos Totales</span>
                  <span className="text-base font-bold text-slate-300 font-mono">
                    {currency} {totalCost.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase block font-bold">Ganancia Neta</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    +{currency} {netProfit.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* BCV Conversion Preview when enabled */}
              {isBcvActive && (
                <div className="bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl p-3 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        Total a Tasa BCV Oficial (+{bcvPercent}%):
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                        Ref. ${((totalSale) * (1 + bcvPercent / 100)).toFixed(2)} USD • Tasa: Bs. {bcvRate.toLocaleString('es-VE')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-800 dark:text-amber-300 font-mono">
                      Bs. {((totalSale) * (1 + bcvPercent / 100) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onCloseNewOrderModal}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {paymentType === 'credito' ? 'Registrar Venta a Crédito' : 'Confirmar Venta y Descontar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER MÁS DETALLES DE LA ORDEN Y TODAS LAS CUOTAS */}
      <OrderDetailModal
        isOpen={Boolean(selectedDetailOrder)}
        order={selectedDetailOrder}
        products={products}
        currency={currency}
        settings={settings}
        onClose={() => setSelectedDetailOrder(null)}
        onPayQuota={(ord, inst) => {
          setPayingOrder(ord);
          setPayingInstallment(inst);
        }}
        onSettleFullDebt={handleSettleFullDebt}
      />

      {/* MODAL: REGISTRAR PAGO DE CUOTA */}
      <QuotaPaymentModal
        isOpen={Boolean(payingOrder && payingInstallment)}
        order={payingOrder}
        installment={payingInstallment}
        currency={currency}
        onClose={() => {
          setPayingOrder(null);
          setPayingInstallment(null);
        }}
        onConfirmPayment={handleConfirmQuotaPayment}
      />

      {/* Confirmation Modal for deleting an order */}
      <ConfirmationModal
        isOpen={!!orderToDelete}
        title="¿Eliminar registro de venta?"
        message={`¿Estás seguro de que deseas eliminar el pedido ${orderToDelete?.orderNumber} de ${orderToDelete?.customerName}? Esta acción recalculará los reportes financieros.`}
        confirmText="Eliminar Venta"
        cancelText="Conservar"
        isDestructive={true}
        onConfirm={() => {
          if (orderToDelete) {
            onDeleteOrder(orderToDelete.id);
            setOrderToDelete(null);
          }
        }}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
  );
};
