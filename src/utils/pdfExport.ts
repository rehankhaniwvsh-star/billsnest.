import jsPDF from 'jspdf';
import { InvoiceData } from '../types';
import { buildUpiUri, generateUpiQrDataUrl } from './upi';

export const downloadInvoicePdf = async (invoice: InvoiceData, brandName: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryHex = invoice.themeColor || '#7A1E2B';
  // Helper to convert hex to RGB
  const hexToRgb = (hex: string) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    return [num >> 16, (num >> 8) & 255, num & 255];
  };

  const [r, g, b] = hexToRgb(primaryHex);

  // Header banner background
  doc.setFillColor(r, g, b);
  doc.rect(15, 15, 180, 24, 'F');

  // Business Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.businessName || brandName, 22, 27);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.businessEmail || 'billing@billnest.app', 22, 33);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`INVOICE ${invoice.invoiceNumber}`, 188, 26, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`STATUS: ${(invoice.status || 'DRAFT').toUpperCase()}`, 188, 33, { align: 'right' });

  // Bill To & Dates
  let y = 48;
  doc.setTextColor(138, 129, 119);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO', 15, y);
  doc.text('ISSUE DATE', 120, y);
  doc.text('DUE DATE', 165, y);

  y += 5;
  doc.setTextColor(43, 35, 32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.clientName || 'Client', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.issueDate || '', 120, y);
  doc.text(invoice.dueDate || '', 165, y);

  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(138, 129, 119);
  doc.text(invoice.clientEmail || '', 15, y);

  if (invoice.clientAddress) {
    const addressLines = doc.splitTextToSize(invoice.clientAddress, 95);
    doc.setFontSize(8.5);
    doc.setTextColor(100, 95, 90);
    addressLines.forEach((line: string) => {
      y += 4.5;
      doc.text(line, 15, y);
    });
  }

  // Table Header
  y += 10;
  doc.setFillColor(245, 240, 234);
  doc.rect(15, y, 180, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(138, 129, 119);
  doc.text('DESCRIPTION', 18, y + 5.5);
  doc.text('QTY', 120, y + 5.5, { align: 'center' });
  doc.text('RATE', 155, y + 5.5, { align: 'right' });
  doc.text('AMOUNT', 190, y + 5.5, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(43, 35, 32);
  doc.setFontSize(9);

  let subtotal = 0;
  (invoice.items || []).forEach((item) => {
    const amt = (item.quantity || 1) * (item.rate || 0);
    subtotal += amt;
    y += 7;
    doc.text(item.description || 'Item', 18, y);
    doc.text(String(item.quantity || 1), 120, y, { align: 'center' });
    doc.text(`${invoice.currency || '₹'}${item.rate.toLocaleString()}`, 155, y, { align: 'right' });
    doc.text(`${invoice.currency || '₹'}${amt.toLocaleString()}`, 190, y, { align: 'right' });

    doc.setDrawColor(227, 222, 214);
    doc.line(15, y + 2, 195, y + 2);
  });

  // Math Totals
  y += 10;
  const tax = (subtotal * (invoice.taxRate || 0)) / 100;
  const discount = invoice.discountAmount || 0;
  const grandTotal = Math.max(0, subtotal + tax - discount);

  doc.setFontSize(9);
  doc.setTextColor(138, 129, 119);
  doc.text('Subtotal:', 155, y, { align: 'right' });
  doc.setTextColor(43, 35, 32);
  doc.text(`${invoice.currency || '₹'}${subtotal.toLocaleString()}`, 190, y, { align: 'right' });

  if (invoice.taxRate > 0) {
    y += 6;
    doc.setTextColor(138, 129, 119);
    doc.text(`Tax (${invoice.taxRate}%):`, 155, y, { align: 'right' });
    doc.setTextColor(43, 35, 32);
    doc.text(`+${invoice.currency || '₹'}${tax.toLocaleString()}`, 190, y, { align: 'right' });
  }

  if (discount > 0) {
    y += 6;
    doc.setTextColor(138, 129, 119);
    doc.text('Discount:', 155, y, { align: 'right' });
    doc.setTextColor(63, 122, 78);
    doc.text(`-${invoice.currency || '₹'}${discount.toLocaleString()}`, 190, y, { align: 'right' });
  }

  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(43, 35, 32);
  doc.text('Total Due:', 155, y, { align: 'right' });
  doc.setTextColor(r, g, b);
  doc.text(`${invoice.currency || '₹'}${grandTotal.toLocaleString()}`, 190, y, { align: 'right' });

  if (invoice.notes) {
    y += 14;
    doc.setFillColor(251, 249, 246);
    doc.rect(15, y, 180, 16, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(138, 129, 119);
    doc.text('Notes & Terms:', 18, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(43, 35, 32);
    doc.text(invoice.notes, 18, y + 11);
    y += 16;
  }

  // Bank & Payment Details
  const bank = invoice.bankDetails;
  if (bank && (bank.bankName || bank.accountNumber || bank.accountName || bank.routingCode || bank.iban || bank.upiId || bank.paymentInstructions)) {
    y += 10;
    const hasUpi = !!bank.upiId;
    const boxHeight = hasUpi ? 30 : 26;
    doc.setFillColor(248, 247, 245);
    doc.setDrawColor(230, 225, 218);
    doc.roundedRect(15, y, 180, boxHeight, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(r, g, b);
    doc.text('PAYMENT & BANK DETAILS', 19, y + 5.5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 75, 70);

    let line1 = [];
    if (bank.bankName) line1.push(`Bank: ${bank.bankName}`);
    if (bank.accountName) line1.push(`Beneficiary: ${bank.accountName}`);
    if (bank.accountNumber) line1.push(`A/C No: ${bank.accountNumber}`);

    let line2 = [];
    if (bank.routingCode) line2.push(`Routing/IFSC: ${bank.routingCode}`);
    if (bank.iban) line2.push(`IBAN: ${bank.iban}`);
    if (bank.upiId) line2.push(`UPI ID: ${bank.upiId}`);

    doc.text(line1.join('  •  ') || 'Direct Bank Wire Transfer', 19, y + 11);
    if (line2.length > 0) {
      doc.text(line2.join('  •  '), 19, y + 16);
    }
    if (bank.paymentInstructions) {
      doc.setFontSize(7.5);
      doc.setTextColor(120, 115, 110);
      doc.text(`Instructions: ${bank.paymentInstructions}`, 19, y + 21);
    }

    // Embed scannable UPI QR code if UPI ID is present
    if (hasUpi && bank.upiId) {
      try {
        const upiUri = buildUpiUri({
          upiId: bank.upiId,
          payeeName: invoice.businessName || brandName || 'Merchant',
          amount: grandTotal,
          currency: invoice.currency,
          invoiceNumber: invoice.invoiceNumber,
        });
        const qrData = await generateUpiQrDataUrl(upiUri, 180);
        if (qrData) {
          doc.addImage(qrData, 'PNG', 167, y + 3, 23, 23);
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(200, 80, 20);
          doc.text('SCAN TO PAY (UPI)', 178.5, y + 28, { align: 'center' });
        }
      } catch (err) {
        console.warn('Could not render UPI QR on PDF:', err);
      }
    }
  }

  // Footer branding tag
  doc.setFontSize(8);
  doc.setTextColor(138, 129, 119);
  doc.text('Powered by Billnest • Professional Branded Invoicing', 105, 280, { align: 'center' });

  // Save/Download PDF
  const filename = `${invoice.invoiceNumber || 'Invoice'}_${(invoice.clientName || 'Client').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};
