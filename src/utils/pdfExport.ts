import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InvoiceData } from '../types';
import { buildUpiUri, generateUpiQrDataUrl } from './upi';
import { calculateInvoiceMath } from './invoiceCalculations';

const escapeHtml = (value?: string | number | null): string => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const getContrastTextColor = (hex: string): string => {
  let clean = (hex || '#FF5238').replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return '#FFFFFF';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? '#0F172A' : '#FFFFFF';
};

const getCleanFilenameBase = (invoice: InvoiceData): string => {
  const cleanClient = (invoice.clientName || 'Client')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const cleanNumber = (invoice.invoiceNumber || 'Invoice')
    .replace(/[^\w\s-]/g, '')
    .trim();
  return `${cleanNumber || 'Invoice'}_${cleanClient || 'Client'}`;
};

interface BuiltCanvasResult {
  canvas: HTMLCanvasElement;
  upiQrDataUrl: string;
  cleanup: () => void;
}

const buildOffscreenInvoiceCanvas = async (
  invoice: InvoiceData,
  brandName: string
): Promise<BuiltCanvasResult> => {
  const currencySymbol = invoice.currency || '₹';
  const primaryHex = invoice.themeColor || '#FF5238';
  const templateStyle = invoice.templateStyle || 'Modern';
  const bannerTextColor = getContrastTextColor(primaryHex);
  const bannerMutedColor =
    bannerTextColor === '#FFFFFF' ? 'rgba(255,255,255,0.86)' : 'rgba(15,23,42,0.75)';

  const {
    subtotal,
    discountType,
    rawDiscount,
    discountValue,
    taxableAmount,
    taxRate,
    taxAmount,
    isTaxDeduct,
    grandTotal,
  } = calculateInvoiceMath(invoice);

  const statusUpper = (invoice.status || 'DRAFT').toUpperCase();
  let statusBg = '#F1F5F9';
  let statusColor = '#334155';
  let statusBorder = '#CBD5E1';

  if (statusUpper === 'PAID') {
    statusBg = '#ECFDF5';
    statusColor = '#047857';
    statusBorder = '#A7F3D0';
  } else if (statusUpper === 'SENT') {
    statusBg = '#EFF6FF';
    statusColor = '#1D4ED8';
    statusBorder = '#BFDBFE';
  } else if (statusUpper === 'OVERDUE') {
    statusBg = '#FFF1F2';
    statusColor = '#BE123C';
    statusBorder = '#FECDD3';
  }

  const bank = invoice.bankDetails;
  const upiId = bank?.upiId?.trim() || '';
  let upiQrDataUrl = '';

  if (upiId && invoice.showBankDetails !== false) {
    try {
      const upiUri = buildUpiUri({
        upiId,
        payeeName: invoice.businessName || brandName || 'Merchant',
        amount: grandTotal,
        currency: currencySymbol,
        invoiceNumber: invoice.invoiceNumber,
      });
      upiQrDataUrl = await generateUpiQrDataUrl(upiUri, 320);
    } catch (e) {
      console.warn('Could not generate UPI QR code for export:', e);
    }
  }

  const container = document.createElement('div');
  container.id = 'invobill-export-render-canvas';
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = '794px';
  container.style.minHeight = '1123px';
  container.style.backgroundColor = '#FFFFFF';
  container.style.color = '#0F172A';
  container.style.fontFamily =
    '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'space-between';
  container.style.zIndex = '-9999';

  const logoLetter = escapeHtml(
    invoice.businessLogoLetter || (invoice.businessName || brandName).charAt(0).toUpperCase() || 'I'
  );

  const logoHtml = invoice.businessLogoUrl
    ? `<div style="width: 52px; height: 52px; border-radius: 10px; background: #FFFFFF; padding: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
        <img src="${invoice.businessLogoUrl}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; display: block;" />
       </div>`
    : `<div style="width: 48px; height: 48px; border-radius: 10px; background: ${
        templateStyle === 'Modern' ? 'rgba(255,255,255,0.2)' : primaryHex
      }; color: ${
        templateStyle === 'Modern' ? bannerTextColor : '#FFFFFF'
      }; border: ${
        templateStyle === 'Modern' ? '1px solid rgba(255,255,255,0.3)' : 'none'
      }; font-weight: 800; font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        ${logoLetter}
       </div>`;

  const senderSubLines: string[] = [];
  if (invoice.ownerName) senderSubLines.push(escapeHtml(invoice.ownerName));
  if (invoice.businessEmail) senderSubLines.push(escapeHtml(invoice.businessEmail));
  if (invoice.businessPhone) senderSubLines.push(escapeHtml(invoice.businessPhone));
  if (invoice.businessWebsite) senderSubLines.push(escapeHtml(invoice.businessWebsite));

  const headerBannerHtml =
    templateStyle === 'Modern'
      ? `
      <div style="background: ${primaryHex}; color: ${bannerTextColor}; padding: 32px 40px; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;">
        <div style="display: flex; align-items: flex-start; gap: 16px; max-width: 62%;">
          ${logoHtml}
          <div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: ${bannerTextColor}; line-height: 1.2;">
              ${escapeHtml(invoice.businessName || brandName)}
            </h1>
            ${
              senderSubLines.length > 0
                ? `<div style="margin-top: 5px; font-size: 11.5px; color: ${bannerMutedColor}; line-height: 1.5;">${senderSubLines.join(' • ')}</div>`
                : ''
            }
            ${
              invoice.gstNumber
                ? `<div style="margin-top: 3px; font-size: 11px; font-family: 'IBM Plex Mono', monospace; color: ${bannerMutedColor};">GST/VAT: ${escapeHtml(invoice.gstNumber)}</div>`
                : ''
            }
            ${
              invoice.businessAddress
                ? `<div style="margin-top: 4px; font-size: 11px; color: ${bannerMutedColor}; white-space: pre-line; line-height: 1.4;">${escapeHtml(invoice.businessAddress)}</div>`
                : ''
            }
          </div>
        </div>

        <div style="text-align: right; flex-shrink: 0;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: ${bannerMutedColor};">
            INVOICE
          </div>
          <div style="font-size: 20px; font-weight: 800; color: ${bannerTextColor}; font-family: 'IBM Plex Mono', monospace; margin-top: 2px;">
            ${escapeHtml(invoice.invoiceNumber)}
          </div>
          <div style="margin-top: 6px;">
            <span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
              ${statusUpper}
            </span>
          </div>
        </div>
      </div>
    `
      : `
      <div style="padding: 34px 40px 22px 40px; border-bottom: ${
        templateStyle === 'Classic' ? `2px solid ${primaryHex}` : '1px solid #E2E8F0'
      }; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;">
        <div style="display: flex; align-items: flex-start; gap: 14px; max-width: 62%;">
          ${logoHtml}
          <div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #0F172A; line-height: 1.2;">
              ${escapeHtml(invoice.businessName || brandName)}
            </h1>
            ${
              senderSubLines.length > 0
                ? `<div style="margin-top: 4px; font-size: 11.5px; color: #64748B; line-height: 1.45;">${senderSubLines.join(' • ')}</div>`
                : ''
            }
            ${
              invoice.gstNumber
                ? `<div style="margin-top: 3px; font-size: 11px; font-family: 'IBM Plex Mono', monospace; color: #64748B;">GST/VAT: ${escapeHtml(invoice.gstNumber)}</div>`
                : ''
            }
            ${
              invoice.businessAddress
                ? `<div style="margin-top: 4px; font-size: 11px; color: #64748B; white-space: pre-line; line-height: 1.4;">${escapeHtml(invoice.businessAddress)}</div>`
                : ''
            }
          </div>
        </div>

        <div style="text-align: right; flex-shrink: 0;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: ${primaryHex};">
            INVOICE
          </div>
          <div style="font-size: 19px; font-weight: 800; color: #0F172A; font-family: 'IBM Plex Mono', monospace; margin-top: 2px;">
            ${escapeHtml(invoice.invoiceNumber)}
          </div>
          <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 6px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
            ${statusUpper}
          </span>
        </div>
      </div>
    `;

  const hasBankSection =
    invoice.showBankDetails !== false &&
    bank &&
    (bank.bankName ||
      bank.accountNumber ||
      bank.accountName ||
      bank.routingCode ||
      bank.iban ||
      bank.upiId);

  container.innerHTML = `
    <div style="flex: 1; display: flex; flex-direction: column;">
      ${headerBannerHtml}

      <div style="padding: 28px 40px 24px 40px; flex: 1; display: flex; flex-direction: column;">
        <!-- Bill To & Dates -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 22px; border-bottom: 1px solid #F1F5F9;">
          <div style="max-width: 58%;">
            <div style="font-size: 10px; font-weight: 800; color: ${primaryHex}; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px;">
              BILL TO
            </div>
            <div style="font-size: 15.5px; font-weight: 700; color: #0F172A; line-height: 1.3;">
              ${escapeHtml(invoice.clientName || 'Valued Client')}
            </div>
            ${
              invoice.clientEmail
                ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">${escapeHtml(invoice.clientEmail)}</div>`
                : ''
            }
            ${
              invoice.clientPhone
                ? `<div style="font-size: 11.5px; color: #64748B; margin-top: 2px;">${escapeHtml(invoice.clientPhone)}</div>`
                : ''
            }
            ${
              invoice.clientGst
                ? `<div style="font-size: 11px; font-family: 'IBM Plex Mono', monospace; color: #64748B; margin-top: 2px;">GST/VAT: ${escapeHtml(invoice.clientGst)}</div>`
                : ''
            }
            ${
              invoice.clientAddress
                ? `<div style="font-size: 11.5px; color: #64748B; margin-top: 4px; white-space: pre-line; line-height: 1.45;">${escapeHtml(invoice.clientAddress)}</div>`
                : ''
            }
          </div>

          <div style="text-align: right; min-width: 35%;">
            <div style="display: flex; justify-content: flex-end; gap: 28px;">
              <div>
                <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">
                  ISSUE DATE
                </div>
                <div style="font-size: 12.5px; font-weight: 600; color: #0F172A; font-family: 'IBM Plex Mono', monospace;">
                  ${escapeHtml(invoice.issueDate || '—')}
                </div>
              </div>
              <div>
                <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">
                  DUE DATE
                </div>
                <div style="font-size: 12.5px; font-weight: 600; color: #0F172A; font-family: 'IBM Plex Mono', monospace;">
                  ${escapeHtml(invoice.dueDate || '—')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Line Items Table -->
        <div style="margin-top: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid ${primaryHex}; font-size: 10px; font-weight: 800; color: ${primaryHex}; text-transform: uppercase; letter-spacing: 0.06em;">
                <th style="padding: 10px 8px 10px 0; width: 32px;">#</th>
                <th style="padding: 10px 10px;">DESCRIPTION</th>
                <th style="padding: 10px 10px; text-align: center; width: 64px;">QTY</th>
                <th style="padding: 10px 10px; text-align: right; width: 112px;">RATE</th>
                <th style="padding: 10px 0 10px 10px; text-align: right; width: 120px;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || [])
                .map(
                  (item, index) => `
                <tr style="border-bottom: 1px solid #F1F5F9;">
                  <td style="padding: 12px 8px 12px 0; font-family: 'IBM Plex Mono', monospace; color: #64748B; font-size: 11px;">
                    ${index + 1}
                  </td>
                  <td style="padding: 12px 10px; font-weight: 600; color: #0F172A; line-height: 1.4;">
                    ${escapeHtml(item.description || 'Deliverable')}
                  </td>
                  <td style="padding: 12px 10px; text-align: center; color: #475569; font-weight: 500;">
                    ${item.quantity || 1}
                  </td>
                  <td style="padding: 12px 10px; text-align: right; font-family: 'IBM Plex Mono', monospace; color: #334155; font-weight: 500;">
                    ${escapeHtml(currencySymbol)}${(item.rate || 0).toLocaleString()}
                  </td>
                  <td style="padding: 12px 0 12px 10px; text-align: right; font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: #0F172A;">
                    ${escapeHtml(currencySymbol)}${((item.quantity || 1) * (item.rate || 0)).toLocaleString()}
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Summary / Totals Row -->
        <div style="display: flex; flex-direction: column; align-items: flex-end; margin-top: 18px; margin-bottom: 22px;">
          <div style="width: 280px; display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; color: #64748B;">
              <span>Subtotal</span>
              <span style="font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: #0F172A;">
                ${escapeHtml(currencySymbol)}${subtotal.toLocaleString()}
              </span>
            </div>

            ${
              discountValue > 0
                ? `
              <div style="display: flex; justify-content: space-between; color: #059669;">
                <span>Discount ${discountType === 'percentage' ? `(-${rawDiscount}%)` : ''}</span>
                <span style="font-family: 'IBM Plex Mono', monospace; font-weight: 600;">
                  -${escapeHtml(currencySymbol)}${discountValue.toLocaleString()}
                </span>
              </div>
            `
                : ''
            }

            ${
              discountValue > 0 && taxRate > 0
                ? `
              <div style="display: flex; justify-content: space-between; color: #64748B; font-size: 11px; border-top: 1px dashed #E2E8F0; padding-top: 4px;">
                <span>Net Taxable Base</span>
                <span style="font-family: 'IBM Plex Mono', monospace;">
                  ${escapeHtml(currencySymbol)}${taxableAmount.toLocaleString()}
                </span>
              </div>
            `
                : ''
            }

            ${
              taxRate > 0
                ? `
              <div style="display: flex; justify-content: space-between; color: ${isTaxDeduct ? '#E11D48' : '#64748B'};">
                <span>${isTaxDeduct ? `Tax Deduction (TDS -${taxRate}%)` : `Tax (+${taxRate}%)`}</span>
                <span style="font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: ${isTaxDeduct ? '#E11D48' : '#0F172A'};">
                  ${isTaxDeduct ? '-' : '+'}${escapeHtml(currencySymbol)}${taxAmount.toLocaleString()}
                </span>
              </div>
            `
                : ''
            }

            <div style="height: 1px; background: #E2E8F0; margin: 4px 0;"></div>

            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 14px; font-weight: 700; color: #0F172A;">Total Due</span>
              <span style="font-size: 18px; font-weight: 800; font-family: 'IBM Plex Mono', monospace; color: ${primaryHex};">
                ${escapeHtml(currencySymbol)}${grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <!-- Bank & Payment Details Card with Integrated UPI QR Code -->
        ${
          hasBankSection && bank
            ? `
          <div style="background: linear-gradient(135deg, rgba(254, 243, 199, 0.35) 0%, rgba(255, 237, 213, 0.45) 100%), #FFFBF7; border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 14px; padding: 16px 18px; margin-bottom: 18px;">
            <div style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(249, 115, 22, 0.16); padding-bottom: 10px; margin-bottom: 12px;">
              <div style="width: 24px; height: 24px; border-radius: 6px; background: rgba(249, 115, 22, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M14 10v11M12 2L2 7h20L12 2z"/>
                </svg>
              </div>
              <div>
                <span style="font-size: 11px; font-weight: 800; color: #C2410C; text-transform: uppercase; letter-spacing: 0.08em; display: block; line-height: 1.2;">
                  PAYMENT & BANK WIRE DETAILS
                </span>
                <span style="font-size: 9.5px; color: #64748B; display: block; margin-top: 1px;">
                  Direct wire transfer or instant 0% fee UPI mobile checkout
                </span>
              </div>
            </div>

            <div style="display: flex; gap: 16px; align-items: center;">
              <div style="flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                ${
                  bank.bankName
                    ? `
                  <div style="background: #FFFFFF; border: 1px solid rgba(249, 115, 22, 0.18); border-radius: 8px; padding: 8px 11px;">
                    <span style="font-size: 9px; font-weight: 700; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 2px;">BANK NAME</span>
                    <span style="font-size: 11.5px; font-weight: 700; color: #0F172A; display: block;">${escapeHtml(bank.bankName)}</span>
                  </div>
                `
                    : ''
                }
                ${
                  bank.accountName || invoice.businessName
                    ? `
                  <div style="background: #FFFFFF; border: 1px solid rgba(249, 115, 22, 0.18); border-radius: 8px; padding: 8px 11px;">
                    <span style="font-size: 9px; font-weight: 700; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 2px;">BENEFICIARY</span>
                    <span style="font-size: 11.5px; font-weight: 700; color: #0F172A; display: block;">${escapeHtml(bank.accountName || invoice.businessName)}</span>
                  </div>
                `
                    : ''
                }
                ${
                  bank.accountNumber
                    ? `
                  <div style="background: #FFFFFF; border: 1px solid rgba(249, 115, 22, 0.18); border-radius: 8px; padding: 8px 11px;">
                    <span style="font-size: 9px; font-weight: 700; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 2px;">ACCOUNT NUMBER</span>
                    <span style="font-size: 11.5px; font-weight: 800; font-family: 'IBM Plex Mono', monospace; color: #0F172A; display: block;">${escapeHtml(bank.accountNumber)}</span>
                  </div>
                `
                    : ''
                }
                ${
                  bank.routingCode
                    ? `
                  <div style="background: #FFFFFF; border: 1px solid rgba(249, 115, 22, 0.18); border-radius: 8px; padding: 8px 11px;">
                    <span style="font-size: 9px; font-weight: 700; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 2px;">IFSC / ROUTING / SWIFT</span>
                    <span style="font-size: 11.5px; font-weight: 700; font-family: 'IBM Plex Mono', monospace; color: #0F172A; display: block;">${escapeHtml(bank.routingCode)}</span>
                  </div>
                `
                    : ''
                }
                ${
                  bank.iban
                    ? `
                  <div style="background: #FFFFFF; border: 1px solid rgba(249, 115, 22, 0.18); border-radius: 8px; padding: 8px 11px;">
                    <span style="font-size: 9px; font-weight: 700; color: #64748B; text-transform: uppercase; display: block; margin-bottom: 2px;">IBAN</span>
                    <span style="font-size: 10.5px; font-weight: 700; font-family: 'IBM Plex Mono', monospace; color: #0F172A; display: block;">${escapeHtml(bank.iban)}</span>
                  </div>
                `
                    : ''
                }
                ${
                  bank.upiId
                    ? `
                  <div style="background: #FFFFFF; border: 1px solid rgba(249, 115, 22, 0.28); border-radius: 8px; padding: 8px 11px;">
                    <span style="font-size: 9px; font-weight: 700; color: #EA580C; text-transform: uppercase; display: block; margin-bottom: 2px;">UPI ID (VPA)</span>
                    <span style="font-size: 11.5px; font-weight: 800; font-family: 'IBM Plex Mono', monospace; color: #EA580C; display: block;">${escapeHtml(bank.upiId)}</span>
                  </div>
                `
                    : ''
                }
              </div>

              ${
                upiQrDataUrl
                  ? `
                <div style="flex-shrink: 0; width: 136px; background: #FFFFFF; border: 2px solid rgba(249, 115, 22, 0.35); border-radius: 12px; padding: 10px 12px; text-align: center; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.08); display: flex; flex-direction: column; align-items: center;">
                  <img src="${upiQrDataUrl}" alt="Scan to pay via UPI" style="width: 96px; height: 96px; display: block; margin: 0 auto; border-radius: 6px;" />
                  <span style="font-size: 9px; font-weight: 900; color: #EA580C; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 6px; display: block;">
                    SCAN TO PAY (UPI)
                  </span>
                  <span style="font-size: 8px; font-weight: 600; color: #64748B; margin-top: 2px; display: block;">
                    GPay • PhonePe • Paytm • BHIM
                  </span>
                  <span style="font-size: 9.5px; font-weight: 800; font-family: 'IBM Plex Mono', monospace; color: #0F172A; margin-top: 5px; display: inline-block; background: #FFF7ED; padding: 2px 8px; border-radius: 4px; border: 1px solid #FFEDD5;">
                    ${escapeHtml(currencySymbol)}${grandTotal.toLocaleString()}
                  </span>
                </div>
              `
                  : ''
              }
            </div>

            <div style="margin-top: 10px; font-size: 10px; color: #9A3412;">
              <strong style="font-weight: 700;">Note:</strong> ${escapeHtml(bank.paymentInstructions || 'Please specify invoice number in wire transfer reference.')}
            </div>
          </div>
        `
            : ''
        }

        <!-- Notes & Terms Box -->
        ${
          invoice.notes
            ? `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
            <div style="font-size: 9.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px;">
              Notes & Terms:
            </div>
            <div style="font-size: 11px; color: #334155; line-height: 1.45; white-space: pre-line;">
              ${escapeHtml(invoice.notes)}
            </div>
          </div>
        `
            : ''
        }
      </div>
    </div>

    ${
      invoice.hideWatermark
        ? '<div style="height: 20px;"></div>'
        : `<div style="text-align: center; font-size: 10.5px; color: #94A3B8; padding: 12px 40px 24px 40px;">
            Powered by ${escapeHtml(brandName || 'Invobill')} • Professional Branded Invoicing
          </div>`
    }
  `;

  document.body.appendChild(container);

  const cleanup = () => {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  };

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
    });
    return { canvas, upiQrDataUrl, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
};

