import React, { useState, useEffect, useRef } from 'react';
import { InvoiceData, InvoiceItem, BrandSettings, SubscriptionPlanId } from '../types';
import {
  Plus,
  Printer,
  Share2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Copy,
  Check,
  Mail,
  Landmark,
  QrCode,
  Upload,
  RefreshCw,
  Bookmark,
  LayoutGrid,
  Image as ImageIcon,
  Palette,
  X,
  Search,
  ChevronRight,
  Lock,
  CreditCard,
  Sparkles,
  Users,
} from 'lucide-react';
import { downloadInvoicePdf, downloadInvoicePng } from '../utils/pdfExport';
import { buildUpiUri, generateUpiQrDataUrl } from '../utils/upi';
import { BrandLogo } from './BrandLogo';
import { InvoiceSchema, validateStrict, ValidationErrorDetail } from '../schemas/strictSchemas';
import { UpiPaymentModal } from './UpiPaymentModal';
import { calculateInvoiceMath } from '../utils/invoiceCalculations';
import { useAuth } from '../context/AuthContext';
import { getPlanDefinition } from '../data/subscriptionPlans';
import {
  ClientSuggestion,
  buildClientSuggestions,
  fetchPreviousClientsFromFirestore,
} from '../services/firestoreService';

interface InvoiceStudioViewProps {
  brand: BrandSettings;
  invoices: InvoiceData[];
  selectedInvoiceId: string | null;
  onBackToLanding: () => void;
  onSaveInvoice: (invoice: InvoiceData) => void;
  onDeleteInvoice: (id: string) => void;
  onSelectInvoiceById: (id: string) => void;
  onCreateNew: () => void;
  onOpenEmail: (invoice: InvoiceData) => void;
  onOpenDashboard?: () => void;
  onOpenUpgrade?: (plan?: SubscriptionPlanId) => void;
  onPayInvoiceRazorpay?: (invoice: InvoiceData) => void;
}

type StudioMode = 'form' | 'customize';
type FormTab = 'business' | 'customer' | 'details' | 'items';

const THEME_SWATCHES = [
  { name: 'Invobill Coral', hex: '#FF5238' },
  { name: 'Warm Orange', hex: '#EA580C' },
  { name: 'Teal Studio', hex: '#0F766E' },
  { name: 'Slate Ink', hex: '#0F172A' },
  { name: 'Indigo Pro', hex: '#4F46E5' },
  { name: 'Crimson', hex: '#DC2626' },
];

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

const compressLogoToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const maxDim = 256;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png', 0.9));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

