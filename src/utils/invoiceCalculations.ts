import { InvoiceData } from '../types';

export interface InvoiceMathResult {
  subtotal: number;
  discountType: 'amount' | 'percentage';
  rawDiscount: number;
  discountValue: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  isTaxDeduct: boolean;
  grandTotal: number;
}

/**
 * Standard invoice accounting calculations:
 * 1. Computes gross subtotal from line items.
 * 2. Computes discount (either percentage % of subtotal or fixed currency amount).
 * 3. Derives net taxable amount (subtotal - discount).
 * 4. Computes tax on the net taxable amount (so tax automatically decreases with discount).
 * 5. Supports tax addition (+ GST/VAT) or tax deduction (- TDS / Withholding percentage).
 */
export const calculateInvoiceMath = (inv: InvoiceData): InvoiceMathResult => {
  const subtotal = (inv.items || []).reduce(
    (acc, i) => acc + (i.quantity || 1) * (i.rate || 0),
    0
  );

  const discountType = inv.discountType || 'amount';
  const rawDiscount = Number(inv.discountAmount) || 0;

  // Calculate discount value: either percentage of subtotal or fixed amount
  const discountValue =
    discountType === 'percentage'
      ? (subtotal * Math.min(100, Math.max(0, rawDiscount))) / 100
      : Math.min(subtotal, Math.max(0, rawDiscount));

  // Net Taxable Base after trade discount
  const taxableAmount = Math.max(0, subtotal - discountValue);

  // Tax Rate
  const taxRate = Math.min(100, Math.max(0, Number(inv.taxRate) || 0));

  // Tax is calculated on taxable amount (so it decreases proportionally when discount is applied)
  const taxAmount = (taxableAmount * taxRate) / 100;

  // Tax Mode: 'add' (adds to total) or 'deduct' (decreases total by percentage, e.g. TDS)
  const isTaxDeduct = inv.taxType === 'deduct';

  // Grand Total calculation
  const grandTotal = Math.max(
    0,
    isTaxDeduct ? taxableAmount - taxAmount : taxableAmount + taxAmount
  );

  return {
    subtotal,
    discountType,
    rawDiscount,
    discountValue,
    taxableAmount,
    taxRate,
    taxAmount,
    isTaxDeduct,
    grandTotal,
  };
};
