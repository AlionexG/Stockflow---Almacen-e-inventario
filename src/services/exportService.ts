import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, SaleOrder, Expense, MonthlyStats, ShippingBatch, RetentionBatch } from '../types';

export const exportService = {
  calculateMonthlyStats(monthStr: string, products: Product[], orders: SaleOrder[], expenses: Expense[]): MonthlyStats {
    const monthOrders = orders.filter((o) => o.date.startsWith(monthStr));
    const monthExpenses = expenses.filter((e) => e.date.startsWith(monthStr));

    const totalSales = monthOrders.reduce((sum, o) => sum + o.totalSale, 0);
    const totalProductCost = monthOrders.reduce((sum, o) => sum + o.totalProductCost, 0);
    const totalShippingCost = monthOrders.reduce((sum, o) => sum + o.totalShippingCost, 0);
    const totalExtraExpenses = monthOrders.reduce((sum, o) => sum + o.extraExpenses, 0);
    const operationalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = totalProductCost + totalShippingCost + totalExtraExpenses + operationalExpenses;
    const netProfit = totalSales - totalExpenses;
    const profitMarginPercent = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

    const unitsSold = monthOrders.reduce((sum, o) => {
      return sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    const inventoryValueCost = products.reduce((sum, p) => sum + (p.unitQuotation || p.unitPriceCost || 0) * (p.stock || 0), 0);
    const inventoryValueRetail = products.reduce((sum, p) => sum + (p.sellingPriceUnit || 0) * (p.stock || 0), 0);
    const potentialProfit = inventoryValueRetail - inventoryValueCost;

    const [year, monthNum] = monthStr.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
    const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    return {
      month: monthStr,
      monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      totalSales: Number(totalSales.toFixed(2)),
      totalProductCost: Number(totalProductCost.toFixed(2)),
      totalShippingCost: Number(totalShippingCost.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
      unitsSold,
      ordersCount: monthOrders.length,
      inventoryValueCost: Number(inventoryValueCost.toFixed(2)),
      inventoryValueRetail: Number(inventoryValueRetail.toFixed(2)),
      potentialProfit: Number(potentialProfit.toFixed(2)),
    };
  },

  exportToExcel(
    monthStr: string,
    products: Product[],
    shippingBatches: ShippingBatch[],
    retentionBatches: RetentionBatch[],
    orders: SaleOrder[],
    expenses: Expense[],
    currency = '$'
  ): void {
    const stats = this.calculateMonthlyStats(monthStr, products, orders, expenses);
    const wb = XLSX.utils.book_new();

    // 1. INVENTARIO VINCINT OMNIA
    const inventoryHeaders = [
      'N',
      'DESCRIPCIÓN',
      'ITEMS',
      'CANTIDAD QUE TRAE EL PRODUCTO',
      'PRECIO DEL PRODUCTO',
      'PRECIO DEL PRODUCTO TOTAL',
      'PRECIO C/U',
      'CARTÓN',
      'BOLSITA',
      'LOGO',
      'RETENCIÓN DE PAGO',
      'ENVIO',
      'COTIZACIÓN TOTAL',
      'COTIZACIÓN C/U',
      'PRECIO UNITARIO',
      'MONTO BRUTO',
      'GANANCIA',
      '% GANANCIA',
      'STOCK',
      'LOTE DE ENVÍO',
    ];

    const inventoryRows = products.map((p, idx) => {
      const batch = shippingBatches.find((b) => b.id === p.shippingBatchId);
      return [
        p.itemNumber || idx + 1,
        p.name,
        p.itemsCount || 1,
        p.piecesPerProduct || 1,
        p.productPrice || 0,
        p.totalProductPrice || 0,
        p.unitPriceCost || 0,
        p.packagingCarton || 0,
        p.packagingBolsita || 0,
        p.packagingLogo || 0,
        p.retentionCostUnit || 0,
        p.shippingCostUnit || 0,
        p.totalQuotation || 0,
        p.unitQuotation || 0,
        p.sellingPriceUnit || 0,
        p.grossAmount || 0,
        p.netProfit || 0,
        `${(p.profitMarginPercent || 0).toFixed(2)}%`,
        p.stock || 0,
        batch ? `Lote ${batch.batchNumber}` : 'Manual',
      ];
    });

    const wsInventory = XLSX.utils.aoa_to_sheet([inventoryHeaders, ...inventoryRows]);
    XLSX.utils.book_append_sheet(wb, wsInventory, 'INVENTARIO_VINCINT');

    // 2. CÁLCULO DE ENVÍO
    const shipHeaders = [
      'N° PEDIDO / LOTE',
      'DESCRIPCIÓN LOTE',
      'CANTIDAD DE PRODUCTOS',
      'MONTO DE ENVIO NETO',
      'MONTO INDIVIDUAL (C/U)',
      'COURIER',
    ];
    const shipRows = shippingBatches.map((b) => [
      b.batchNumber,
      b.name,
      b.totalProducts,
      b.totalNetShipping,
      b.unitShipping,
      b.courier || '',
    ]);
    const wsShipping = XLSX.utils.aoa_to_sheet([shipHeaders, ...shipRows]);
    XLSX.utils.book_append_sheet(wb, wsShipping, 'CALCULO_DE_ENVIO');

    // 3. CÁLCULO DE RETENCIÓN DE PAGO
    const retHeaders = [
      'N° PEDIDO / LOTE',
      'DESCRIPCIÓN',
      'CANTIDAD DE PRODUCTOS',
      'MONTO DE RP NETO',
      'MONTO INDIVIDUAL (C/U)',
    ];
    const retRows = retentionBatches.map((r) => [
      r.batchNumber,
      r.name,
      r.totalProducts,
      r.totalNetRetention,
      r.unitRetention,
    ]);
    const wsRetention = XLSX.utils.aoa_to_sheet([retHeaders, ...retRows]);
    XLSX.utils.book_append_sheet(wb, wsRetention, 'CALCULO_RETENCION');

    // 4. RESUMEN MENSUAL Y VENTAS
    const summaryData = [
      ['STOCKFLOW / VINCINT OMNIA - REPORTE MENSUAL'],
      ['Período:', stats.monthName],
      ['Fecha:', new Date().toLocaleDateString('es-ES')],
      [],
      ['INDICADOR', 'VALOR'],
      ['Total Ventas Facturadas', `${currency} ${stats.totalSales}`],
      ['Total Costo de Productos', `${currency} ${stats.totalProductCost}`],
      ['Total Gastos de Envío', `${currency} ${stats.totalShippingCost}`],
      ['Total Gastos Operativos', `${currency} ${stats.totalExpenses}`],
      ['GANANCIA NETA', `${currency} ${stats.netProfit}`],
      ['Margen ROI (%)', `${stats.profitMarginPercent}%`],
      ['Total Referencias en Almacén', products.length],
      ['Valor Total Almacén (Costo)', `${currency} ${stats.inventoryValueCost}`],
      ['Valor Comercial de Venta', `${currency} ${stats.inventoryValueRetail}`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'RESUMEN_MENSUAL');

    const fileName = `Inventario_Vincint_Omnia_${stats.monthName.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  exportToPDF(
    monthStr: string,
    products: Product[],
    shippingBatches: ShippingBatch[],
    orders: SaleOrder[],
    expenses: Expense[],
    currency = '$'
  ): void {
    const stats = this.calculateMonthlyStats(monthStr, products, orders, expenses);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Top Accent Bar
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 297, 8, 'F');

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('INVENTARIO VINCINT OMNIA', 14, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text('CONTROL DE PRODUCTOS, LOTES DE ENVÍO & GANANCIAS', 14, 25);

    // Period
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Período: ${stats.monthName}`, 297 - 14, 20, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 297 - 14, 25, { align: 'right' });

    // Table of products
    const tableRows = products.map((p, idx) => {
      const batch = shippingBatches.find((b) => b.id === p.shippingBatchId);
      return [
        p.itemNumber || idx + 1,
        p.name.slice(0, 38),
        `${p.itemsCount}x${p.piecesPerProduct}`,
        `${currency}${p.productPrice?.toFixed(2)}`,
        `${currency}${p.unitPriceCost?.toFixed(2)}`,
        `${currency}${(p.packagingCarton + p.packagingBolsita + p.packagingLogo).toFixed(2)}`,
        `${currency}${p.shippingCostUnit?.toFixed(2)} (${batch ? `L${batch.batchNumber}` : 'M'})`,
        `${currency}${p.retentionCostUnit?.toFixed(2)}`,
        `${currency}${p.totalQuotation?.toFixed(2)}`,
        `${currency}${p.sellingPriceUnit?.toFixed(2)}`,
        `${currency}${p.grossAmount?.toFixed(2)}`,
        `${currency}${p.netProfit?.toFixed(2)}`,
        `${(p.profitMarginPercent || 0).toFixed(0)}%`,
        `${p.stock}u`,
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [
        [
          'N°',
          'Descripción',
          'Items/Cant',
          'P. Prod',
          'P. C/U',
          'Empaque',
          'Envío',
          'Ret.',
          'Cotiz. Total',
          'P. Venta',
          'Monto Bruto',
          'Ganancia',
          '% ROI',
          'Stock',
        ],
      ],
      body: tableRows,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [51, 65, 85],
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });

    const fileName = `Inventario_Vincint_Omnia_${stats.monthName.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  },
};