export const InvoiceStudioView: React.FC<InvoiceStudioViewProps> = ({
  brand,
  invoices,
  selectedInvoiceId,
  onBackToLanding,
  onSaveInvoice,
  onDeleteInvoice,
  onSelectInvoiceById,
  onCreateNew,
  onOpenEmail,
  onOpenDashboard,
  onOpenUpgrade,
  onPayInvoiceRazorpay,
}) => {
  const { currentUser, currentPlan, planEntitlements } = useAuth();
  const planDef = getPlanDefinition(currentPlan);
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const monthlyInvoiceCount = invoices.filter((inv) =>
    (inv.issueDate || '').startsWith(currentMonthPrefix)
  ).length;
  const isAtFreeMonthlyLimit =
    planEntitlements.maxInvoicesPerMonth !== null &&
    monthlyInvoiceCount >= planEntitlements.maxInvoicesPerMonth;
  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    const found = invoices.find(
      (i) => i.id === selectedInvoiceId || i.invoiceNumber === selectedInvoiceId
    );
    if (found) return found;
    return (
      invoices[0] || {
        id: `inv-${Date.now()}`,
        businessName: brand.brandName || 'Invobill Studio',
        businessEmail: brand.contactEmail || 'billing@invobill.app',
        businessLogoLetter: brand.logoLetter || 'I',
        clientName: 'Customer Name',
        clientEmail: 'client@example.com',
        invoiceNumber: 'INV-2611-5117',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        currency: '₹',
        status: 'Draft',
        taxRate: 5,
        taxType: 'add',
        discountAmount: 0,
        discountType: 'amount',
        themeColor: brand.primaryColor || '#FF5238',
        templateStyle: 'Modern',
        showBankDetails: true,
        notes: 'Thank you for your business.',
        bankDetails: brand.defaultBankDetails || {
          bankName: 'HDFC Bank Ltd',
          accountName: brand.brandName || 'Invobill Studio',
          accountNumber: '50200084729103',
          routingCode: 'HDFC0001234',
          iban: 'IN50HDFC00012345020008472',
          upiId: 'invobill@hdfcbank',
          paymentInstructions: 'Please include invoice number in wire transfer narration.',
        },
        items: [{ id: 'item-1', description: 'Web Design & Development', quantity: 1, rate: 25000 }],
      }
    );
  });

  const [studioMode, setStudioMode] = useState<StudioMode>('form');
  const [activeTab, setActiveTab] = useState<FormTab>('business');
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [savedSearch, setSavedSearch] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDetail[]>([]);
  const [generalError, setGeneralError] = useState<string>('');
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [remoteClients, setRemoteClients] = useState<ClientSuggestion[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);

  const printableCardRef = useRef<HTMLDivElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const savedDrawerRef = useRef<HTMLDivElement>(null);
  const clientSuggestRef = useRef<HTMLDivElement>(null);

  // Fetch past client profiles from Firestore when authenticated
  useEffect(() => {
    let active = true;
    if (!currentUser?.id) {
      setRemoteClients([]);
      return;
    }
    fetchPreviousClientsFromFirestore(currentUser.id)
      .then((list) => {
        if (active) setRemoteClients(list);
      })
      .catch(() => {
        // Fallback smoothly to local invoices list
      });
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  // Close client suggestion dropdown on outside click
  useEffect(() => {
    if (!showClientSuggestions) return;
    const handleOutside = (e: MouseEvent) => {
      if (clientSuggestRef.current && !clientSuggestRef.current.contains(e.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showClientSuggestions]);

  const allClientSuggestions = React.useMemo(
    () => buildClientSuggestions(invoices, remoteClients),
    [invoices, remoteClients]
  );

  const matchingClientSuggestions = React.useMemo(() => {
    const rawQuery = (invoice.clientName || '').trim().toLowerCase();
    const isPlaceholder = rawQuery === 'new client' || rawQuery === 'customer name';
    if (!rawQuery || isPlaceholder) {
      return allClientSuggestions.slice(0, 5);
    }
    return allClientSuggestions
      .filter(
        (c) =>
          c.clientName.toLowerCase().includes(rawQuery) ||
          c.clientEmail.toLowerCase().includes(rawQuery) ||
          (c.clientGst || '').toLowerCase().includes(rawQuery)
      )
      .slice(0, 6);
  }, [allClientSuggestions, invoice.clientName]);

  const handleApplyClientSuggestion = (client: ClientSuggestion) => {
    setInvoice((prev) => ({
      ...prev,
      clientName: client.clientName,
      clientEmail: client.clientEmail || prev.clientEmail,
      clientPhone: client.clientPhone || '',
      clientGst: client.clientGst || '',
      clientAddress: client.clientAddress || '',
    }));
    setShowClientSuggestions(false);
    setActiveSuggestionIdx(-1);
    showToast(`Filled client details for ${client.clientName}`);
  };

  // Sync state when selected invoice ID changes or external list updates
  useEffect(() => {
    if (selectedInvoiceId) {
      const found = invoices.find(
        (i) => i.id === selectedInvoiceId || i.invoiceNumber === selectedInvoiceId
      );
      if (found) {
        setInvoice(found);
      }
    }
  }, [selectedInvoiceId, invoices]);

  // Close Saved dropdown on outside click
  useEffect(() => {
    if (!savedDrawerOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (savedDrawerRef.current && !savedDrawerRef.current.contains(e.target as Node)) {
        setSavedDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [savedDrawerOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Accounting Calculations
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

  // Live Scannable UPI QR Code generation
  useEffect(() => {
    let isMounted = true;
    const upiId = invoice.bankDetails?.upiId?.trim();
    if (upiId && invoice.showBankDetails !== false) {
      const uri = buildUpiUri({
        upiId,
        payeeName: invoice.businessName || brand.brandName || 'Merchant',
        amount: grandTotal,
        currency: invoice.currency,
        invoiceNumber: invoice.invoiceNumber,
      });
      generateUpiQrDataUrl(uri, 300).then((url) => {
        if (isMounted) setUpiQrDataUrl(url);
      });
    } else {
      setUpiQrDataUrl('');
    }
    return () => {
      isMounted = false;
    };
  }, [
    invoice.bankDetails?.upiId,
    invoice.showBankDetails,
    invoice.businessName,
    brand.brandName,
    grandTotal,
    invoice.currency,
    invoice.invoiceNumber,
  ]);

  const handleGenerateNewNumber = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const nextNumber = `INV-${yy}${mm}-${rand}`;
    setInvoice((prev) => ({ ...prev, invoiceNumber: nextNumber }));
    showToast(`Generated ${nextNumber}`);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressLogoToDataUrl(file);
      setInvoice((prev) => ({ ...prev, businessLogoUrl: compressed }));
      showToast('Business logo uploaded!');
    } catch (err) {
      console.error('Logo upload failed:', err);
      showToast('Could not process image file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: 'Service / Deliverable',
      quantity: 1,
      rate: 5000,
    };
    setInvoice((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleItemChange = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
      setGeneralError('');
    }
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (invoice.items.length <= 1) {
      showToast('Invoice must have at least one line item');
      return;
    }
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  };

  const handleSave = async () => {
    setValidationErrors([]);
    setGeneralError('');

    const validation = validateStrict(InvoiceSchema, invoice);
    if (!validation.success) {
      setValidationErrors(validation.details);
      setGeneralError(validation.error);
      showToast('Validation Error: Please review highlighted fields.');
      return;
    }

    setSavingDraft(true);
    try {
      const res = await fetch('/api/invoices/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ invoice: validation.data }),
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : {};
      if (!res.ok || !data.success) {
        if (data.details && Array.isArray(data.details)) {
          setValidationErrors(data.details);
        }
        setGeneralError(data.error || 'Server rejected invoice payload.');
        return;
      }

      onSaveInvoice(validation.data);
      showToast('Invoice draft saved!');
    } catch {
      onSaveInvoice(validation.data);
      showToast('Invoice saved locally.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      showToast('Generating high-resolution PDF...');
      await downloadInvoicePdf(invoice, brand.brandName || 'Invobill', printableCardRef.current);
      showToast('PDF downloaded!');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Opening print dialog...');
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    try {
      setDownloadingPng(true);
      showToast('Exporting high-DPI PNG...');
      await downloadInvoicePng(invoice, brand.brandName || 'Invobill');
      showToast('PNG image downloaded!');
    } catch (err) {
      console.error('PNG export error:', err);
      showToast('Could not export PNG image.');
    } finally {
      setDownloadingPng(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareLink = () => {
    const link = `${window.location.origin}/#invoice-${invoice.invoiceNumber}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast('Invoice share link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStatusChange = (newStatus: InvoiceData['status']) => {
    const updated = { ...invoice, status: newStatus };
    const validation = validateStrict(InvoiceSchema, updated);
    if (!validation.success) {
      setValidationErrors(validation.details);
      setGeneralError(validation.error);
      return;
    }
    setInvoice(updated);
    onSaveInvoice(updated);
    showToast(`Status updated to ${newStatus}`);
  };

  const calculateInvoiceTotalFormatted = (inv: InvoiceData) => {
    const { grandTotal: tot } = calculateInvoiceMath(inv);
    return `${inv.currency || '₹'}${tot.toLocaleString()}`;
  };

  const themeHex = invoice.themeColor || brand.primaryColor || '#FF5238';
  const bannerTextColor = getContrastTextColor(themeHex);
  const bannerMutedColor =
    bannerTextColor === '#FFFFFF' ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.72)';
  const templateStyle = invoice.templateStyle || 'Modern';

  const senderMetaItems = [
    invoice.ownerName,
    invoice.businessEmail,
    invoice.businessPhone,
    invoice.businessWebsite,
  ].filter(Boolean) as string[];

  const hasBankSection =
    invoice.showBankDetails !== false &&
    invoice.bankDetails &&
    (invoice.bankDetails.bankName ||
      invoice.bankDetails.accountNumber ||
      invoice.bankDetails.accountName ||
      invoice.bankDetails.routingCode ||
      invoice.bankDetails.iban ||
      invoice.bankDetails.upiId);

  const filteredSavedInvoices = invoices.filter((inv) => {
    const q = savedSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.clientName || '').toLowerCase().includes(q) ||
      (inv.businessName || '').toLowerCase().includes(q)
    );
  });

  const inputClass =
    'w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors';

  const labelClass = 'block text-[11px] font-semibold text-[var(--foreground)] mb-1';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Studio Dedicated Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--card)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Left: Brand Logo returning to Landing */}
          <button
            type="button"
            onClick={onBackToLanding}
            className="shrink-0 cursor-pointer flex items-center"
            title="Return to Home"
          >
            <BrandLogo
              brandName={brand.brandName || 'Invobill'}
              size="sm"
              showTagline={false}
            />
          </button>

          {/* Center: Create / Saved / Dashboard */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setSavedDrawerOpen(false);
                setStudioMode('form');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !savedDrawerOpen
                  ? 'bg-[var(--accent)] text-[var(--primary)] border border-[var(--primary)]/20'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>

            <div className="relative" ref={savedDrawerRef}>
              <button
                type="button"
                onClick={() => setSavedDrawerOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  savedDrawerOpen
                    ? 'bg-[var(--accent)] text-[var(--primary)] border border-[var(--primary)]/20'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Saved</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--muted)] text-[var(--foreground)] tabular-nums">
                  {invoices.length}
                </span>
              </button>

              {/* Saved Invoices Switcher Popover */}
              {savedDrawerOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-80 sm:w-96 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-3 z-50 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
                    <span className="text-xs font-bold text-[var(--foreground)]">
                      Saved Invoices ({invoices.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSavedDrawerOpen(false)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={savedSearch}
                      onChange={(e) => setSavedSearch(e.target.value)}
                      placeholder="Search invoice # or client..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)]">
                    {filteredSavedInvoices.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[var(--muted-foreground)]">
                        No matching invoices found.
                      </div>
                    ) : (
                      filteredSavedInvoices.map((inv) => {
                        const isActive =
                          (inv.id || inv.invoiceNumber) ===
                          (invoice.id || invoice.invoiceNumber);
                        return (
                          <div
                            key={inv.id || inv.invoiceNumber}
                            className={`flex items-center justify-between gap-2 py-2 px-2 rounded-lg transition-colors ${
                              isActive ? 'bg-[var(--accent)]/60' : 'hover:bg-[var(--muted)]/50'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSelectInvoiceById(inv.id || inv.invoiceNumber);
                                setSavedDrawerOpen(false);
                              }}
                              className="flex-1 text-left min-w-0 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[var(--foreground)]">
                                  {inv.invoiceNumber}
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                                  {inv.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">
                                {inv.clientName || 'Client'} •{' '}
                                <span className="font-mono font-semibold text-[var(--foreground)] tabular-nums">
                                  {calculateInvoiceTotalFormatted(inv)}
                                </span>
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectInvoiceById(inv.id || inv.invoiceNumber);
                                  setSavedDrawerOpen(false);
                                }}
                                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--primary)] rounded cursor-pointer"
                                title="Open in editor"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteInvoice(inv.id || inv.invoiceNumber)}
                                className="p-1 text-[var(--muted-foreground)] hover:text-rose-600 rounded cursor-pointer"
                                title="Delete invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}
          </nav>

          {/* Right: Plan Indicator + Primary New Invoice CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenUpgrade?.(currentPlan === 'free' ? 'pro' : 'business')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[var(--muted)] hover:bg-[var(--accent)] border border-[var(--border)] text-[var(--foreground)] transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
              title="View or upgrade subscription plan"
            >
              <Sparkles className="w-3 h-3 text-[var(--primary)]" />
              <span>
                {planDef.name}
                {planEntitlements.maxInvoicesPerMonth !== null
                  ? ` · ${monthlyInvoiceCount}/${planEntitlements.maxInvoicesPerMonth}/mo`
                  : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isAtFreeMonthlyLimit && onOpenUpgrade) {
                  showToast('Starter monthly limit (5 invoices) reached — upgrade to Pro for unlimited.');
                  onOpenUpgrade('pro');
                  return;
                }
                onCreateNew();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Workspace */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-5 space-y-4">
        {/* Strict Schema Validation Rejection Alert Banner */}
        {validationErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs text-red-600 dark:text-red-400 space-y-2">
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>Validation Error: Please fix the following fields</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValidationErrors([]);
                  setGeneralError('');
                }}
                className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <p className="text-[11px] opacity-90">
              {generalError || 'Input failed validation checks and was not saved.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {validationErrors.map((err, idx) => (
                <div
                  key={idx}
                  className="bg-red-500/10 rounded px-2.5 py-1 font-mono text-[11px] flex items-center gap-1.5"
                >
                  <span className="font-bold text-red-700 dark:text-red-300">
                    [{err.field}]:
                  </span>
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Form / Customize Controls */}
          <div className="lg:col-span-6 space-y-4">
            {/* Top Mode Toggle: Invoice Form | Customize */}
            <div className="bg-[var(--muted)] p-1 rounded-xl border border-[var(--border)] grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setStudioMode('form')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  studioMode === 'form'
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Invoice Form
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('customize')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  studioMode === 'customize'
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Customize
              </button>
            </div>

            {studioMode === 'form' ? (
              <>
                {/* Invoice Number & Quick Save Bar */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-[var(--foreground)]">Invoice</span>
                    <span className="font-mono text-xs font-semibold text-[var(--muted-foreground)] truncate">
                      #{invoice.invoiceNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleGenerateNewNumber}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      <span>New Number</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={savingDraft}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      {savingDraft ? (
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
                    </button>
                  </div>
                </div>

                {/* 4-Tab Bar: Business | Customer | Details | Items */}
                <div className="bg-[var(--muted)] p-1 rounded-xl border border-[var(--border)] grid grid-cols-4 gap-1">
                  {(
                    [
                      { id: 'business', label: 'Business' },
                      { id: 'customer', label: 'Customer' },
                      { id: 'details', label: 'Details' },
                      { id: 'items', label: 'Items' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-2 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-[var(--card)] text-[var(--foreground)] font-bold shadow-xs'
                          : 'text-[var(--muted-foreground)] font-medium hover:text-[var(--foreground)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Active Form Tab Panel */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
                  {activeTab === 'business' && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-sm font-bold text-[var(--foreground)]">
                          Business Information
                        </h2>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          Your company details
                        </p>
                      </div>

                      {/* Business Logo Upload */}
                      <div className="space-y-1.5">
                        <span className={labelClass}>Business Logo</span>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                            {invoice.businessLogoUrl ? (
                              <img
                                src={invoice.businessLogoUrl}
                                alt="Business Logo"
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Upload className="w-5 h-5 text-[var(--muted-foreground)]" />
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              ref={logoFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!planEntitlements.logoUploadAllowed && onOpenUpgrade) {
                                  showToast('Custom logo upload is unlocked on Pro & Business plans.');
                                  onOpenUpgrade('pro');
                                  return;
                                }
                                logoFileInputRef.current?.click();
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {!planEntitlements.logoUploadAllowed ? (
                                <Lock className="w-3.5 h-3.5 text-[var(--primary)]" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {!planEntitlements.logoUploadAllowed
                                  ? 'Upload Logo (Pro)'
                                  : invoice.businessLogoUrl
                                  ? 'Change Logo'
                                  : 'Upload Logo'}
                              </span>
                            </button>

                            {invoice.businessLogoUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setInvoice((prev) => ({ ...prev, businessLogoUrl: '' }))
                                }
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Business Name</label>
                          <input
                            type="text"
                            value={invoice.businessName}
                            placeholder="Your Business"
                            onChange={(e) => {
                              const newName = e.target.value;
                              const initial = newName.trim().charAt(0).toUpperCase() || 'I';
                              setInvoice((prev) => ({
                                ...prev,
                                businessName: newName,
                                businessLogoLetter: initial,
                              }));
                            }}
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Owner Name</label>
                          <input
                            type="text"
                            value={invoice.ownerName || ''}
                            placeholder="John Doe"
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, ownerName: e.target.value }))
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>GST/VAT Number</label>
                          <input
                            type="text"
                            value={invoice.gstNumber || ''}
                            placeholder="Optional"
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, gstNumber: e.target.value }))
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Email</label>
                          <input
                            type="email"
                            value={invoice.businessEmail}
                            placeholder="business@email.com"
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, businessEmail: e.target.value }))
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Phone</label>
                          <input
                            type="text"
                            value={invoice.businessPhone || ''}
                            placeholder="+1 234 567 890"
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, businessPhone: e.target.value }))
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Website</label>
                          <input
                            type="text"
                            value={invoice.businessWebsite || ''}
                            placeholder="www.business.com"
                            onChange={(e) =>
                              setInvoice((prev) => ({
                                ...prev,
                                businessWebsite: e.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Address</label>
                        <textarea
                          rows={3}
                          value={invoice.businessAddress || ''}
                          placeholder="Street, City, State, Zip"
                          onChange={(e) =>
                            setInvoice((prev) => ({ ...prev, businessAddress: e.target.value }))
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'customer' && (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-bold text-[var(--foreground)]">
                            Customer Information
                          </h2>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            Type a client name to auto-fill details from previous invoices
                          </p>
                        </div>
                        {allClientSuggestions.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--muted)] text-[10.5px] font-semibold text-[var(--muted-foreground)] tabular-nums">
                            <Users className="w-3 h-3 text-[var(--primary)]" />
                            <span>{allClientSuggestions.length} saved clients</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative" ref={clientSuggestRef}>
                          <label className={labelClass}>Customer Name</label>
                          <input
                            type="text"
                            value={invoice.clientName}
                            placeholder="Start typing client name..."
                            autoComplete="off"
                            onFocus={() => {
                              setShowClientSuggestions(true);
                              setActiveSuggestionIdx(-1);
                            }}
                            onChange={(e) => {
                              setInvoice((prev) => ({ ...prev, clientName: e.target.value }));
                              setShowClientSuggestions(true);
                              setActiveSuggestionIdx(-1);
                            }}
                            onKeyDown={(e) => {
                              if (!showClientSuggestions || matchingClientSuggestions.length === 0) {
                                return;
                              }
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setActiveSuggestionIdx((idx) =>
                                  idx < matchingClientSuggestions.length - 1 ? idx + 1 : 0
                                );
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setActiveSuggestionIdx((idx) =>
                                  idx > 0 ? idx - 1 : matchingClientSuggestions.length - 1
                                );
                              } else if (e.key === 'Enter' && activeSuggestionIdx >= 0) {
                                e.preventDefault();
                                handleApplyClientSuggestion(
                                  matchingClientSuggestions[activeSuggestionIdx]
                                );
                              } else if (e.key === 'Escape') {
                                setShowClientSuggestions(false);
                              }
                            }}
                            className={inputClass}
                          />

                          {/* Client Suggestions Dropdown */}
                          {showClientSuggestions && matchingClientSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1.5 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-40 overflow-hidden">
                              <div className="px-3 py-1.5 bg-[var(--muted)]/50 border-b border-[var(--border)] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                                <span>Previous Clients</span>
                                <span>Click to fill</span>
                              </div>
                              <div className="max-h-56 overflow-y-auto divide-y divide-[var(--border)]">
                                {matchingClientSuggestions.map((client, idx) => {
                                  const highlighted = idx === activeSuggestionIdx;
                                  return (
                                    <button
                                      key={`${client.clientName}-${client.clientEmail}-${idx}`}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleApplyClientSuggestion(client);
                                      }}
                                      className={`w-full px-3 py-2 text-left transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                                        highlighted
                                          ? 'bg-[var(--accent)]'
                                          : 'hover:bg-[var(--muted)]/60'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-[var(--foreground)] truncate">
                                          {client.clientName}
                                        </div>
                                        {client.clientEmail && (
                                          <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                                            {client.clientEmail}
                                            {client.clientPhone ? ` • ${client.clientPhone}` : ''}
                                          </div>
                                        )}
                                        {client.clientAddress && (
                                          <div className="text-[10px] text-[var(--muted-foreground)]/80 truncate mt-0.5">
                                            {client.clientAddress}
                                          </div>
                                        )}
                                      </div>

                                      {client.lastInvoiceNumber && (
                                        <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)] shrink-0">
                                          {client.lastInvoiceNumber}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className={labelClass}>Customer Email</label>
                          <input
                            type="email"
                            value={invoice.clientEmail}
                            placeholder="client@example.com"
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, clientEmail: e.target.value }))
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Phone</label>
                          <input
                            type="text"
                            value={invoice.clientPhone || ''}
                            placeholder="+1 234 567 890"
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, clientPhone: e.target.value }))
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>GST/VAT Number</label>
                          <input
                            type="text"
                            value={invoice.clientGst || ''}
                            placeholder="Optional"
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, clientGst: e.target.value }))
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Billing Address</label>
                        <textarea
                          rows={3}
                          value={invoice.clientAddress || ''}
                          placeholder="Street, City, State, Zip, Country"
                          onChange={(e) =>
                            setInvoice((prev) => ({ ...prev, clientAddress: e.target.value }))
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'details' && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-sm font-bold text-[var(--foreground)]">
                          Invoice Details & Payment
                        </h2>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                          Dates, currency, status, bank wire & instant UPI QR
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Invoice Number</label>
                          <input
                            type="text"
                            value={invoice.invoiceNumber}
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                            }
                            className={`${inputClass} font-mono font-bold`}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Currency</label>
                          <select
                            value={invoice.currency}
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, currency: e.target.value }))
                            }
                            className={`${inputClass} font-semibold`}
                          >
                            <option value="₹">₹ (INR)</option>
                            <option value="$">$ (USD)</option>
                            <option value="€">€ (EUR)</option>
                            <option value="£">£ (GBP)</option>
                          </select>
                        </div>

                        <div>
                          <label className={labelClass}>Status</label>
                          <select
                            value={invoice.status}
                            onChange={(e) =>
                              handleStatusChange(e.target.value as InvoiceData['status'])
                            }
                            className={`${inputClass} font-semibold`}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Issue Date</label>
                          <input
                            type="date"
                            value={invoice.issueDate}
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, issueDate: e.target.value }))
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Due Date</label>
                          <input
                            type="date"
                            value={invoice.dueDate}
                            onChange={(e) =>
                              setInvoice((prev) => ({ ...prev, dueDate: e.target.value }))
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Bank & UPI Details */}
                      <div className="pt-2 border-t border-[var(--border)] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
                            <Landmark className="w-4 h-4 text-[var(--primary)]" />
                            <span>Bank & UPI Payment Details</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUpiModalOpen(true)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Test UPI QR</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Bank Name</label>
                            <input
                              type="text"
                              value={invoice.bankDetails?.bankName || ''}
                              placeholder="HDFC Bank Ltd"
                              onChange={(e) =>
                                setInvoice((prev) => ({
                                  ...prev,
                                  bankDetails: { ...prev.bankDetails, bankName: e.target.value },
                                }))
                              }
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Beneficiary Name</label>
                            <input
                              type="text"
                              value={invoice.bankDetails?.accountName || ''}
                              placeholder="Invobill Studio"
                              onChange={(e) =>
                                setInvoice((prev) => ({
                                  ...prev,
                                  bankDetails: { ...prev.bankDetails, accountName: e.target.value },
                                }))
                              }
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Account Number</label>
                            <input
                              type="text"
                              value={invoice.bankDetails?.accountNumber || ''}
                              placeholder="50200084729103"
                              onChange={(e) =>
                                setInvoice((prev) => ({
                                  ...prev,
                                  bankDetails: {
                                    ...prev.bankDetails,
                                    accountNumber: e.target.value,
                                  },
                                }))
                              }
                              className={`${inputClass} font-mono`}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>IFSC / Routing / SWIFT</label>
                            <input
                              type="text"
                              value={invoice.bankDetails?.routingCode || ''}
                              placeholder="HDFC0001234"
                              onChange={(e) =>
                                setInvoice((prev) => ({
                                  ...prev,
                                  bankDetails: {
                                    ...prev.bankDetails,
                                    routingCode: e.target.value,
                                  },
                                }))
                              }
                              className={`${inputClass} font-mono`}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>IBAN</label>
                            <input
                              type="text"
                              value={invoice.bankDetails?.iban || ''}
                              placeholder="IN50HDFC..."
                              onChange={(e) =>
                                setInvoice((prev) => ({
                                  ...prev,
                                  bankDetails: { ...prev.bankDetails, iban: e.target.value },
                                }))
                              }
                              className={`${inputClass} font-mono`}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>UPI ID (VPA)</label>
                            <input
                              type="text"
                              value={invoice.bankDetails?.upiId || ''}
                              placeholder="invobill@hdfcbank"
                              onChange={(e) =>
                                setInvoice((prev) => ({
                                  ...prev,
                                  bankDetails: { ...prev.bankDetails, upiId: e.target.value },
                                }))
                              }
                              className={`${inputClass} font-mono`}
                            />
                          </div>
                        </div>

                        {upiQrDataUrl && (
                          <div className="p-2.5 bg-[var(--accent)] border border-[var(--primary)]/20 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={upiQrDataUrl}
                                alt="UPI QR"
                                onClick={() => setUpiModalOpen(true)}
                                className="w-10 h-10 rounded bg-white p-0.5 border border-[var(--border)] cursor-pointer"
                              />
                              <div>
                                <div className="text-[11px] font-bold text-[var(--primary)] tabular-nums">
                                  Live UPI QR Active ({invoice.currency}
                                  {grandTotal.toLocaleString()})
                                </div>
                                <div className="text-[10px] text-[var(--muted-foreground)]">
                                  Scannable by GPay, PhonePe, Paytm, BHIM
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUpiModalOpen(true)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-[var(--primary)] text-white rounded-lg cursor-pointer shrink-0"
                            >
                              Open QR
                            </button>
                          </div>
                        )}

                        <div>
                          <label className={labelClass}>Payment Instructions</label>
                          <input
                            type="text"
                            value={invoice.bankDetails?.paymentInstructions || ''}
                            placeholder="Please specify invoice number in wire reference."
                            onChange={(e) =>
                              setInvoice((prev) => ({
                                ...prev,
                                bankDetails: {
                                  ...prev.bankDetails,
                                  paymentInstructions: e.target.value,
                                },
                              }))
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Notes & Terms</label>
                        <textarea
                          rows={2}
                          value={invoice.notes}
                          placeholder="Thank you for your business."
                          onChange={(e) =>
                            setInvoice((prev) => ({ ...prev, notes: e.target.value }))
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'items' && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-sm font-bold text-[var(--foreground)]">
                            Line Items & Taxes
                          </h2>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            Add deliverables, discounts, and GST/VAT or TDS
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Item</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {invoice.items.map((item, idx) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold text-[var(--muted-foreground)]">
                                ITEM #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 text-[var(--muted-foreground)] hover:text-rose-600 rounded cursor-pointer"
                                title="Remove Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <input
                              type="text"
                              value={item.description}
                              placeholder="Item description or service name"
                              onChange={(e) =>
                                handleItemChange(item.id, 'description', e.target.value)
                              }
                              className={inputClass}
                            />

                            <div className="grid grid-cols-3 gap-2.5 items-end">
                              <div>
                                <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] mb-1">
                                  Qty
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleItemChange(
                                      item.id,
                                      'quantity',
                                      Math.max(1, Number(e.target.value) || 1)
                                    )
                                  }
                                  className={`${inputClass} tabular-nums`}
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-[var(--muted-foreground)] mb-1">
                                  Rate ({invoice.currency})
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={item.rate}
                                  onChange={(e) =>
                                    handleItemChange(
                                      item.id,
                                      'rate',
                                      Math.max(0, Number(e.target.value) || 0)
                                    )
                                  }
                                  className={`${inputClass} tabular-nums`}
                                />
                              </div>

                              <div className="text-right pb-1.5">
                                <span className="block text-[10px] text-[var(--muted-foreground)]">
                                  Amount
                                </span>
                                <span className="font-mono text-xs font-bold text-[var(--foreground)] tabular-nums">
                                  {invoice.currency}
                                  {((item.quantity || 1) * (item.rate || 0)).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tax & Discount Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[11px] font-semibold text-[var(--foreground)]">
                              Tax / TDS (%)
                            </label>
                            <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 bg-[var(--muted)] text-[10px]">
                              <button
                                type="button"
                                onClick={() =>
                                  setInvoice((prev) => ({ ...prev, taxType: 'add' }))
                                }
                                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                  invoice.taxType !== 'deduct'
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'text-[var(--muted-foreground)]'
                                }`}
                              >
                                + Add
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setInvoice((prev) => ({ ...prev, taxType: 'deduct' }))
                                }
                                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                  invoice.taxType === 'deduct'
                                    ? 'bg-rose-600 text-white'
                                    : 'text-[var(--muted-foreground)]'
                                }`}
                              >
                                - TDS
                              </button>
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={invoice.taxRate}
                              onChange={(e) =>
                                setInvoice((prev) => ({
                                  ...prev,
                                  taxRate: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                                }))
                              }
                              className={`${inputClass} pr-24 tabular-nums`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[var(--muted-foreground)] tabular-nums pointer-events-none">
                              {isTaxDeduct ? '-' : '+'}
                              {invoice.currency}
                              {Math.round(taxAmount).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[11px] font-semibold text-[var(--foreground)]">
                              Discount
                            </label>
                            <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 bg-[var(--muted)] text-[10px]">
                              <button
                                type="button"
                                onClick={() =>
                                  setInvoice((prev) => ({ ...prev, discountType: 'percentage' }))
                                }
                                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                  invoice.discountType === 'percentage'
                                    ? 'bg-amber-600 text-white'
                                    : 'text-[var(--muted-foreground)]'
                                }`}
                              >
                                %
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setInvoice((prev) => ({ ...prev, discountType: 'amount' }))
                                }
                                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                  invoice.discountType !== 'percentage'
                                    ? 'bg-amber-600 text-white'
                                    : 'text-[var(--muted-foreground)]'
                                }`}
                              >
                                {invoice.currency}
                              </button>
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={invoice.discountType === 'percentage' ? 100 : undefined}
                              value={invoice.discountAmount}
                              onChange={(e) =>
                                setInvoice((prev) => ({
                                  ...prev,
                                  discountAmount: Math.max(0, Number(e.target.value) || 0),
                                }))
                              }
                              className={`${inputClass} pr-24 tabular-nums`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-emerald-600 tabular-nums pointer-events-none">
                              -{invoice.currency}
                              {Math.round(discountValue).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Totals Summary Strip */}
                      <div className="p-3.5 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)] flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--muted-foreground)]">
                          Calculated Total Due
                        </span>
                        <span
                          className="font-mono text-base font-extrabold tabular-nums"
                          style={{ color: themeHex }}
                        >
                          {invoice.currency}
                          {grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* CUSTOMIZE PANEL */
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[var(--primary)]" />
                  <div>
                    <h2 className="text-sm font-bold text-[var(--foreground)]">
                      Customize Invoice Appearance
                    </h2>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Adjust header accent color, template layout, and sections
                    </p>
                  </div>
                </div>

                {/* Theme Swatches */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className={labelClass}>Brand Theme Color</label>
                    {!planEntitlements.customColorsAllowed && (
                      <button
                        type="button"
                        onClick={() => onOpenUpgrade?.('pro')}
                        className="text-[10.5px] font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Custom colors on Pro</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {THEME_SWATCHES.map((swatch, idx) => {
                      const active = themeHex.toLowerCase() === swatch.hex.toLowerCase();
                      const locked = !planEntitlements.customColorsAllowed && idx > 0;
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => {
                            if (locked && onOpenUpgrade) {
                              showToast('Custom brand colors are included in Pro.');
                              onOpenUpgrade('pro');
                              return;
                            }
                            setInvoice((prev) => ({ ...prev, themeColor: swatch.hex }));
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            active
                              ? 'border-[var(--primary)] bg-[var(--accent)] text-[var(--foreground)]'
                              : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <span>{swatch.name}</span>
                          {locked && <Lock className="w-3 h-3 opacity-60" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      type="color"
                      value={themeHex}
                      disabled={!planEntitlements.customColorsAllowed}
                      onChange={(e) =>
                        setInvoice((prev) => ({ ...prev, themeColor: e.target.value }))
                      }
                      className="w-9 h-9 rounded-lg border border-[var(--border)] cursor-pointer bg-transparent p-0.5 disabled:opacity-50"
                    />
                    <input
                      type="text"
                      value={themeHex}
                      disabled={!planEntitlements.customColorsAllowed}
                      onChange={(e) =>
                        setInvoice((prev) => ({ ...prev, themeColor: e.target.value }))
                      }
                      className={`${inputClass} max-w-[140px] font-mono uppercase disabled:opacity-50`}
                    />
                  </div>
                </div>

                {/* Template Style Selector */}
                <div className="space-y-2">
                  <label className={labelClass}>Template Layout</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['Modern', 'Classic', 'Minimal'] as const).map((tpl) => {
                      const active = templateStyle === tpl;
                      const locked = !planEntitlements.allowedTemplates.includes(tpl);
                      return (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => {
                            if (locked && onOpenUpgrade) {
                              showToast(`${tpl} layout unlocks on Pro & Business plans.`);
                              onOpenUpgrade('pro');
                              return;
                            }
                            setInvoice((prev) => ({ ...prev, templateStyle: tpl }));
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[var(--primary)] bg-[var(--accent)] text-[var(--foreground)]'
                              : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 text-xs font-bold">
                            <span>{tpl}</span>
                            {locked && <Lock className="w-3 h-3 text-[var(--primary)]" />}
                          </div>
                          <div className="text-[10px] opacity-80 mt-0.5">
                            {tpl === 'Modern'
                              ? 'Colored banner'
                              : tpl === 'Classic'
                              ? 'Crisp accent rule'
                              : 'Clean minimal'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggle Payment Box */}
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[var(--foreground)]">
                      Show Bank Wire & UPI QR Box
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      Include remittance & scannable QR on preview and exports
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setInvoice((prev) => ({
                        ...prev,
                        showBankDetails: prev.showBankDetails === false ? true : false,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                      invoice.showBankDetails !== false
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--background)] text-[var(--muted-foreground)] border-[var(--border)]'
                    }`}
                  >
                    {invoice.showBankDetails !== false ? 'Visible' : 'Hidden'}
                  </button>
                </div>

                {/* Toggle White-Label Footer */}
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                      <span>White-Label PDF &amp; PNG</span>
                      {!planEntitlements.removeWatermarkAllowed && (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--primary)]">
                          Pro
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      Remove &ldquo;Powered by Invobill&rdquo; footer from downloaded documents
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!planEntitlements.removeWatermarkAllowed && onOpenUpgrade) {
                        showToast('White-label exports are unlocked on Pro & Business plans.');
                        onOpenUpgrade('pro');
                        return;
                      }
                      setInvoice((prev) => ({
                        ...prev,
                        hideWatermark: !prev.hideWatermark,
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${
                      invoice.hideWatermark && planEntitlements.removeWatermarkAllowed
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-[var(--background)] text-[var(--muted-foreground)] border-[var(--border)]'
                    }`}
                  >
                    {!planEntitlements.removeWatermarkAllowed && <Lock className="w-3 h-3" />}
                    <span>
                      {invoice.hideWatermark && planEntitlements.removeWatermarkAllowed
                        ? 'White-Label'
                        : 'Show Footer'}
                    </span>
                  </button>
                </div>

                {/* Quick Invoice Actions */}
                <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenEmail(invoice)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[var(--muted)] border border-[var(--border)] cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>Email Client</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUpiModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[var(--muted)] border border-[var(--border)] cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>UPI QR Modal</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteInvoice(invoice.id || invoice.invoiceNumber)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Invoice</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Export Action Bar & Live Preview Sheet */}
          <div className="lg:col-span-6 lg:sticky lg:top-20 space-y-3">
            {/* Top Export Toolbar */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {downloadingPdf ? (
                    <Clock className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-[var(--primary)]" />
                  )}
                  <span>{downloadingPdf ? 'PDF...' : 'PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={downloadingPng}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {downloadingPng ? (
                    <Clock className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-[var(--primary)]" />
                  )}
                  <span>{downloadingPng ? 'PNG...' : 'PNG'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                  )}
                  <span>{copiedLink ? 'Copied' : 'Share'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenEmail(invoice)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Email invoice to client"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Email</span>
                </button>

                {onPayInvoiceRazorpay && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!planEntitlements.razorpayCheckoutAllowed && onOpenUpgrade) {
                        showToast('Online Razorpay invoice checkout requires the Business plan.');
                        onOpenUpgrade('business');
                        return;
                      }
                      onPayInvoiceRazorpay(invoice);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#111116] hover:bg-[#23232e] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    title={
                      planEntitlements.razorpayCheckoutAllowed
                        ? 'Collect online payment via Razorpay Checkout'
                        : 'Unlock Razorpay invoice checkout on Business plan'
                    }
                  >
                    {!planEntitlements.razorpayCheckoutAllowed ? (
                      <Lock className="w-3 h-3 text-amber-400" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                    )}
                    <span>Pay Online</span>
                  </button>
                )}

                {invoice.bankDetails?.upiId && (
                  <button
                    type="button"
                    onClick={() => setUpiModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    title="Open UPI QR Checkout"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Pay UPI</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Invoice Document Card (Always crisp white paper surface) */}
            <div
              ref={printableCardRef}
              id="invoice-printable-card"
              className="bg-white text-slate-900 border border-slate-200 rounded-xl shadow-lg overflow-hidden print-invoice-modal"
            >
              {/* Colored Banner Header (Modern) or Crisp Header (Classic / Minimal) */}
              {templateStyle === 'Modern' ? (
                <div
                  className="px-6 sm:px-8 py-6 sm:py-7 flex flex-wrap items-start justify-between gap-4"
                  style={{ backgroundColor: themeHex, color: bannerTextColor }}
                >
                  <div className="flex items-start gap-3.5 min-w-0 max-w-md">
                    {invoice.businessLogoUrl ? (
                      <div className="w-12 h-12 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                        <img
                          src={invoice.businessLogoUrl}
                          alt="Business Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-11 h-11 rounded-lg font-extrabold text-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: bannerTextColor,
                          border: '1px solid rgba(255,255,255,0.3)',
                        }}
                      >
                        {invoice.businessLogoLetter || brand.logoLetter || 'I'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h1
                        className="text-lg sm:text-xl font-extrabold leading-tight truncate"
                        style={{ color: bannerTextColor }}
                      >
                        {invoice.businessName || brand.brandName || 'Your Business'}
                      </h1>
                      {senderMetaItems.length > 0 && (
                        <p
                          className="text-[11px] mt-1 leading-relaxed break-words"
                          style={{ color: bannerMutedColor }}
                        >
                          {senderMetaItems.join(' • ')}
                        </p>
                      )}
                      {invoice.gstNumber && (
                        <p
                          className="text-[10.5px] font-mono mt-0.5"
                          style={{ color: bannerMutedColor }}
                        >
                          GST/VAT: {invoice.gstNumber}
                        </p>
                      )}
                      {invoice.businessAddress && (
                        <p
                          className="text-[11px] mt-1 whitespace-pre-line leading-snug"
                          style={{ color: bannerMutedColor }}
                        >
                          {invoice.businessAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: bannerMutedColor }}
                    >
                      INVOICE
                    </div>
                    <div
                      className="font-mono text-base sm:text-lg font-extrabold mt-0.5 tabular-nums"
                      style={{ color: bannerTextColor }}
                    >
                      {invoice.invoiceNumber}
                    </div>
                    <span
                      className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        invoice.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : invoice.status === 'Sent'
                          ? 'bg-blue-50 text-blue-700'
                          : invoice.status === 'Overdue'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-white/90 text-slate-800'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="px-6 sm:px-8 pt-6 pb-5 flex flex-wrap items-start justify-between gap-4"
                  style={{
                    borderBottom:
                      templateStyle === 'Classic'
                        ? `2px solid ${themeHex}`
                        : '1px solid #E2E8F0',
                  }}
                >
                  <div className="flex items-start gap-3.5 min-w-0 max-w-md">
                    {invoice.businessLogoUrl ? (
                      <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={invoice.businessLogoUrl}
                          alt="Business Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg font-extrabold text-base flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: themeHex }}
                      >
                        {invoice.businessLogoLetter || brand.logoLetter || 'I'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
                        {invoice.businessName || brand.brandName || 'Your Business'}
                      </h1>
                      {senderMetaItems.length > 0 && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {senderMetaItems.join(' • ')}
                        </p>
                      )}
                      {invoice.gstNumber && (
                        <p className="text-[10.5px] font-mono text-slate-500 mt-0.5">
                          GST/VAT: {invoice.gstNumber}
                        </p>
                      )}
                      {invoice.businessAddress && (
                        <p className="text-[11px] text-slate-500 mt-0.5 whitespace-pre-line">
                          {invoice.businessAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: themeHex }}
                    >
                      INVOICE
                    </div>
                    <div className="font-mono text-base font-extrabold text-slate-900 mt-0.5 tabular-nums">
                      {invoice.invoiceNumber}
                    </div>
                    <span
                      className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        invoice.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : invoice.status === 'Sent'
                          ? 'bg-blue-50 text-blue-700'
                          : invoice.status === 'Overdue'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Document Body */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Bill To + Dates */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="space-y-0.5 text-xs">
                    <div
                      className="text-[10px] font-extrabold uppercase tracking-[0.08em]"
                      style={{ color: themeHex }}
                    >
                      BILL TO
                    </div>
                    <div className="text-sm font-bold text-slate-900 pt-0.5">
                      {invoice.clientName || 'Customer Name'}
                    </div>
                    {invoice.clientEmail && (
                      <div className="text-slate-600">{invoice.clientEmail}</div>
                    )}
                    {invoice.clientPhone && (
                      <div className="text-slate-500">{invoice.clientPhone}</div>
                    )}
                    {invoice.clientGst && (
                      <div className="text-[11px] font-mono text-slate-500">
                        GST/VAT: {invoice.clientGst}
                      </div>
                    )}
                    {invoice.clientAddress && (
                      <div className="text-slate-500 whitespace-pre-line pt-0.5">
                        {invoice.clientAddress}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-xs sm:text-right shrink-0">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        ISSUE DATE
                      </div>
                      <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                        {invoice.issueDate}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        DUE DATE
                      </div>
                      <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                        {invoice.dueDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items Table (# | DESCRIPTION | QTY | RATE | AMOUNT) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr
                        className="text-[10px] font-extrabold uppercase tracking-wider"
                        style={{
                          color: themeHex,
                          borderBottom: `2px solid ${themeHex}`,
                        }}
                      >
                        <th className="py-2.5 pr-2 w-8">#</th>
                        <th className="py-2.5 px-2">DESCRIPTION</th>
                        <th className="py-2.5 px-2 text-center w-14">QTY</th>
                        <th className="py-2.5 px-2 text-right w-24">RATE</th>
                        <th className="py-2.5 pl-2 text-right w-28">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoice.items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-3 pr-2 font-mono text-[11px] text-slate-400 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-2 font-semibold text-slate-900">
                            {item.description || 'Deliverable'}
                          </td>
                          <td className="py-3 px-2 text-center text-slate-600 tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-700 tabular-nums">
                            {invoice.currency}
                            {item.rate.toLocaleString()}
                          </td>
                          <td className="py-3 pl-2 text-right font-mono font-bold text-slate-900 tabular-nums">
                            {invoice.currency}
                            {(item.quantity * item.rate).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown */}
                <div className="flex justify-end pt-1">
                  <div className="w-full sm:w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {invoice.currency}
                        {subtotal.toLocaleString()}
                      </span>
                    </div>

                    {discountValue > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>
                          Discount {discountType === 'percentage' ? `(-${rawDiscount}%)` : ''}
                        </span>
                        <span className="font-mono font-semibold tabular-nums">
                          -{invoice.currency}
                          {discountValue.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {discountValue > 0 && taxRate > 0 && (
                      <div className="flex justify-between text-[11px] text-slate-500 border-t border-dashed border-slate-200 pt-1">
                        <span>Net Taxable Base</span>
                        <span className="font-mono tabular-nums">
                          {invoice.currency}
                          {taxableAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {taxRate > 0 && (
                      <div
                        className={`flex justify-between ${
                          isTaxDeduct ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        <span>
                          {isTaxDeduct
                            ? `Tax Deduction (TDS -${taxRate}%)`
                            : `Tax (+${taxRate}%)`}
                        </span>
                        <span className="font-mono font-semibold tabular-nums">
                          {isTaxDeduct ? '-' : '+'}
                          {invoice.currency}
                          {taxAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="h-px bg-slate-200 my-1.5" />

                    <div className="flex justify-between items-baseline text-sm font-bold text-slate-900">
                      <span>Total Due</span>
                      <span
                        className="font-mono text-lg font-extrabold tabular-nums"
                        style={{ color: themeHex }}
                      >
                        {invoice.currency}
                        {grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank Wire & Scannable UPI QR Card */}
                {hasBankSection && invoice.bankDetails && (
                  <div className="bg-orange-50/50 border border-orange-200/80 rounded-xl p-4 text-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-orange-500/15 text-orange-600 flex items-center justify-center">
                          <Landmark className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="uppercase text-[10px] tracking-wider text-orange-800 font-extrabold">
                            Payment & Bank Wire Details
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Wire transfer or instant 0% fee UPI scan
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {invoice.bankDetails.upiId && (
                          <button
                            type="button"
                            onClick={() => setUpiModalOpen(true)}
                            className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>Pay via UPI</span>
                          </button>
                        )}
                        {invoice.bankDetails.accountNumber && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                invoice.bankDetails?.accountNumber || ''
                              );
                              showToast('Account number copied!');
                            }}
                            className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg border border-orange-300 text-orange-800 hover:bg-orange-100 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy A/C</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {invoice.bankDetails.bankName && (
                          <div className="bg-white p-2 rounded-lg border border-orange-100">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">
                              Bank Name
                            </span>
                            <span className="font-semibold text-slate-900">
                              {invoice.bankDetails.bankName}
                            </span>
                          </div>
                        )}
                        {invoice.bankDetails.accountName && (
                          <div className="bg-white p-2 rounded-lg border border-orange-100">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">
                              Beneficiary
                            </span>
                            <span className="font-semibold text-slate-900">
                              {invoice.bankDetails.accountName}
                            </span>
                          </div>
                        )}
                        {invoice.bankDetails.accountNumber && (
                          <div className="bg-white p-2 rounded-lg border border-orange-100">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">
                              Account Number
                            </span>
                            <span className="font-mono font-bold text-slate-900 tabular-nums">
                              {invoice.bankDetails.accountNumber}
                            </span>
                          </div>
                        )}
                        {invoice.bankDetails.routingCode && (
                          <div className="bg-white p-2 rounded-lg border border-orange-100">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">
                              IFSC / Routing
                            </span>
                            <span className="font-mono font-semibold text-slate-900">
                              {invoice.bankDetails.routingCode}
                            </span>
                          </div>
                        )}
                        {invoice.bankDetails.iban && (
                          <div className="bg-white p-2 rounded-lg border border-orange-100">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">
                              IBAN
                            </span>
                            <span className="font-mono font-semibold text-slate-900 text-[11px]">
                              {invoice.bankDetails.iban}
                            </span>
                          </div>
                        )}
                        {invoice.bankDetails.upiId && (
                          <div className="bg-white p-2 rounded-lg border border-orange-200">
                            <span className="text-[9px] text-orange-600 uppercase font-bold block">
                              UPI ID (VPA)
                            </span>
                            <span className="font-mono font-bold text-orange-600">
                              {invoice.bankDetails.upiId}
                            </span>
                          </div>
                        )}
                      </div>

                      {upiQrDataUrl && (
                        <button
                          type="button"
                          onClick={() => setUpiModalOpen(true)}
                          className="flex flex-col items-center p-2.5 bg-white border-2 border-orange-200 hover:border-orange-500 rounded-xl shadow-xs cursor-pointer transition-colors shrink-0"
                          title="Click to open interactive UPI payment modal"
                        >
                          <img
                            src={upiQrDataUrl}
                            alt="Scan to pay via UPI"
                            className="w-24 h-24 object-contain rounded"
                          />
                          <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider mt-1.5">
                            SCAN TO PAY
                          </span>
                          <span className="text-[9.5px] font-mono font-bold text-slate-800 mt-0.5 tabular-nums">
                            {invoice.currency}
                            {grandTotal.toLocaleString()}
                          </span>
                        </button>
                      )}
                    </div>

                    {invoice.bankDetails.paymentInstructions && (
                      <div className="text-[10.5px] text-slate-600 pt-1">
                        <strong className="text-orange-700">Note:</strong>{' '}
                        {invoice.bankDetails.paymentInstructions}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes & Terms */}
                {invoice.notes && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Notes & Terms
                    </div>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {invoice.notes}
                    </p>
                  </div>
                )}

                {/* Footer Watermark (Respects White-Label setting on Pro/Business) */}
                {!(invoice.hideWatermark && planEntitlements.removeWatermarkAllowed) && (
                  <div className="text-center pt-3 border-t border-slate-100 text-[10.5px] text-slate-400">
                    Powered by {brand.brandName || 'Invobill'} • Professional Branded Invoicing
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

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
          showToast(`UPI ID updated to ${newUpiId}`);
        }}
        onMarkAsPaid={() => {
          handleStatusChange('Paid');
          showToast('Invoice marked as Paid via UPI!');
        }}
      />
    </div>
  );
};
