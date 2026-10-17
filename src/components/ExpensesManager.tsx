import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Tag,
  Package,
  Megaphone,
  Building,
  Wrench,
  HelpCircle,
} from 'lucide-react';
import { Expense } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { ExpensesIllustration } from './empty-states/EmptyStateIllustration';
import { EmptyStateCard } from './empty-states/EmptyStateCard';

interface ExpensesManagerProps {
  expenses: Expense[];
  currency: string;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  expenses,
  currency,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<Expense['category']>('empaque');
  const [notes, setNotes] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim() || typeof amount !== 'number' || amount <= 0) {
      alert('Ingresa el concepto y un monto válido.');
      return;
    }

    onAddExpense({
      date: new Date().toISOString(),
      category,
      concept: concept.trim(),
      amount,
      notes: notes.trim(),
    });

    setConcept('');
    setAmount('');
    setNotes('');
  };

  const getCategoryIcon = (cat: Expense['category']) => {
    switch (cat) {
      case 'empaque':
        return <Package className="w-3.5 h-3.5 text-sky-600" />;
      case 'publicidad':
        return <Megaphone className="w-3.5 h-3.5 text-purple-600" />;
      case 'almacenaje':
        return <Building className="w-3.5 h-3.5 text-amber-600" />;
      case 'servicios':
        return <Wrench className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const totalExpenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Add Expense Form Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Registrar Gasto Operativo (Almacén, Empaques, Envíos Globales)</span>
        </h3>

        {/* Plantillas rápidas para sugerir gastos comunes */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-2">Sugerencias rápidas:</span>
          <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
            <button
              type="button"
              onClick={() => {
                setConcept('Compra de 500 bolsas de envío burbuja');
                setCategory('empaque');
                setAmount(15.0);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              📦 Bolsas burbuja ($15.00)
            </button>
            <button
              type="button"
              onClick={() => {
                setConcept('1000 Etiquetas troqueladas con logo');
                setCategory('empaque');
                setAmount(12.5);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              🏷️ Etiquetas & Logo ($12.50)
            </button>
            <button
              type="button"
              onClick={() => {
                setConcept('Flete de mensajería y delivery');
                setCategory('envio');
                setAmount(6.0);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              🚚 Delivery local ($6.00)
            </button>
            <button
              type="button"
              onClick={() => {
                setConcept('Pauta publicitaria en Instagram Ads');
                setCategory('publicidad');
                setAmount(20.0);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              📱 Publicidad Ads ($20.00)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Concepto / Descripción *
            </label>
            <input
              id="expense-concept-input"
              type="text"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej. Compra de 500 bolsas de envío burbuja"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Expense['category'])}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="empaque">Empaque y Embalaje</option>
              <option value="envio">Envíos y Fletes</option>
              <option value="publicidad">Publicidad y Ads</option>
              <option value="almacenaje">Almacenaje y Estantes</option>
              <option value="servicios">Servicios / Herramientas</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monto ({currency})</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                Agregar
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Expenses History Section */}
      {expenses.length === 0 ? (
        <EmptyStateCard
          illustration={<ExpensesIllustration size={210} />}
          title="No hay gastos operativos registrados"
          description="Lleva el control de empaques, bolsas, publicidad, fletes y servicios. El sistema descontará automáticamente estos montos de tus ingresos para darte la ganancia neta real en el Dashboard y en los reportes financieros."
          actionText="Registrar Primer Gasto"
          actionIcon={Plus}
          onAction={() => {
            const input = document.getElementById('expense-concept-input');
            input?.focus();
            input?.scrollIntoView({ behavior: 'smooth' });
          }}
          benefits={[
            {
              icon: Package,
              title: 'Empaque y Embalaje',
              description: 'Registra compras de sobres, cartones, bolsas y cajas de accesorios.',
            },
            {
              icon: DollarSign,
              title: 'Cuadre Financiero Real',
              description: 'Descuenta cada salida de dinero para reflejar con precisión tu flujo de caja.',
            },
            {
              icon: Megaphone,
              title: 'Publicidad y Herramientas',
              description: 'Monitorea el gasto en campañas, suscripciones o insumos del negocio.',
            },
          ]}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Historial de Gastos Registrados ({expenses.length})
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Total Acumulado: <span className="text-rose-600 dark:text-rose-400 font-extrabold">{currency} {totalExpenseSum.toFixed(2)}</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {expenses.map((exp) => (
              <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getCategoryIcon(exp.category)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">{exp.concept}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{exp.category}</span>
                      <span>•</span>
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-sm font-mono">
                    -{currency} {exp.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => setExpenseToDelete(exp)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!expenseToDelete}
        title="¿Eliminar registro de gasto?"
        message={`¿Deseas eliminar el gasto "${expenseToDelete?.concept}" por ${currency} ${expenseToDelete?.amount}?`}
        confirmText="Eliminar"
        cancelText="Conservar"
        isDestructive={true}
        onConfirm={() => {
          if (expenseToDelete) {
            onDeleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }
        }}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
};
