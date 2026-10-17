import React, { useState } from 'react';
import { X, Check, Hash } from 'lucide-react';
import { SaleOrder, Installment } from '../types';

interface QuotaPaymentModalProps {
  isOpen: boolean;
  order: SaleOrder | null;
  installment: Installment | null;
  currency: string;
  onClose: () => void;
  onConfirmPayment: (
    orderId: string,
    installmentNumber: number,
    paymentMethod: SaleOrder['paymentMethod'],
    notes?: string,
    paymentReference?: string
  ) => void;
}

export const QuotaPaymentModal: React.FC<QuotaPaymentModalProps> = ({
  isOpen,
  order,
  installment,
  currency,
  onClose,
  onConfirmPayment,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<SaleOrder['paymentMethod']>('pago_movil');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !order || !installment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmPayment(
      order.id,
      installment.number,
      paymentMethod,
      notes.trim(),
      paymentReference.trim()
    );
    onClose();
  };

  const currentRemaining = order.remainingAmount ?? (order.totalSale - (order.paidAmount ?? 0));
  const newRemaining = Math.max(0, currentRemaining - installment.amount);
  const willBeFullyPaid = newRemaining <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Registrar Pago de Cuota</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {order.orderNumber} • {order.customerName}
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quota details summary */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
              <span>Cuota a Cobrar:</span>
              <span className="font-bold bg-emerald-200 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 px-2.5 py-0.5 rounded-full">
                N° {installment.number} de {order.totalInstallments || order.installments?.length || 1}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-slate-600 dark:text-slate-400">Monto de la Cuota:</span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                {currency} {installment.amount.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
              <span>Fecha Límite: <strong>{installment.dueDate}</strong></span>
              <span>Saldo tras este pago: <strong className="text-slate-900 dark:text-white font-mono">{currency}{newRemaining.toFixed(2)}</strong></span>
            </div>

            {willBeFullyPaid && (
              <div className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-center animate-pulse">
                🎉 ¡Este pago liquidará el 100% de la deuda! La venta pasará al apartado general de ventas hechas.
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Método con el que pagó el cliente:
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as SaleOrder['paymentMethod'])}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
            >
              <option value="pago_movil">Pago Móvil</option>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="binance">🟡 Binance Pay (USDT / Binance ID)</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta Débito / Crédito</option>
              <option value="mercadopago">MercadoPago</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* Payment Reference Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Número de Referencia del Pago:</span>
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Ej. 0134882910, Ref #98124 o Comprobante"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-medium text-slate-900 dark:text-white placeholder:font-sans placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Quedará registrado para verificar o auditar el comprobante en cualquier momento.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notas adicionales (Opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Pagado por Zelle o recibido en tienda"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Pago de Cuota</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
