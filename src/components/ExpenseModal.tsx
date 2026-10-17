import React, { useState } from 'react';
import {
  X,
  Receipt,
  DollarSign,
  Package,
  Megaphone,
  Building,
  Wrench,
  Tag,
  Check,
  Calendar,
} from 'lucide-react';
import { Expense } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  currency,
  onAddExpense,
}) => {
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<Expense['category']>('empaque');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) {
      alert('Por favor ingresa el concepto del gasto.');
      return;
    }
    if (typeof amount !== 'number' || amount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    onAddExpense({
      date: new Date().toISOString(),
      category,
      concept: concept.trim(),
      amount,
      notes: notes.trim(),
    });

    // Reset and close
    setConcept('');
    setAmount('');
    setCategory('empaque');
    setNotes('');
    onClose();
  };

  const categories: { id: Expense['category']; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'empaque', label: 'Empaque & Envoltorios', icon: <Package className="w-4 h-4" />, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'publicidad', label: 'Publicidad & Marketing', icon: <Megaphone className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'almacenaje', label: 'Almacenaje & Local', icon: <Building className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'servicios', label: 'Servicios & Envíos extra', icon: <Wrench className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'otro', label: 'Otro Gasto Operativo', icon: <Tag className="w-4 h-4" />, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registrar Nuevo Gasto</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registra costos operativos que se deducen del balance mensual
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Concepto del Gasto *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej. Cinta de embalar, bolsas de seguridad, pauta en Instagram"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Monto ({currency}) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400 dark:text-slate-500">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Fecha
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Hoy ({new Date().toLocaleDateString('es-ES')})</span>
              </div>
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Categoría
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border ${cat.color}`}>
                      {cat.icon}
                    </div>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notas u Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Factura #402, comprado en proveedor local"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-white dark:bg-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Gasto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