/**
 * Downloads a high-resolution, pixel-perfect invoice PDF.
 */
export const downloadInvoicePdf = async (
  invoice: InvoiceData,
  brandName: string = 'Invobill',
  _sourceElement?: HTMLElement | null
) => {
  try {
    const { canvas, cleanup } = await buildOffscreenInvoiceCanvas(invoice, brandName);
    try {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${getCleanFilenameBase(invoice)}.pdf`);
    } finally {
      cleanup();
    }
  } catch (canvasErr) {
    console.error('html2canvas rendering failed, running resilient fallback:', canvasErr);
    let upiQrDataUrl = '';
    const upiId = invoice.bankDetails?.upiId?.trim();
    if (upiId && invoice.showBankDetails !== false) {
      try {
        const { grandTotal } = calculateInvoiceMath(invoice);
        const uri = buildUpiUri({
          upiId,
          payeeName: invoice.businessName || brandName || 'Merchant',
          amount: grandTotal,
          currency: invoice.currency || '₹',
          invoiceNumber: invoice.invoiceNumber,
        });
        upiQrDataUrl = await generateUpiQrDataUrl(uri, 320);
      } catch {}
    }
    await runDirectJsPdfFallback(invoice, brandName, upiQrDataUrl);
  }
};

/**
 * Downloads a crisp 2x retina PNG image of the invoice document.
 */
export const downloadInvoicePng = async (
  invoice: InvoiceData,
  brandName: string = 'Invobill'
) => {
  const { canvas, cleanup } = await buildOffscreenInvoiceCanvas(invoice, brandName);
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${getCleanFilenameBase(invoice)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    cleanup();
  }
};

/**
 * Clean fallback using direct jsPDF in case of canvas failure.
 * Maps '₹' to 'Rs. ' to avoid jsPDF winansi character encoding corruption ('¹').
 */
const runDirectJsPdfFallback = async (
  invoice: InvoiceData,
  brandName: string,
  upiQrDataUrl: string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const safeCurrency = invoice.currency === '₹' ? 'Rs. ' : invoice.currency || '$ ';

  const primaryHex = invoice.themeColor || '#FF5238';
  let cleanHex = primaryHex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16) || 0xff5238;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  // Business Logo & Brand
  doc.setFillColor(r, g, b);
  doc.roundedRect(15, 14, 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const letter = invoice.businessLogoLetter || brandName.charAt(0) || 'I';
  doc.text(letter, 20, 21, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.businessName || brandName, 28, 19);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(invoice.businessEmail || 'billing@invobill.app', 28, 24);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber, 195, 19, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text((invoice.status || 'DRAFT').toUpperCase(), 195, 24, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 28, 195, 28);

  let y = 40;
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 15, y);
  doc.text('ISSUE DATE', 130, y);
  doc.text('DUE DATE', 170, y);

  y += 5;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.clientName || 'Client', 15, y);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.issueDate || '—', 130, y);
  doc.text(invoice.dueDate || '—', 170, y);

  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(invoice.clientEmail || '', 15, y);

  if (invoice.clientAddress) {
    const addressLines = doc.splitTextToSize(invoice.clientAddress, 95);
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    addressLines.forEach((line: string) => {
      y += 4.5;
      doc.text(line, 15, y);
    });
  }

  y += 10;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, y, 180, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('DESCRIPTION', 18, y + 5.5);
  doc.text('QTY', 125, y + 5.5, { align: 'center' });
  doc.text('RATE', 160, y + 5.5, { align: 'right' });
  doc.text('AMOUNT', 192, y + 5.5, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);

  (invoice.items || []).forEach((item) => {
    const amt = (item.quantity || 1) * (item.rate || 0);
    y += 7;
    doc.text(item.description || 'Deliverable', 18, y);
    doc.text(String(item.quantity || 1), 125, y, { align: 'center' });
    doc.text(`${safeCurrency}${item.rate.toLocaleString()}`, 160, y, { align: 'right' });
    doc.text(`${safeCurrency}${amt.toLocaleString()}`, 192, y, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(15, y + 2, 195, y + 2);
  });

  const math = calculateInvoiceMath(invoice);
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', 160, y, { align: 'right' });
  doc.setTextColor(15, 23, 42);
  doc.text(`${safeCurrency}${math.subtotal.toLocaleString()}`, 192, y, { align: 'right' });

  if (math.discountValue > 0) {
    y += 6;
    doc.setTextColor(5, 150, 105);
    const discLabel =
      math.discountType === 'percentage' ? `Discount (${math.rawDiscount}%):` : 'Discount:';
    doc.text(discLabel, 160, y, { align: 'right' });
    doc.text(`-${safeCurrency}${math.discountValue.toLocaleString()}`, 192, y, { align: 'right' });
  }

  if (math.taxRate > 0) {
    y += 6;
    if (math.isTaxDeduct) {
      doc.setTextColor(225, 29, 72);
      doc.text(`Tax Deducted (TDS -${math.taxRate}%):`, 160, y, { align: 'right' });
      doc.text(`-${safeCurrency}${math.taxAmount.toLocaleString()}`, 192, y, { align: 'right' });
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text(`Tax (+${math.taxRate}%):`, 160, y, { align: 'right' });
      doc.setTextColor(15, 23, 42);
      doc.text(`+${safeCurrency}${math.taxAmount.toLocaleString()}`, 192, y, { align: 'right' });
    }
  }

  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Total Due:', 160, y, { align: 'right' });
  doc.setTextColor(r, g, b);
  doc.text(`${safeCurrency}${math.grandTotal.toLocaleString()}`, 192, y, { align: 'right' });

  const bankDetails = invoice.bankDetails;
  if (bankDetails && invoice.showBankDetails !== false) {
    y += 12;
    doc.setFillColor(255, 251, 247);
    doc.setDrawColor(254, 215, 170);
    doc.roundedRect(15, y, 180, 32, 3, 3, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(194, 65, 12);
    doc.text('PAYMENT & BANK WIRE DETAILS', 19, y + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const l1: string[] = [];
    if (bankDetails.bankName) l1.push(`Bank: ${bankDetails.bankName}`);
    if (bankDetails.accountName) l1.push(`Beneficiary: ${bankDetails.accountName}`);
    if (bankDetails.accountNumber) l1.push(`A/C: ${bankDetails.accountNumber}`);

    const l2: string[] = [];
    if (bankDetails.routingCode) l2.push(`IFSC: ${bankDetails.routingCode}`);
    if (bankDetails.upiId) l2.push(`UPI ID: ${bankDetails.upiId}`);

    doc.text(l1.join('  •  '), 19, y + 12);
    if (l2.length > 0) doc.text(l2.join('  •  '), 19, y + 17);
    if (bankDetails.paymentInstructions) {
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Note: ${bankDetails.paymentInstructions}`, 19, y + 23);
    }

    if (upiQrDataUrl) {
      try {
        doc.addImage(upiQrDataUrl, 'PNG', 168, y + 3, 24, 24);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(194, 65, 12);
        doc.text('SCAN TO PAY (UPI)', 180, y + 29, { align: 'center' });
      } catch {}
    }
  }

  if (!invoice.hideWatermark) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Powered by ${brandName || 'Invobill'} • Professional Branded Invoicing`, 105, 282, {
      align: 'center',
    });
  }

  doc.save(`${getCleanFilenameBase(invoice)}.pdf`);
};
