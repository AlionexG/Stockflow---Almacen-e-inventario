/**
 * Service to manage Venezuelan Exchange Rates: BCV (Banco Central de Venezuela)
 * and Binance USDT (P2P / Paralelo), with live public API fetching and fallbacks.
 */

export interface LiveRatesResult {
  bcvRate: number;
  binanceRate: number;
  lastUpdated: string;
  source: string;
}

// Fallback rates if offline or API failure
export const DEFAULT_BCV_RATE = 880.0;
export const DEFAULT_BINANCE_RATE = 1010.0;

export async function fetchLiveExchangeRates(): Promise<LiveRatesResult> {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares', {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Error en API de tasas: ${res.statusText}`);
    }

    const data: Array<{
      fuente: string;
      promedio: number;
      fechaActualizacion?: string;
    }> = await res.json();

    let bcv = DEFAULT_BCV_RATE;
    let binance = DEFAULT_BINANCE_RATE;
    let lastUpdated = new Date().toISOString();

    for (const item of data) {
      if (item.fuente === 'oficial' && item.promedio > 0) {
        bcv = Number(item.promedio.toFixed(2));
        if (item.fechaActualizacion) lastUpdated = item.fechaActualizacion;
      } else if (item.fuente === 'paralelo' && item.promedio > 0) {
        binance = Number(item.promedio.toFixed(2));
      }
    }

    return {
      bcvRate: bcv,
      binanceRate: binance,
      lastUpdated,
      source: 'dolarapi.com (Oficial BCV & Binance/Paralelo)',
    };
  } catch (error) {
    console.warn('No se pudieron obtener tasas en vivo, usando valores locales:', error);
    return {
      bcvRate: DEFAULT_BCV_RATE,
      binanceRate: DEFAULT_BINANCE_RATE,
      lastUpdated: new Date().toISOString(),
      source: 'Valores almacenados en sistema',
    };
  }
}

/**
 * Format a number as Venezuelan Bolívares (Bs. 1.250,50)
 */
export function formatBs(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Bs. 0,00';
  return (
    'Bs. ' +
    amount.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/**
 * Format a number as USD ($ 12.50)
 */
export function formatUSD(amount: number, symbol = '$'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0.00`;
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Calculate the selling price with BCV differential markup
 * @param baseUsd Base selling price in USD
 * @param markupPercent Differential percentage (e.g. 15 for +15%)
 * @param bcvRate BCV rate in Bs/USD
 */
export function calculateBcvPricing(
  baseUsd: number,
  markupPercent: number = 0,
  bcvRate: number = 0
) {
  const percent = Math.max(0, markupPercent || 0);
  const usdPriceWithMarkup = baseUsd * (1 + percent / 100);
  const bsPrice = bcvRate > 0 ? usdPriceWithMarkup * bcvRate : 0;

  return {
    baseUsd,
    markupPercent: percent,
    usdPriceWithMarkup: Number(usdPriceWithMarkup.toFixed(2)),
    bsPrice: Number(bsPrice.toFixed(2)),
  };
}
