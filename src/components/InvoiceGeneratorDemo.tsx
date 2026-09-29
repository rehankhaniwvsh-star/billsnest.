import React, { useState, useRef } from 'react';
import { InvoiceData, InvoiceItem, BrandSettings } from '../types';
import { validateStrict, InvoiceSchema, ValidationErrorDetail } from '../schemas/strictSchemas';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Copy,
  Check,
  X,
  Sparkles,
  Download,
  Mail,
  Maximize2,
  Minimize2,
  Save,
  Palette,
  CheckCircle2,
  AlertCircle,
  Landmark,
  QrCode,
  Smartphone,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { UpiPaymentModal } from './UpiPaymentModal';

interface InvoiceGeneratorDemoProps {
  brand: BrandSettings;
  isOpen: boolean;
  onClose: () => void;
  initialInvoice?: InvoiceData | null;
  onSaveInvoice: (invoice: InvoiceData) => void;
  onOpenEmail: (invoice: InvoiceData) => void;
  isFullscreenInitially?: boolean;
}

export const InvoiceGeneratorDemo: React.FC<InvoiceGeneratorDemoProps> = ({
  brand,
  isOpen,
  onClose,
  initialInvoice,
  onSaveInvoice,
  onOpenEmail,
  isFullscreenInitially = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenInitially);
  const [validationError, setValidationError] = useState<string>('');
  const [validationDetails, setValidationDetails] = useState<ValidationErrorDetail[]>([]);
  const [upiModalOpen, setUpiModalOpen] = useState(false);

  const printableRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    if (initialInvoice) return initialInvoice;
    return {
      id: `inv-${Date.now()}`,
      businessName: brand.brandName || 'Billnest Studio',
      businessEmail: brand.contactEmail || 'billing@billnest.app',
      businessLogoLetter: brand.logoLetter || 'B',
      clientName: 'Acme Corporation',
      clientEmail: 'billing@acme.corp',
      invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      currency: '₹',
      status: 'Paid',
      taxRate: 18,
      discountAmount: 0,
      themeColor: brand.primaryColor || '#7A1E2B',
      templateStyle: 'Modern',
      notes: 'Thank you for your business! Payment is due within 14 days.',
      items: [
        { id: '1', description: 'Brand Strategy & Identity System', quantity: 1, rate: 35000 },
        { id: '2', description: 'Responsive Web Application Development', quantity: 1, rate: 45000 },
      ],
    };
  });

  // Keep state updated if props change
  React.useEffect(() => {
    if (initialInvoice) {
      setInvoice(initialInvoice);
    }
    setIsFullscreen(isFullscreenInitially);
  }, [initialInvoice, isFullscreenInitially]);

  if (!isOpen) return null;

  // Invoice Math
  const subtotal = invoice.items.reduce(
    (acc, item) => acc + item.quantity * item.rate,
    0
  );
  const taxAmount = (subtotal * (invoice.taxRate || 0)) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - (invoice.discountAmount || 0));

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: 'New Deliverable / Service',
      quantity: 1,
      rate: 5000,
    };
    setInvoice({ ...invoice, items: [...invoice.items, newItem] });
  };

  const handleItemChange = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setInvoice({
      ...invoice,
      items: invoice.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const handleRemoveItem = (id: string) => {
    if (invoice.items.length <= 1) return;
    setInvoice({
      ...invoice,
      items: invoice.items.filter((item) => item.id !== id),
    });
  };

  // PDF Download powered by html2canvas + jsPDF
  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    setDownloadingPdf(true);

    try {
      const element = printableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber}_${invoice.clientName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF canvas, falling back to print dialog:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSave = () => {
    setValidationError('');
    setValidationDetails([]);

    // Strict schema check on all inputs (type, length, bounds, format)
    const validation = validateStrict(InvoiceSchema, invoice);
    if (!validation.success) {
      setValidationError(validation.error);
      setValidationDetails(validation.details);
      return;
    }

    onSaveInvoice(validation.data);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/#invoice-${invoice.invoiceNumber}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      <div
        className={`bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] w-full flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none h-screen'
            : 'max-w-5xl h-[92vh] max-h-[92vh] my-auto'
        }`}
      >
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-[var(--border)] bg-[var(--muted)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded text-[var(--primary-foreground)] font-bold flex items-center justify-center text-xs bg-[var(--primary)]"
            >
              {invoice.businessLogoLetter}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--foreground)]">
                Invoice {invoice.invoiceNumber} — Live Editor
              </h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Fully editable, customizable theme & downloadable PDF
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSavedNotice && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved to Dashboard!</span>
              </span>
            )}

            <button
              onClick={handleSave}
              className="btn-shader-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 btn-icon-hover-bounce" />
              <span>Save Invoice</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="btn-shader-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded cursor-pointer"
              title="Download crisp PDF file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500 btn-icon-hover-bounce" />
              <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            {/* Pay via UPI Action Button */}
            <button
              onClick={() => setUpiModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-xs cursor-pointer transition-all"
              title="Pay with Google Pay, PhonePe, Paytm, or BHIM"
            >
              <QrCode className="w-3.5 h-3.5 btn-icon-hover-bounce" />
              <span>Pay via UPI</span>
            </button>

            <button
              onClick={() => onOpenEmail(invoice)}
              className="btn-shader-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded cursor-pointer"
              title="Send Invoice via Email"
            >
              <Mail className="w-3.5 h-3.5 text-blue-500 btn-icon-hover-bounce" />
              <span>Email Invoice</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="btn-shader-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 btn-icon-hover-bounce" /> : <Copy className="w-3.5 h-3.5 btn-icon-hover-bounce" />}
              <span>{copied ? 'Link Copied' : 'Share'}</span>
            </button>

            {/* Short vs Full Screen Toggle Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn-shader inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[var(--secondary)] text-[var(--foreground)] rounded hover:bg-[var(--muted)] cursor-pointer"
              title={isFullscreen ? 'Switch to Compact Short View' : 'Switch to Fullscreen View'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 btn-icon-hover-bounce" />
                  <span className="hidden sm:inline">Short View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 btn-icon-hover-bounce" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded hover:bg-[var(--muted)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--background)] space-y-6">
          {validationError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs flex items-start gap-3 text-red-600 dark:text-red-400 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold mb-1">Strict Validation Rejection:</div>
                <div>{validationError}</div>
                {validationDetails.length > 1 && (
                  <ul className="list-disc pl-4 mt-2 space-y-1 text-[11px] opacity-90">
                    {validationDetails.map((detail, idx) => (
                      <li key={idx}>
                        <strong className="font-mono">{detail.field}</strong>: {detail.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => {
                  setValidationError('');
                  setValidationDetails([]);
                }}
                className="p-1 hover:bg-red-500/20 rounded cursor-pointer text-red-600 dark:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Controls Bar: Theme & Style selector */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                Invoice Color Theme
              </label>
              <div className="flex items-center gap-2">
                {[
                  { name: 'Primary Theme', hex: 'var(--primary)' },
                  { name: 'Blue', hex: '#2563EB' },
                  { name: 'Green', hex: '#3F7A4E' },
                  { name: 'Gold', hex: '#A67C3D' },
                  { name: 'Charcoal', hex: '#2B2320' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setInvoice({ ...invoice, themeColor: c.hex })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      invoice.themeColor === c.hex
                        ? 'border-[var(--foreground)] scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  ></button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                Template Layout Style
              </label>
              <select
                value={invoice.templateStyle || 'Modern'}
                onChange={(e) =>
                  setInvoice({
                    ...invoice,
                    templateStyle: e.target.value as InvoiceData['templateStyle'],
                  })
                }
                className="w-full p-1.5 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)] cursor-pointer"
              >
                <option value="Modern">Modern Branded</option>
                <option value="Classic">Classic Corporate</option>
                <option value="Minimal">Minimalist Clean</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                Invoice Status
              </label>
              <select
                value={invoice.status}
                onChange={(e) =>
                  setInvoice({
                    ...invoice,
                    status: e.target.value as InvoiceData['status'],
                  })
                }
                className="w-full p-1.5 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)] font-semibold cursor-pointer"
              >
                <option value="Paid">Paid</option>
                <option value="Sent">Sent</option>
                <option value="Draft">Draft</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Printable Invoice Document Preview & Form Fields */}
          <div
            ref={printableRef}
            className="print-invoice-modal bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 sm:p-10 shadow-md max-w-4xl mx-auto space-y-8"
          >
            {/* Header / Brand Banner */}
            <div
              className="p-6 rounded-md flex flex-wrap items-center justify-between gap-4 text-[var(--primary-foreground)] bg-[var(--primary)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[var(--card)] text-[var(--foreground)] font-extrabold flex items-center justify-center text-base shadow">
                  {invoice.businessLogoLetter}
                </div>
                <div>
                  <input
                    type="text"
                    value={invoice.businessName}
                    onChange={(e) =>
                      setInvoice({ ...invoice, businessName: e.target.value })
                    }
                    className="bg-transparent font-bold text-lg text-current border-b border-white/30 focus:outline-none w-full"
                  />
                  <input
                    type="text"
                    value={invoice.businessEmail}
                    onChange={(e) =>
                      setInvoice({ ...invoice, businessEmail: e.target.value })
                    }
                    className="bg-transparent text-xs text-current/80 border-b border-white/20 focus:outline-none w-full mt-1"
                  />
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase font-semibold text-current/70 block">
                  INVOICE
                </span>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) =>
                    setInvoice({ ...invoice, invoiceNumber: e.target.value })
                  }
                  className="bg-transparent font-mono font-bold text-lg text-current text-right border-b border-white/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Bill To & Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <span className="font-bold uppercase tracking-wider text-[var(--muted-foreground)] block">
                  Billed To
                </span>
                <input
                  type="text"
                  value={invoice.clientName}
                  onChange={(e) =>
                    setInvoice({ ...invoice, clientName: e.target.value })
                  }
                  placeholder="Client Company Name"
                  className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded font-semibold text-[var(--foreground)]"
                />
                <input
                  type="email"
                  value={invoice.clientEmail}
                  onChange={(e) =>
                    setInvoice({ ...invoice, clientEmail: e.target.value })
                  }
                  placeholder="Client Email Address"
                  className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--muted-foreground)]"
                />
                <input
                  type="text"
                  value={invoice.clientAddress || ''}
                  onChange={(e) =>
                    setInvoice({ ...invoice, clientAddress: e.target.value })
                  }
                  placeholder="Client Address (Street, City, State, ZIP, Country)"
                  className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--muted-foreground)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
                    Issue Date
                  </span>
                  <input
                    type="date"
                    value={invoice.issueDate}
                    onChange={(e) =>
                      setInvoice({ ...invoice, issueDate: e.target.value })
                    }
                    className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <span className="font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
                    Due Date
                  </span>
                  <input
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) =>
                      setInvoice({ ...invoice, dueDate: e.target.value })
                    }
                    className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)]"
                  />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-[var(--muted-foreground)] tracking-wider">
                  Services & Deliverables
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="border border-[var(--border)] rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] font-semibold text-[var(--muted-foreground)]">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 w-20">Qty</th>
                      <th className="p-3 w-28">Rate</th>
                      <th className="p-3 w-28 text-right">Amount</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--muted)]/30">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                'description',
                                e.target.value
                              )
                            }
                            className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                'quantity',
                                Number(e.target.value) || 1
                              )
                            }
                            className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min={0}
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                'rate',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                          />
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-[var(--foreground)]">
                          {invoice.currency}
                          {(item.quantity * item.rate).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-[var(--muted-foreground)] hover:text-red-600 p-1 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bank Details Card */}
            <div className="bg-[var(--muted)]/40 border border-[var(--border)] rounded-lg p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-[var(--foreground)]">
                  <Landmark className="w-4 h-4 text-orange-500" />
                  <span className="text-xs uppercase tracking-wide">Bank & Remittance Details</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUpiModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  <QrCode className="w-3 h-3" />
                  <span>Test UPI QR</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)] block mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={invoice.bankDetails?.bankName || ''}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        bankDetails: {
                          ...invoice.bankDetails,
                          bankName: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. HDFC / Chase Bank"
                    className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)] block mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={invoice.bankDetails?.accountName || ''}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        bankDetails: {
                          ...invoice.bankDetails,
                          accountName: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Acme Corp"
                    className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)] block mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={invoice.bankDetails?.accountNumber || ''}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        bankDetails: {
                          ...invoice.bankDetails,
                          accountNumber: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. 50200084729103"
                    className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)] block mb-1">
                    Routing / IFSC / SWIFT
                  </label>
                  <input
                    type="text"
                    value={invoice.bankDetails?.routingCode || ''}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        bankDetails: {
                          ...invoice.bankDetails,
                          routingCode: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. HDFC0001234"
                    className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)] block mb-1">
                    UPI / Payment ID
                  </label>
                  <input
                    type="text"
                    value={invoice.bankDetails?.upiId || ''}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        bankDetails: {
                          ...invoice.bankDetails,
                          upiId: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. acme@upi"
                    className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)] block mb-1">
                    IBAN (Optional)
                  </label>
                  <input
                    type="text"
                    value={invoice.bankDetails?.iban || ''}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        bankDetails: {
                          ...invoice.bankDetails,
                          iban: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. IN50HDFC..."
                    className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Math Totals & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[var(--border)]">
              <div>
                <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                  Payment Terms / Notes
                </label>
                <textarea
                  rows={3}
                  value={invoice.notes}
                  onChange={(e) =>
                    setInvoice({ ...invoice, notes: e.target.value })
                  }
                  className="w-full p-2.5 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                ></textarea>
              </div>

              <div className="space-y-2 bg-[var(--muted)]/50 p-4 border border-[var(--border)] rounded text-xs">
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-[var(--foreground)]">
                    {invoice.currency}
                    {subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                  <span>Tax (+ %):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={invoice.taxRate}
                      onChange={(e) =>
                        setInvoice({
                          ...invoice,
                          taxRate: Number(e.target.value) || 0,
                        })
                      }
                      className="w-16 p-1 bg-[var(--card)] border border-[var(--border)] rounded text-right text-xs"
                    />
                    <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                      +{invoice.currency}{taxAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                  <span>Discount (- {invoice.currency}):</span>
                  <input
                    type="number"
                    min={0}
                    value={invoice.discountAmount}
                    onChange={(e) =>
                      setInvoice({
                        ...invoice,
                        discountAmount: Number(e.target.value) || 0,
                      })
                    }
                    className="w-20 p-1 bg-[var(--card)] border border-[var(--border)] rounded text-right text-xs"
                  />
                </div>

                <div className="h-px bg-[var(--border)] my-2"></div>

                <div className="flex justify-between text-base font-bold text-[var(--foreground)]">
                  <span>Total Amount:</span>
                  <span className="font-mono text-[var(--primary)]">
                    {invoice.currency}
                    {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Payment Modal */}
      <UpiPaymentModal
        isOpen={upiModalOpen}
        onClose={() => setUpiModalOpen(false)}
        upiId={invoice.bankDetails?.upiId || ''}
        payeeName={invoice.businessName || brand.brandName}
        amount={grandTotal}
        currency={invoice.currency}
        invoiceNumber={invoice.invoiceNumber}
        onUpdateUpiId={(newUpiId) => {
          const updated: InvoiceData = {
            ...invoice,
            bankDetails: {
              ...(invoice.bankDetails || {}),
              upiId: newUpiId,
            },
          };
          setInvoice(updated);
          onSaveInvoice(updated);
        }}
        onMarkAsPaid={() => {
          const updated: InvoiceData = {
            ...invoice,
            status: 'Paid',
          };
          setInvoice(updated);
          onSaveInvoice(updated);
        }}
      />
    </div>
  );
};
