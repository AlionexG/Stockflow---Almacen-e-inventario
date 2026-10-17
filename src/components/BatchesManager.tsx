import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  Percent,
  Check,
  X,
  Package,
  Layers,
  Info,
  DollarSign,
} from 'lucide-react';
import { ShippingBatch, RetentionBatch, Product } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { ShippingBatchesIllustration } from './empty-states/EmptyStateIllustration';
import { EmptyStateCard } from './empty-states/EmptyStateCard';

interface BatchesManagerProps {
  shippingBatches: ShippingBatch[];
  retentionBatches: RetentionBatch[];
  products: Product[];
  currency: string;
  onAddShippingBatch: (batch: Omit<ShippingBatch, 'id' | 'date' | 'unitShipping'>) => void;
  onUpdateShippingBatch: (batch: ShippingBatch) => void;
  onDeleteShippingBatch: (batchId: string) => void;
  onAddRetentionBatch: (batch: Omit<RetentionBatch, 'id' | 'date' | 'unitRetention'>) => void;
  onUpdateRetentionBatch: (batch: RetentionBatch) => void;
  onDeleteRetentionBatch: (batchId: string) => void;
}

export const BatchesManager: React.FC<BatchesManagerProps> = ({
  shippingBatches,
  retentionBatches,
  products,
  currency,
  onAddShippingBatch,
  onUpdateShippingBatch,
  onDeleteShippingBatch,
  onAddRetentionBatch,
  onUpdateRetentionBatch,
  onDeleteRetentionBatch,
}) => {
  // Modal states for Shipping Batch
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingToEdit, setShippingToEdit] = useState<ShippingBatch | null>(null);
  const [shipBatchNumber, setShipBatchNumber] = useState<number | ''>(1);
  const [shipName, setShipName] = useState('');
  const [shipTotalProducts, setShipTotalProducts] = useState<number | ''>(160);
  const [shipTotalNet, setShipTotalNet] = useState<number | ''>(95.52);
  const [shipCourier, setShipCourier] = useState('Importación Aérea');
  const [shipNotes, setShipNotes] = useState('');

  // Modal states for Retention Batch
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState(false);
  const [retentionToEdit, setRetentionToEdit] = useState<RetentionBatch | null>(null);
  const [retBatchNumber, setRetBatchNumber] = useState<number | ''>(1);
  const [retName, setRetName] = useState('');
  const [retTotalProducts, setRetTotalProducts] = useState<number | ''>(100);
  const [retTotalNet, setRetTotalNet] = useState<number | ''>(30.00);
  const [retNotes, setRetNotes] = useState('');

  // Delete confirmations
  const [batchToDelete, setBatchToDelete] = useState<{ type: 'shipping' | 'retention'; id: string; name: string } | null>(null);

  // Live Shipping Unit Calculation
  const numShipProducts = typeof shipTotalProducts === 'number' && shipTotalProducts > 0 ? shipTotalProducts : 1;
  const numShipNet = typeof shipTotalNet === 'number' ? shipTotalNet : 0;
  const calculatedShipUnit = Number((numShipNet / numShipProducts).toFixed(2));

  // Live Retention Unit Calculation
  const numRetProducts = typeof retTotalProducts === 'number' && retTotalProducts > 0 ? retTotalProducts : 1;
  const numRetNet = typeof retTotalNet === 'number' ? retTotalNet : 0;
  const calculatedRetUnit = Number((numRetNet / numRetProducts).toFixed(2));

  // Open Edit Shipping
  const handleOpenEditShipping = (b: ShippingBatch) => {
    setShippingToEdit(b);
    setShipBatchNumber(typeof b.batchNumber === 'number' ? b.batchNumber : parseInt(String(b.batchNumber), 10) || 1);
    setShipName(b.name);
    setShipTotalProducts(b.totalProducts);
    setShipTotalNet(b.totalNetShipping);
    setShipCourier(b.courier || '');
    setShipNotes(b.notes || '');
    setIsShippingModalOpen(true);
  };

  const handleOpenNewShipping = () => {
    setShippingToEdit(null);
    const nextNum = shippingBatches.length + 1;
    setShipBatchNumber(nextNum);
    setShipName(`Lote ${nextNum} - Envío Consolidado`);
    setShipTotalProducts(160);
    setShipTotalNet(95.52);
    setShipCourier('Importación Aérea');
    setShipNotes('');
    setIsShippingModalOpen(true);
  };

  const handleSaveShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numShipProducts || numShipProducts <= 0) {
      alert('La cantidad de productos debe ser mayor a 0');
      return;
    }

    if (shippingToEdit) {
      onUpdateShippingBatch({
        ...shippingToEdit,
        batchNumber: shipBatchNumber || 1,
        name: shipName.trim() || `Lote ${shipBatchNumber}`,
        totalProducts: numShipProducts,
        totalNetShipping: numShipNet,
        unitShipping: calculatedShipUnit,
        courier: shipCourier.trim(),
        notes: shipNotes.trim(),
      });
    } else {
      onAddShippingBatch({
        batchNumber: shipBatchNumber || 1,
        name: shipName.trim() || `Lote ${shipBatchNumber}`,
        totalProducts: numShipProducts,
        totalNetShipping: numShipNet,
        courier: shipCourier.trim(),
        notes: shipNotes.trim(),
      });
    }

    setIsShippingModalOpen(false);
    setShippingToEdit(null);
  };

  // Open Edit Retention
  const handleOpenEditRetention = (b: RetentionBatch) => {
    setRetentionToEdit(b);
    setRetBatchNumber(typeof b.batchNumber === 'number' ? b.batchNumber : parseInt(String(b.batchNumber), 10) || 1);
    setRetName(b.name);
    setRetTotalProducts(b.totalProducts);
    setRetTotalNet(b.totalNetRetention);
    setRetNotes(b.notes || '');
    setIsRetentionModalOpen(true);
  };

  const handleOpenNewRetention = () => {
    setRetentionToEdit(null);
    const nextNum = retentionBatches.length + 1;
    setRetBatchNumber(nextNum);
    setRetName(`Lote ${nextNum} - Impuesto tax`);
    setRetTotalProducts(100);
    setRetTotalNet(30.00);
    setRetNotes('');
    setIsRetentionModalOpen(true);
  };

  const handleSaveRetention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numRetProducts || numRetProducts <= 0) {
      alert('La cantidad de productos debe ser mayor a 0');
      return;
    }

    if (retentionToEdit) {
      onUpdateRetentionBatch({
        ...retentionToEdit,
        batchNumber: retBatchNumber || 1,
        name: retName.trim() || `Lote ${retBatchNumber}`,
        totalProducts: numRetProducts,
        totalNetRetention: numRetNet,
        unitRetention: calculatedRetUnit,
        notes: retNotes.trim(),
      });
    } else {
      onAddRetentionBatch({
        batchNumber: retBatchNumber || 1,
        name: retName.trim() || `Lote ${retBatchNumber}`,
        totalProducts: numRetProducts,
        totalNetRetention: numRetNet,
        notes: retNotes.trim(),
      });
    }

    setIsRetentionModalOpen(false);
    setRetentionToEdit(null);
  };

  return (
    <div className="space-y-8">
      {/* Information Header Banner */}
      <div className="bg-linear-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-emerald-800/60">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              Lotes de Envío & Impuesto tax
            </div>
            <h2 className="text-xl font-black text-white">
              Cálculo Automático de Costo de Envío por Producto
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Configura los lotes de importación y fletes de tus pedidos (Monto Neto ÷ Cantidad de Productos = Costo Individual).
              Al registrar cualquier producto en tu almacén, podrás seleccionar el lote correspondiente y se calculará automáticamente el valor del envío.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenNewShipping}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Lote de Envío</span>
            </button>
            <button
              onClick={handleOpenNewRetention}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Lote de Impuesto tax</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: LOTES DE ENVÍO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lotes de Envío (Cálculo de Envío)
              </h3>
              <p className="text-xs text-slate-500">
                Fórmula de tu base: Monto de Envío Neto ÷ Cantidad de Productos = Monto Individual
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNewShipping}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Lote
          </button>
        </div>

        {/* Shipping Batches Grid / Empty State */}
        {shippingBatches.length === 0 ? (
          <EmptyStateCard
            illustration={<ShippingBatchesIllustration size={210} />}
            title="Aún no tienes lotes de envío registrados"
            description="Registra tus lotes de importación aérea, marítima o encomiendas consolidadas. Al indicar el monto total del flete y la cantidad de piezas, el sistema calculará automáticamente el costo de envío individual por unidad para tus cotizaciones."
            actionText="Crear Primer Lote de Envío"
            actionIcon={Plus}
            onAction={handleOpenNewShipping}
            benefits={[
              {
                icon: Truck,
                title: 'Flete Proporcional por Pieza',
                description: 'Divide con exactitud el costo total de flete entre todas las unidades del pedido.',
              },
              {
                icon: Package,
                title: 'Asignación al Catálogo',
                description: 'Tus productos vinculan este flete para calcular el margen y precio sugerido real.',
              },
              {
                icon: Layers,
                title: 'Trazabilidad de Couriers',
                description: 'Lleva notas de couriers, guías de importación y fechas de consolidación.',
              },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shippingBatches.map((b) => {
              const assignedProductsCount = products.filter((p) => p.shippingBatchId === b.id).length;

              return (
                <div
                  key={b.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        N° Pedido / Lote {b.batchNumber}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditShipping(b)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Editar lote"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setBatchToDelete({ type: 'shipping', id: b.id, name: b.name })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar lote"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{b.name}</h4>
                    {b.courier && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span>{b.courier}</span>
                      </div>
                    )}

                    {/* Calculations Box */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-100 dark:border-slate-700/80 space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Cantidad de Productos:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{b.totalProducts} piezas</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Monto de Envío Neto:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{currency} {b.totalNetShipping.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Monto Individual:</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {currency} {b.unitShipping.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/u</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Productos asignados: <strong className="text-slate-800 dark:text-slate-200">{assignedProductsCount}</strong></span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Listo para asignar</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: IMPUESTO TAX */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Impuesto tax (Cálculo de Impuesto tax)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monto de Impuesto tax Neto ÷ Cantidad de Productos = Monto Individual por Unidad
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenNewRetention}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Impuesto tax
          </button>
        </div>

        {/* Retention Batches Grid / Empty State */}
        {retentionBatches.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-center max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <Percent className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Sin impuestos o retenciones pasarela
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Si tu pasarela de pagos o aduana cobra una retención sobre un pedido de productos, regístrala aquí para que se compute por pieza.
            </p>
            <button
              onClick={handleOpenNewRetention}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Agregar Impuesto tax
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {retentionBatches.map((rb) => (
              <div
                key={rb.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase font-mono px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      N° Pedido / Lote {rb.batchNumber}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditRetention(rb)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Editar Impuesto tax"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setBatchToDelete({ type: 'retention', id: rb.id, name: rb.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Impuesto tax"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3">{rb.name}</h4>

                  {/* Calculations Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-100 dark:border-slate-700/80 space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Cantidad de Productos:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{rb.totalProducts} piezas</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Monto Impuesto tax Neto:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currency} {rb.totalNetRetention.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-800 dark:text-sky-300">Impuesto tax Individual:</span>
                      <span className="text-base font-black text-sky-600 dark:text-sky-400">
                        {currency} {rb.unitRetention.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/u</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Impuesto tax vinculable</span>
                  <span className="text-sky-600 dark:text-sky-400 font-semibold">Activo</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* MODAL: REGISTRAR / EDITAR LOTE DE ENVÍO */}
      {isShippingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/40">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {shippingToEdit ? 'Editar Lote de Envío' : 'Registrar Nuevo Lote de Envío'}
                </h3>
              </div>
              <button
                onClick={() => setIsShippingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShipping} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    N° Pedido / Lote
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={shipBatchNumber}
                    onChange={(e) => setShipBatchNumber(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Empresa / Courier
                  </label>
                  <input
                    type="text"
                    value={shipCourier}
                    onChange={(e) => setShipCourier(e.target.value)}
                    placeholder="Ej. Aéreo Consolidado"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre o Descripción del Lote
                </label>
                <input
                  type="text"
                  required
                  value={shipName}
                  onChange={(e) => setShipName(e.target.value)}
                  placeholder="Ej. Lote 1 - Pedido 160 Piezas"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cantidad de Productos (Piezas) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={shipTotalProducts}
                    onChange={(e) => setShipTotalProducts(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="160"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Monto de Envío Neto ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={shipTotalNet}
                    onChange={(e) => setShipTotalNet(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="95.52"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Calculated Result Live Box */}
              <div className="bg-emerald-950 dark:bg-emerald-950/80 border border-emerald-800 text-white rounded-2xl p-4 text-center">
                <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block mb-1">
                  Monto Individual de Envío Calculado
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {currency} {calculatedShipUnit.toFixed(2)}
                  <span className="text-xs font-normal text-slate-300 ml-1">por producto</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {currency}{numShipNet.toFixed(2)} dividido entre {numShipProducts} productos
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsShippingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Guardar Lote de Envío
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR / EDITAR LOTE DE IMPUESTO TAX */}
      {isRetentionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-sky-50/60 dark:bg-sky-950/40">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {retentionToEdit ? 'Editar Lote de Impuesto tax' : 'Nuevo Lote de Impuesto tax'}
                </h3>
              </div>
              <button
                onClick={() => setIsRetentionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRetention} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    N° Pedido / Lote
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={retBatchNumber}
                    onChange={(e) => setRetBatchNumber(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Lote
                  </label>
                  <input
                    type="text"
                    required
                    value={retName}
                    onChange={(e) => setRetName(e.target.value)}
                    placeholder="Ej. Impuesto tax Lote 1"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cantidad de Productos *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={retTotalProducts}
                    onChange={(e) => setRetTotalProducts(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="100"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Monto Impuesto tax Neto ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={retTotalNet}
                    onChange={(e) => setRetTotalNet(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="30.00"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Calculated Result Live Box */}
              <div className="bg-sky-950 dark:bg-sky-950/80 border border-sky-800 text-white rounded-2xl p-4 text-center">
                <span className="text-[11px] uppercase tracking-wider text-sky-300 font-bold block mb-1">
                  Monto Individual de Impuesto tax Calculado
                </span>
                <div className="text-2xl font-black text-sky-400 font-mono">
                  {currency} {calculatedRetUnit.toFixed(2)}
                  <span className="text-xs font-normal text-slate-300 ml-1">por producto</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {currency}{numRetNet.toFixed(2)} dividido entre {numRetProducts} productos
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRetentionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm cursor-pointer active:scale-95 transition-all"
                >
                  Guardar Impuesto tax
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!batchToDelete}
        title="¿Eliminar Lote?"
        message={`¿Estás seguro de que deseas eliminar "${batchToDelete?.name}"? Los productos que tenían asignado este lote mantendrán su valor histórico.`}
        confirmText="Eliminar"
        cancelText="Conservar"
        isDestructive={true}
        onConfirm={() => {
          if (batchToDelete) {
            if (batchToDelete.type === 'shipping') {
              onDeleteShippingBatch(batchToDelete.id);
            } else {
              onDeleteRetentionBatch(batchToDelete.id);
            }
            setBatchToDelete(null);
          }
        }}
        onCancel={() => setBatchToDelete(null)}
      />
    </div>
  );
};
