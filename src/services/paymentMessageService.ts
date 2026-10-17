import { PaymentDetailsConfig } from '../types';

export function formatPhoneForWhatsApp(rawPhone: string): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Venezuelan standard format: 0414XXXXXXX -> 58414XXXXXXX
    cleaned = '58' + cleaned.substring(1);
  }
  return cleaned;
}

export function cleanPhoneForSMS(rawPhone: string): string {
  if (!rawPhone) return '';
  return rawPhone.replace(/[^\d+]/g, '');
}

export interface PaymentMessageOptions {
  customerName: string;
  items: { productName: string; quantity: number; unitPrice: number }[];
  totalSale: number;
  shippingChargedToCustomer?: number;
  paymentMethod?: string;
  appName?: string;
  currency?: string;
  paymentDetails?: PaymentDetailsConfig;
  orderNumber?: string;
}

export function generatePaymentMessage({
  customerName,
  items,
  totalSale,
  shippingChargedToCustomer = 0,
  paymentMethod,
  appName = 'Vincit Omnia',
  currency = '$',
  paymentDetails,
  orderNumber,
}: PaymentMessageOptions): string {
  const trimmedName = customerName.trim();
  const greeting = trimmedName ? `¡Hola ${trimmedName}! 👋` : '¡Hola! 👋';
  const orderRef = orderNumber ? ` (Pedido: *${orderNumber}*)` : '';

  const lines: string[] = [
    greeting,
    `Gracias por tu compra en *${appName}*${orderRef}. A continuación te enviamos el resumen de tu pedido y los datos para realizar tu pago:`,
    '',
    '🛒 *DETALLE DEL PEDIDO:*',
  ];

  if (items && items.length > 0) {
    items.forEach((item) => {
      const sub = (item.unitPrice * item.quantity).toFixed(2);
      lines.push(`• ${item.productName} (x${item.quantity}) ➔ ${currency}${sub}`);
    });
  } else {
    lines.push('• (Artículos del pedido)');
  }

  if (shippingChargedToCustomer && shippingChargedToCustomer > 0) {
    lines.push(`• Envío / Flete ➔ ${currency}${shippingChargedToCustomer.toFixed(2)}`);
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push(`💰 *TOTAL A PAGAR: ${currency}${totalSale.toFixed(2)}*`);
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  const details = paymentDetails;

  const method = (paymentMethod || 'otro') as string;
  const isBinance = method === 'binance' || method === 'usdt' || method === 'binance_pay';

  // Si el método es Binance Pay / USDT, SOLO deben aparecer los datos de Binance ID
  if (isBinance) {
    const binanceId = details?.binancePay?.binanceId || 'ID No configurado';
    const alias = details?.binancePay?.alias;
    const email = details?.binancePay?.email;
    const usdtRate = details?.binanceUsdtRate || 0;

    lines.push('🟡 *DATOS DE PAGO BINANCE PAY (USDT):*');
    lines.push(`• *Binance ID / Pay ID:* ${binanceId}`);
    if (alias) lines.push(`• *Nombre / Nickname:* ${alias}`);
    if (email) lines.push(`• *Correo Binance:* ${email}`);
    lines.push(`• *Monto a transferir:* *${totalSale.toFixed(2)} USDT*`);
    if (usdtRate > 0) {
      const bsUsdt = totalSale * usdtRate;
      lines.push(`• Tasa Binance: Bs. ${usdtRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USDT`);
      lines.push(`• Ref. en Bolívares: *Bs. ${bsUsdt.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`);
    }
    lines.push('');
    const note = details?.binancePay?.notes || 'Por favor envía el comprobante o captura de Binance Pay con el ID de transacción para procesar y despachar tu pedido.';
    lines.push(`📌 *Nota:* ${note}`);
    lines.push('');
    lines.push('¡Muchas gracias por tu compra!');
    return lines.join('\n');
  }

  // Conversión BCV si está activa
  if (details?.enabledBcvPricing) {
    const diffPct = details.bcvDifferentialPercent || 0;
    const bcvUsd = totalSale * (1 + diffPct / 100);
    const bcvRate = details.bcvRate || 0;
    const bcvBs = bcvUsd * bcvRate;

    lines.push('🇻🇪 *PAGO EN BOLÍVARES (Tasa Oficial BCV):*');
    if (diffPct > 0) {
      lines.push(`• Ref. BCV (+${diffPct}% dif.): $${bcvUsd.toFixed(2)} USD`);
    }
    if (bcvRate > 0) {
      lines.push(`• Tasa Oficial BCV: Bs. ${bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / $`);
      lines.push(`• Total a pagar en Bolívares: *Bs. ${bcvBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`);
    }
    lines.push('');
  }

  // Conversión USDT / Binance si está activa
  if (details?.enabledUsdtPricing) {
    const usdtRate = details.binanceUsdtRate || 0;
    lines.push('🟡 *PAGO EN USDT (Binance):*');
    lines.push(`• Monto a transferir: *${totalSale.toFixed(2)} USDT*`);
    if (usdtRate > 0) {
      const bsUsdt = totalSale * usdtRate;
      lines.push(`• Tasa Binance: Bs. ${usdtRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USDT`);
      lines.push(`• Total en Bs (Binance): *Bs. ${bsUsdt.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`);
    }
    lines.push('');
  }

  // Determine what to include based on method and enablement
  const showPagoMovil = Boolean(
    details?.enabledPagoMovil &&
      (method === 'pago_movil' || method !== 'transferencia')
  );

  const showTransfer = Boolean(
    details?.enabledBankTransfer &&
      (method === 'transferencia' || method !== 'pago_movil')
  );

  if (showPagoMovil && details?.pagoMovil) {
    lines.push('📱 *DATOS DE PAGO MÓVIL:*');
    if (details.pagoMovil.bankName) lines.push(`• Banco: ${details.pagoMovil.bankName}`);
    if (details.pagoMovil.phone) lines.push(`• Teléfono: ${details.pagoMovil.phone}`);
    if (details.pagoMovil.idNumber) lines.push(`• Cédula/RIF: ${details.pagoMovil.idNumber}`);
    lines.push('');
  }

  if (showTransfer && details?.bankTransfer) {
    lines.push('🏦 *DATOS DE TRANSFERENCIA BANCARIA:*');
    if (details.bankTransfer.bankName) lines.push(`• Banco: ${details.bankTransfer.bankName}`);
    if (details.bankTransfer.accountNumber) lines.push(`• Cuenta: ${details.bankTransfer.accountNumber}`);
    if (details.bankTransfer.accountType) lines.push(`• Tipo: ${details.bankTransfer.accountType}`);
    if (details.bankTransfer.accountHolder) lines.push(`• Titular: ${details.bankTransfer.accountHolder}`);
    if (details.bankTransfer.idNumber) lines.push(`• Cédula/RIF: ${details.bankTransfer.idNumber}`);
    if (details.bankTransfer.email) lines.push(`• Correo: ${details.bankTransfer.email}`);
    lines.push('');
  }

  const instructions =
    details?.customInstructions ||
    'Por favor envía el comprobante o captura de pago con el número de referencia para procesar y despachar tu pedido.';
  lines.push(`📌 *Nota:* ${instructions}`);
  lines.push('');
  lines.push('¡Muchas gracias por tu preferencia!');

  return lines.join('\n');
}

export interface InstallmentMessageOptions {
  customerName: string;
  orderNumber?: string;
  installmentNumber: number;
  totalInstallments: number;
  installmentAmount?: number;
  quotaAmount?: number;
  dueDate: string;
  remainingAmount: number;
  totalSale?: number;
  appName?: string;
  currency?: string;
  paymentMethod?: string;
  paymentDetails?: PaymentDetailsConfig;
}

export function generateInstallmentMessage({
  customerName,
  orderNumber,
  installmentNumber,
  totalInstallments,
  installmentAmount,
  quotaAmount,
  dueDate,
  remainingAmount,
  totalSale,
  appName = 'Vincit Omnia',
  currency = '$',
  paymentMethod,
  paymentDetails,
}: InstallmentMessageOptions): string {
  const trimmedName = customerName.trim();
  const greeting = trimmedName ? `¡Hola ${trimmedName}! 👋` : '¡Hola! 👋';
  const orderRef = orderNumber ? ` (Pedido: *${orderNumber}*)` : '';
  const finalAmount = installmentAmount ?? quotaAmount ?? 0;
  const finalTotalSale = totalSale ?? (remainingAmount + finalAmount);

  const lines: string[] = [
    greeting,
    `Te escribimos de *${appName}*${orderRef} con el recordatorio para el pago de tu cuota pendiente.`,
    '',
    '📅 *DATOS DE LA CUOTA A PAGAR:*',
    `• Cuota: *N° ${installmentNumber} de ${totalInstallments}*`,
    `• Monto de la cuota: *${currency}${finalAmount.toFixed(2)}*`,
    `• Fecha límite de pago: *${dueDate}*`,
    '━━━━━━━━━━━━━━━━━━━━',
    `💰 *Monto restante de la deuda: ${currency}${remainingAmount.toFixed(2)}*`,
    `📊 (Total de la compra: ${currency}${finalTotalSale.toFixed(2)})`,
    '━━━━━━━━━━━━━━━━━━━━',
    '',
  ];

  const details = paymentDetails;

  // Conversión BCV de la cuota si está activa
  if (details?.enabledBcvPricing) {
    const diffPct = details.bcvDifferentialPercent || 0;
    const bcvUsdQuota = finalAmount * (1 + diffPct / 100);
    const bcvRate = details.bcvRate || 0;
    const bcvBsQuota = bcvUsdQuota * bcvRate;

    lines.push('🇻🇪 *PAGO EN BOLÍVARES (Tasa Oficial BCV):*');
    if (diffPct > 0) {
      lines.push(`• Cuota Ref. BCV (+${diffPct}% dif.): $${bcvUsdQuota.toFixed(2)} USD`);
    }
    if (bcvRate > 0) {
      lines.push(`• Tasa Oficial BCV: Bs. ${bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / $`);
      lines.push(`• Cuota a transferir en Bs: *Bs. ${bcvBsQuota.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`);
    }
    lines.push('');
  }

  const method = (paymentMethod || 'pago_movil') as string;
  const isBinance = method === 'binance' || method === 'usdt' || method === 'binance_pay';

  if (isBinance) {
    const binanceId = details?.binancePay?.binanceId || 'ID No configurado';
    const alias = details?.binancePay?.alias;
    const email = details?.binancePay?.email;
    const usdtRate = details?.binanceUsdtRate || 0;

    lines.push('🟡 *PAGO DE CUOTA EN BINANCE PAY (USDT):*');
    lines.push(`• *Binance ID / Pay ID:* ${binanceId}`);
    if (alias) lines.push(`• *Nombre / Nickname:* ${alias}`);
    if (email) lines.push(`• *Correo Binance:* ${email}`);
    lines.push(`• *Monto de la cuota:* *${finalAmount.toFixed(2)} USDT*`);
    if (usdtRate > 0) {
      const bsUsdtQuota = finalAmount * usdtRate;
      lines.push(`• Tasa Binance: Bs. ${usdtRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USDT`);
      lines.push(`• Cuota en Bs (Binance): *Bs. ${bsUsdtQuota.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`);
    }
    lines.push('');
    const note = details?.binancePay?.notes || 'Por favor envía el comprobante o captura de Binance Pay con el ID de transacción una vez realizado el pago.';
    lines.push(`📌 *Nota:* ${note}`);
    lines.push('');
    lines.push('¡Muchas gracias!');
    return lines.join('\n');
  }

  // Conversión USDT / Binance si está activa
  if (details?.enabledUsdtPricing) {
    const usdtRate = details.binanceUsdtRate || 0;
    lines.push('🟡 *PAGO EN USDT (Binance):*');
    lines.push(`• Cuota a transferir: *${finalAmount.toFixed(2)} USDT*`);
    if (usdtRate > 0) {
      const bsUsdtQuota = finalAmount * usdtRate;
      lines.push(`• Tasa Binance: Bs. ${usdtRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USDT`);
      lines.push(`• Total cuota en Bs (Binance): *Bs. ${bsUsdtQuota.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*`);
    }
    lines.push('');
  }

  const showPagoMovil = Boolean(
    details?.enabledPagoMovil &&
      (method === 'pago_movil' || method !== 'transferencia')
  );

  const showTransfer = Boolean(
    details?.enabledBankTransfer &&
      (method === 'transferencia' || method !== 'pago_movil')
  );

  if (showPagoMovil && details?.pagoMovil) {
    lines.push('📱 *PAGO MÓVIL:*');
    if (details.pagoMovil.bankName) lines.push(`• Banco: ${details.pagoMovil.bankName}`);
    if (details.pagoMovil.phone) lines.push(`• Teléfono: ${details.pagoMovil.phone}`);
    if (details.pagoMovil.idNumber) lines.push(`• Cédula/RIF: ${details.pagoMovil.idNumber}`);
    lines.push('');
  }

  if (showTransfer && details?.bankTransfer) {
    lines.push('🏦 *TRANSFERENCIA BANCARIA:*');
    if (details.bankTransfer.bankName) lines.push(`• Banco: ${details.bankTransfer.bankName}`);
    if (details.bankTransfer.accountNumber) lines.push(`• Cuenta: ${details.bankTransfer.accountNumber}`);
    if (details.bankTransfer.accountType) lines.push(`• Tipo: ${details.bankTransfer.accountType}`);
    if (details.bankTransfer.accountHolder) lines.push(`• Titular: ${details.bankTransfer.accountHolder}`);
    if (details.bankTransfer.idNumber) lines.push(`• Cédula/RIF: ${details.bankTransfer.idNumber}`);
    lines.push('');
  }

  lines.push('📌 *Por favor envíanos tu comprobante o captura una vez realizado el pago.*');
  lines.push('¡Muchas gracias!');

  return lines.join('\n');
}

export function openWhatsApp(
  arg1: string | { phone?: string; message: string },
  arg2?: string
): void {
  let phone = '';
  let message = '';
  if (typeof arg1 === 'string') {
    phone = arg1;
    message = arg2 || '';
  } else {
    phone = arg1?.phone || '';
    message = arg1?.message || '';
  }
  const cleanPhone = phone ? formatPhoneForWhatsApp(phone) : '';
  const encodedText = encodeURIComponent(message);
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openSMS(
  arg1: string | { phone?: string; message: string },
  arg2?: string
): void {
  let phone = '';
  let message = '';
  if (typeof arg1 === 'string') {
    phone = arg1;
    message = arg2 || '';
  } else {
    phone = arg1?.phone || '';
    message = arg1?.message || '';
  }
  const cleanPhone = phone ? cleanPhoneForSMS(phone) : '';
  const encodedBody = encodeURIComponent(message);
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  const url = cleanPhone
    ? `sms:${cleanPhone}${separator}body=${encodedBody}`
    : `sms:${separator}body=${encodedBody}`;
  window.location.href = url;
}
