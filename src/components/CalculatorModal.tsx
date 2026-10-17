import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  DollarSign,
  Package,
  Truck,
  TrendingUp,
  Percent,
  PlusCircle,
  Sparkles,
  Coins,
  ArrowRightLeft,
  RefreshCw,
  Copy,
  Check,
  Building2,
  Info,
} from 'lucide-react';
import { fetchLiveExchangeRates, formatBs } from '../services/currencyService';
import { storageService } from '../services/storageService';

interface CalculatorModalProps {
  isOpen: boolean;
  currency: string;
  onClose: () => void;
  onApplyToNewProduct?: (calcData: {
    costPrice: number;
    packagingCost: number;
    shippingCost: number;
    sellingPrice: number;
  }) => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  currency,
  onClose,
  onApplyToNewProduct,
}) => {
  // Active Tab: 'profit' | 'currency'
  const [activeTab, setActiveTab] = useState<'profit' | 'currency'>('currency');

  // Simulator inputs (Profit Calculator)
  const [unitCost, setUnitCost] = useState<number | ''>(20);
  const [packagingCost, setPackagingCost] = useState<number | ''>(1.8);
  const [shippingFee, setShippingFee] = useState<number | ''>(4.5);
  const [platformFeePercent, setPlatformFeePercent] = useState<number | ''>(5);
  const [fixedFee, setFixedFee] = useState<number | ''>(0.35);
  const [sellingPrice, setSellingPrice] = useState<number | ''>(55);
  const [batchQuantity, setBatchQuantity] = useState<number | ''>(25);

  // Currency Converter Inputs & Rates (BCV & Binance)
  const [conversionDirection, setConversionDirection] = useState<'usdToBs' | 'bsToUsd'>('usdToBs');
  const [calcAmount, setCalcAmount] = useState<number | ''>(10);
  const [bcvRate, setBcvRate] = useState<number>(() => {
    return storageService.getAppSettings().paymentDetails?.bcvRate || 880;
  });
  const [binanceRate, setBinanceRate] = useState<number>(() => {
    return storageService.getAppSettings().paymentDetails?.binanceUsdtRate || 1010;
  });
  const [bcvDiffPercent] = useState<number>(() => {
    return storageService.getAppSettings().paymentDetails?.bcvDifferentialPercent ?? 15;
  });
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [fetchNotice, setFetchNotice] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const settings = storageService.getAppSettings();
      if (settings.paymentDetails?.bcvRate) {
        setBcvRate(settings.paymentDetails.bcvRate);
      }
      if (settings.paymentDetails?.binanceUsdtRate) {
        setBinanceRate(settings.paymentDetails.binanceUsdtRate);
      }
    }
  }, [isOpen]);

  const handleFetchRates = async () => {
    try {
      setIsFetchingRates(true);
      setFetchNotice(null);
      const rates = await fetchLiveExchangeRates();
      setBcvRate(rates.bcvRate);
      setBinanceRate(rates.binanceRate);
      setFetchNotice(`Tasas actualizadas en vivo: BCV Bs. ${rates.bcvRate} • Binance Bs. ${rates.binanceRate}`);
      setTimeout(() => setFetchNotice(null), 5000);
    } catch (err) {
      console.error(err);
      setFetchNotice('No se pudieron obtener las tasas en vivo.');
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!isOpen) return null;

  const numUnitCost = typeof unitCost === 'number' ? unitCost : 0;
  const numPackaging = typeof packagingCost === 'number' ? packagingCost : 0;
  const numShipping = typeof shippingFee === 'number' ? shippingFee : 0;
  const numSelling = typeof sellingPrice === 'number' ? sellingPrice : 0;
  const numPlatformPercent = typeof platformFeePercent === 'number' ? platformFeePercent : 0;
  const numFixedFee = typeof fixedFee === 'number' ? fixedFee : 0;
  const numBatch = typeof batchQuantity === 'number' ? Math.max(1, batchQuantity) : 1;

  // Single unit calculations
  const platformFeeAmount = (numSelling * numPlatformPercent) / 100 + numFixedFee;
  const totalUnitExpense = numUnitCost + numPackaging + numShipping + platformFeeAmount;
  const unitNetProfit = numSelling - totalUnitExpense;
  const unitMarginRoi = totalUnitExpense > 0 ? (unitNetProfit / totalUnitExpense) * 100 : 0;
  const unitProfitMarginOnPrice = numSelling > 0 ? (unitNetProfit / numSelling) * 100 : 0;

  // Batch calculations
  const batchTotalInvestment = (numUnitCost + numPackaging + numShipping) * numBatch;
  const batchTotalGrossRevenue = numSelling * numBatch;
  const batchTotalFees = platformFeeAmount * numBatch;
  const batchTotalNetProfit = unitNetProfit * numBatch;

  // Suggested selling price for 50% ROI
  const suggestedSellingFor50Roi = (numUnitCost + numPackaging + numShipping + numFixedFee) * 1.5 / (1 - numPlatformPercent / 100);

  const handleApply = () => {
    if (onApplyToNewProduct) {
      onApplyToNewProduct({
        costPrice: numUnitCost,
        packagingCost: numPackaging,
        shippingCost: numShipping,
        sellingPrice: numSelling,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              {activeTab === 'currency' ? (
                <Coins className="w-5 h-5 text-amber-500" />
              ) : (
                <Calculator className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeTab === 'currency'
                  ? 'Calculadora de Conversión (BCV & Binance)'
                  : 'Simulador de Gastos, Envíos y Ganancias'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === 'currency'
                  ? 'Conversión en vivo de Dólares a Bolívares a tasa oficial BCV y Binance USDT'
                  : 'Calcula rentabilidad, comisiones de pasarela y proyecciones de lotes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setActiveTab('currency')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'currency'
                ? 'bg-amber-500 text-slate-900 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Conversor USD / Bs (BCV y Binance)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profit'
                ? 'bg-amber-500 text-slate-900 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Simulador de Ganancias</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'currency' ? (
            /* TAB: CONVERSOR BCV & BINANCE */
            <div className="space-y-5">
              {/* Controls bar: Live Rates Update */}
              <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/25 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span>Tasas de Cambio Actuales (Bs. por Dólar / USDT)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchRates}
                    disabled={isFetchingRates}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-900 hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRates ? 'animate-spin' : ''}`} />
                    {isFetchingRates ? 'Consultando...' : 'Actualizar Tasas en Vivo'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tasa BCV Input */}
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" /> Tasa Oficial BCV
                      </span>
                      <span className="text-[10px] text-slate-400">Banco Central</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">Bs.</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={bcvRate}
                        onChange={(e) => setBcvRate(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm font-black border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Tasa Binance Input */}
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-yellow-500" /> Tasa Binance USDT (P2P)
                      </span>
                      <span className="text-[10px] text-slate-400">Mercado Paralelo</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">Bs.</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={binanceRate}
                        onChange={(e) => setBinanceRate(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm font-black border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </div>

                {fetchNotice && (
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>{fetchNotice}</span>
                  </p>
                )}
              </div>

              {/* Main Input Box */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span>Monto a Convertir:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setConversionDirection((prev) => (prev === 'usdToBs' ? 'bsToUsd' : 'usdToBs'))
                      }
                      className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      {conversionDirection === 'usdToBs' ? 'Cambiar a Bolívares ➔ Dólares' : 'Cambiar a Dólares ➔ Bolívares'}
                    </button>
                  </label>

                  <span className="text-xs font-bold text-slate-500">
                    {conversionDirection === 'usdToBs' ? 'Entrada en USD ($)' : 'Entrada en Bolívares (Bs.)'}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-base font-bold text-slate-400">
                    {conversionDirection === 'usdToBs' ? '$' : 'Bs.'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="10.00"
                    className="w-full pl-12 pr-4 py-2.5 text-xl font-black rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-400 mr-1">Rápidos:</span>
                  {(conversionDirection === 'usdToBs' ? [1, 5, 10, 20, 50, 100, 500] : [100, 500, 1000, 5000, 10000]).map(
                    (val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCalcAmount(val)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                          calcAmount === val
                            ? 'bg-amber-500 text-slate-900'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {conversionDirection === 'usdToBs' ? `$${val}` : `Bs. ${val}`}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Comparative Results: BCV vs Binance */}
              {(() => {
                const numAmt = typeof calcAmount === 'number' && calcAmount > 0 ? calcAmount : 0;
                const isUsd = conversionDirection === 'usdToBs';

                // BCV conversions
                const bcvBsResult = isUsd ? numAmt * bcvRate : (bcvRate > 0 ? numAmt / bcvRate : 0);
                const bcvUsdWithDiff = numAmt * (1 + (bcvDiffPercent || 0) / 100);
                const bcvBsWithDiff = bcvUsdWithDiff * bcvRate;

                // Binance conversions
                const binanceBsResult = isUsd ? numAmt * binanceRate : (binanceRate > 0 ? numAmt / binanceRate : 0);

                // Gap
                const gapBsPerDollar = Math.max(0, binanceRate - bcvRate);
                const gapPercent = bcvRate > 0 ? ((binanceRate - bcvRate) / bcvRate) * 100 : 0;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* CARD 1: TASA OFICIAL BCV */}
                      <div className="bg-gradient-to-br from-amber-500/15 via-white dark:via-slate-800 to-amber-500/5 rounded-2xl p-4 border border-amber-500/40 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                              Tasa Oficial BCV
                            </span>
                          </div>
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-mono">
                            Bs. {bcvRate.toFixed(2)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                            {isUsd ? 'Total en Bolívares (Tasa Oficial):' : 'Total en Dólares (Tasa Oficial):'}
                          </span>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-2xl font-black text-amber-900 dark:text-amber-300 font-mono">
                              {isUsd
                                ? `Bs. ${bcvBsResult.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `$${bcvBsResult.toFixed(2)} USD`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  isUsd
                                    ? `Bs. ${bcvBsResult.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `$${bcvBsResult.toFixed(2)}`,
                                  'bcv'
                                )
                              }
                              className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title="Copiar resultado"
                            >
                              {copiedText === 'bcv' ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Differential Selling Price hint if enabled */}
                        {isUsd && (
                          <div className="pt-2 border-t border-amber-500/20 text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                            <div className="flex items-center justify-between font-medium">
                              <span>Con diferencial (+{bcvDiffPercent}%):</span>
                              <strong className="text-amber-800 dark:text-amber-300 font-mono">
                                ${bcvUsdWithDiff.toFixed(2)} USD
                              </strong>
                            </div>
                            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                              <span>Total en Bolívares:</span>
                              <span className="font-mono text-amber-900 dark:text-amber-200">
                                Bs. {bcvBsWithDiff.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CARD 2: TASA BINANCE USDT */}
                      <div className="bg-gradient-to-br from-yellow-400/15 via-white dark:via-slate-800 to-yellow-400/5 rounded-2xl p-4 border border-yellow-400/40 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs font-black text-yellow-900 dark:text-yellow-200 uppercase tracking-wider">
                              Tasa Binance USDT
                            </span>
                          </div>
                          <span className="text-[10px] font-bold bg-yellow-400/20 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full font-mono">
                            Bs. {binanceRate.toFixed(2)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                            {isUsd ? 'Total en Bolívares (Binance P2P):' : 'Total en USDT (Binance P2P):'}
                          </span>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-2xl font-black text-yellow-700 dark:text-yellow-300 font-mono">
                              {isUsd
                                ? `Bs. ${binanceBsResult.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `${binanceBsResult.toFixed(2)} USDT`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  isUsd
                                    ? `Bs. ${binanceBsResult.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `${binanceBsResult.toFixed(2)} USDT`,
                                  'binance'
                                )
                              }
                              className="text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-300 p-1.5 rounded-lg hover:bg-yellow-400/10 transition-colors cursor-pointer"
                              title="Copiar resultado"
                            >
                              {copiedText === 'binance' ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-yellow-400/20 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                          <span>Equivalente directo:</span>
                          <strong className="text-yellow-800 dark:text-yellow-300 font-mono font-bold">
                            {isUsd ? `${numAmt.toFixed(2)} USDT` : `Bs. ${numAmt.toLocaleString('es-VE')}`}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Gap Comparison Banner */}
                    <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-sky-500 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Brecha Cambiaria (Binance vs Oficial BCV):
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Diferencia de <strong className="text-slate-700 dark:text-slate-300 font-mono">Bs. {gapBsPerDollar.toFixed(2)}</strong> por cada dólar ({gapPercent.toFixed(1)}% de diferencia).
                          </p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block font-semibold">Diferencial sugerido:</span>
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
                          +{gapPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* TAB: SIMULADOR DE GANANCIAS */
            <div className="space-y-6">
              {/* Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Costo Base Producto
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Empaque / Embalaje
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={packagingCost}
                      onChange={(e) => setPackagingCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Costo de Envío
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Comisión Pasarela (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={platformFeePercent}
                    onChange={(e) => setPlatformFeePercent(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Comisión Fija Pasarela
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={fixedFee}
                      onChange={(e) => setFixedFee(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    Precio de Venta Sugerido
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-sm font-bold text-emerald-900 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Unit Profitability Result Card */}
              <div className="bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Resultado por Unidad Vendida
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      unitNetProfit > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {unitNetProfit > 0 ? 'Rentable' : 'Con Pérdida'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Costo Total</span>
                    <span className="text-base font-bold text-white font-mono">
                      {currency} {totalUnitExpense.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Incluye comisión</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Ganancia Neta</span>
                    <span
                      className={`text-xl font-black font-mono ${
                        unitNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      +{currency} {unitNetProfit.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Limpio al bolsillo</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Margen ROI (%)</span>
                    <span className="text-xl font-black text-amber-400 font-mono">
                      {unitMarginRoi.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">Sobre inversión</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block">Margen s/ Venta</span>
                    <span className="text-xl font-black text-sky-400 font-mono">
                      {unitProfitMarginOnPrice.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">Del precio final</span>
                  </div>
                </div>

                {/* Smart Pricing Tip */}
                {suggestedSellingFor50Roi > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Precio recomendado para 50% de ganancia:
                    </span>
                    <span className="font-bold text-emerald-400 text-sm font-mono">
                      {currency} {suggestedSellingFor50Roi.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Batch Projection Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Proyección por Lote de Producción / Compra
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Lote:</span>
                    <input
                      type="number"
                      min="1"
                      value={batchQuantity}
                      onChange={(e) => setBatchQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-center text-slate-900 dark:text-white"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">uds.</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Inversión Lote</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
                      {currency} {batchTotalInvestment.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Facturación Total</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
                      {currency} {batchTotalGrossRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Comisiones Totales</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
                      {currency} {batchTotalFees.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">Ganancia Lote</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      +{currency} {batchTotalNetProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {activeTab === 'profit' && onApplyToNewProduct && (
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Registrar Producto con estos Valores
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
