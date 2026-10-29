import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { buildUpiUri, generateUpiQrDataUrl, isValidUpiId } from '../utils/upi';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  upiId: string;
  payeeName: string;
  amount: number;
  currency?: string;
  invoiceNumber: string;
  onUpdateUpiId?: (newUpiId: string) => void;
  onMarkAsPaid?: () => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  upiId,
  payeeName,
  amount,
  currency = '₹',
  invoiceNumber,
  onUpdateUpiId,
  onMarkAsPaid,
}) => {
  const [currentUpiId, setCurrentUpiId] = useState(upiId || '');
  const [editingUpiId, setEditingUpiId] = useState(!upiId);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [paidCelebration, setPaidCelebration] = useState(false);

  // Synchronize incoming upiId prop
  useEffect(() => {
    if (upiId) {
      setCurrentUpiId(upiId);
      setEditingUpiId(false);
    } else {
      setEditingUpiId(true);
    }
  }, [upiId]);

  const activeUpiId = currentUpiId.trim();

  const upiUri = buildUpiUri({
    upiId: activeUpiId || 'merchant@upi',
    payeeName: payeeName || 'Invobill Merchant',
    amount,
    currency,
    invoiceNumber,
  });

  // Generate QR code whenever upiUri changes
  useEffect(() => {
    let isMounted = true;
    if (activeUpiId) {
      generateUpiQrDataUrl(upiUri, 320).then((url) => {
        if (isMounted) setQrDataUrl(url);
      });
    } else {
      setQrDataUrl('');
    }
    return () => {
      isMounted = false;
    };
  }, [upiUri, activeUpiId]);

  if (!isOpen) return null;

  const handleCopyUpiId = () => {
    if (!activeUpiId) return;
    navigator.clipboard.writeText(activeUpiId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyPaymentLink = () => {
    navigator.clipboard.writeText(upiUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveUpiId = () => {
    if (onUpdateUpiId && activeUpiId) {
      onUpdateUpiId(activeUpiId);
      setEditingUpiId(false);
    }
  };

  const handleMarkPaid = () => {
    setPaidCelebration(true);
    setTimeout(() => {
      if (onMarkAsPaid) onMarkAsPaid();
      setPaidCelebration(false);
      onClose();
    }, 1200);
  };

  const upiApps = [
    { name: 'Google Pay', color: 'text-blue-500' },
    { name: 'PhonePe', color: 'text-purple-500' },
    { name: 'Paytm', color: 'text-sky-500' },
    { name: 'BHIM', color: 'text-emerald-500' },
    { name: 'CRED', color: 'text-amber-500' },
    { name: 'Any Bank App', color: 'text-orange-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  UPI Instant Payment
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  0% Fee • Instant
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                For Invoice <span className="font-mono font-bold text-[var(--foreground)]">{invoiceNumber}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Amount Highlight Card */}
          <div className="p-4 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[var(--muted-foreground)] block uppercase tracking-wider">
                Total Amount Due
              </span>
              <div className="text-2xl font-extrabold text-[var(--foreground)] font-mono flex items-center gap-1">
                <span>{currency}</span>
                <span>{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-[var(--muted-foreground)] block uppercase tracking-wider">
                Payee
              </span>
              <span className="text-xs font-bold text-[var(--foreground)] truncate max-w-[160px] block">
                {payeeName || 'Invobill Studio'}
              </span>
            </div>
          </div>

          {/* UPI ID Configuration / Display */}
          {editingUpiId ? (
            <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-700 dark:text-orange-300">
                <Info className="w-4 h-4 shrink-0" />
                <span>Enter Your UPI ID (VPA) to Generate QR</span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Enter your Google Pay, PhonePe, Paytm, or bank UPI ID where you want to receive payments (e.g., <code className="bg-[var(--card)] px-1 rounded font-mono">yourshop@okhdfcbank</code> or <code className="bg-[var(--card)] px-1 rounded font-mono">mobile@ybl</code>).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. uzafa.shop@okhdfcbank"
                  value={currentUpiId}
                  onChange={(e) => setCurrentUpiId(e.target.value)}
                  className="flex-1 p-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)] focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleSaveUpiId}
                  disabled={!currentUpiId.trim()}
                  className="px-3 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Save & Generate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--muted-foreground)] font-medium">
                  UPI ID:
                </span>
                <span className="font-mono font-bold text-xs text-[var(--foreground)] select-all">
                  {activeUpiId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy UPI ID</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUpiId(true)}
                  className="text-[11px] text-orange-600 hover:underline font-semibold cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Dynamic QR Code Box */}
          {activeUpiId && (
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white text-zinc-900 border border-zinc-200 shadow-inner">
              <div className="relative p-2 bg-white rounded-xl border border-zinc-200 shadow-xs">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`UPI Payment QR Code for ${activeUpiId}`}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-zinc-100 rounded-lg text-zinc-400">
                    <QrCode className="w-12 h-12 animate-pulse" />
                  </div>
                )}
                {/* Center UPI logo badge overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-orange-500 shadow-md flex items-center justify-center text-[10px] font-black text-orange-600 tracking-tighter">
                    UPI
                  </div>
                </div>
              </div>

              <span className="mt-3 text-xs font-bold text-zinc-800 tracking-wide flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                <span>Scan with any UPI application</span>
              </span>

              {/* Supported Apps Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                {upiApps.map((app) => (
                  <span
                    key={app.name}
                    className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200"
                  >
                    {app.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mobile One-Click Pay Button */}
          {activeUpiId && (
            <div className="space-y-2">
              <a
                href={upiUri}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay via UPI (Mobile Tap)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] px-1">
                <span>Directly launches Google Pay, PhonePe, or Paytm</span>
                <button
                  type="button"
                  onClick={handleCopyPaymentLink}
                  className="hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Deep Link Copied' : 'Copy URI Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* How to pay steps */}
          <div className="p-3.5 bg-[var(--muted)]/30 rounded-xl border border-[var(--border)] text-xs space-y-2 text-[var(--foreground)]">
            <span className="font-bold text-[11px] text-[var(--muted-foreground)] uppercase tracking-wider block">
              How payment works
            </span>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-[var(--muted-foreground)] leading-relaxed">
              <li>Open <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, or <strong>BHIM</strong>.</li>
              <li>Scan the QR code above (or click "Pay via UPI" if on a mobile phone).</li>
              <li>Verify the amount (<strong className="text-[var(--foreground)]">{currency}{amount.toLocaleString()}</strong>) and enter your UPI PIN.</li>
              <li>Funds transfer directly into the merchant's bank account with zero fees.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Protected by UPI 2.0 Encryption</span>
          </div>

          <div className="flex items-center gap-2">
            {onMarkAsPaid && (
              <button
                type="button"
                onClick={handleMarkPaid}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {paidCelebration ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" />
                    <span>Marked as Paid!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm / Mark Paid</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
