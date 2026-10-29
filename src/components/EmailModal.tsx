import React, { useState } from 'react';
import { InvoiceData, BrandSettings } from '../types';
import { X, Mail, Send, Check, Copy, AlertCircle } from 'lucide-react';
import { EmailInvoiceSchema, validateStrict, ValidationErrorDetail } from '../schemas/strictSchemas';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
  brand: BrandSettings;
  onSendSuccess: (invoiceId: string) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  brand,
  onSendSuccess,
}) => {
  const [recipient, setRecipient] = useState(invoice?.clientEmail || '');
  const [subject, setSubject] = useState(
    `Invoice ${invoice?.invoiceNumber || ''} from ${brand.brandName || 'Invobill'}`
  );
  const [message, setMessage] = useState(
    `Hi ${invoice?.clientName || 'there'},\n\nPlease find attached your invoice ${
      invoice?.invoiceNumber
    } for ${invoice?.currency}${invoice?.items
      .reduce((a, b) => a + b.quantity * b.rate, 0)
      .toLocaleString()}.\n\nDue Date: ${invoice?.dueDate}\n\nYou can view and pay your invoice online at:\n${
      window.location.origin
    }/#invoice-${invoice?.invoiceNumber}\n\nThank you for your business!\nBest regards,\n${
      brand.brandName || 'Invobill'
    }`
  );

  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDetail[]>([]);
  const [generalError, setGeneralError] = useState<string>('');

  // Sync state when invoice changes
  React.useEffect(() => {
    if (invoice) {
      setRecipient(invoice.clientEmail);
      setSubject(`Invoice ${invoice.invoiceNumber} from ${brand.brandName}`);
      const total = invoice.items.reduce((a, b) => a + b.quantity * b.rate, 0);
      setMessage(
        `Hi ${invoice.clientName},\n\nPlease find attached your invoice ${
          invoice.invoiceNumber
        } for ${invoice.currency}${total.toLocaleString()}.\n\nDue Date: ${
          invoice.dueDate
        }\n\nYou can review your invoice online at:\n${
          window.location.origin
        }/#invoice-${invoice.invoiceNumber}\n\nThank you for your business!\nBest regards,\n${
          brand.brandName
        }`
      );
      setValidationErrors([]);
      setGeneralError('');
    }
  }, [invoice, brand]);

  if (!isOpen || !invoice) return null;

  const handleSend = async () => {
    setValidationErrors([]);
    setGeneralError('');

    const payload = {
      recipient: recipient.trim(),
      subject: subject.trim(),
      message: message.trim(),
      invoiceNumber: invoice.invoiceNumber.trim(),
      invoiceId: invoice.id || invoice.invoiceNumber,
    };

    // Strict schema check on client
    const validation = validateStrict(EmailInvoiceSchema, payload);
    if (!validation.success) {
      setValidationErrors(validation.details);
      setGeneralError(validation.error);
      return;
    }

    setSending(true);

    try {
      const res = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : {};

      if (!res.ok || !data.success) {
        if (data.details && Array.isArray(data.details)) {
          setValidationErrors(data.details);
        }
        setGeneralError(data.error || 'Failed to dispatch email. Request rejected by server schema.');
        setSending(false);
        return;
      }

      setSending(false);
      setSentSuccess(true);
      onSendSuccess(invoice.id || invoice.invoiceNumber);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1500);
    } catch {
      setSending(false);
      setGeneralError('Network error while dispatching invoice email. Please check your connection and try again.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/#invoice-${invoice.invoiceNumber}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getFieldError = (field: string) => {
    return validationErrors.find((e) => e.field === field)?.message;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] max-w-lg w-full shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="font-bold text-sm text-[var(--foreground)]">
              Email Invoice {invoice.invoiceNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded hover:bg-[var(--muted)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {sentSuccess ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[var(--foreground)]">
                Invoice Email Sent Successfully!
              </h4>
              <p className="text-[var(--muted-foreground)]">
                Marked invoice status as <strong>Sent</strong>.
              </p>
            </div>
          ) : (
            <>
              {generalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-semibold block">Schema Validation Rejected:</span>
                    {generalError}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[var(--muted-foreground)]">
                    Recipient Email <span className="text-red-500">*</span>
                  </label>
                  {getFieldError('recipient') && (
                    <span className="text-[11px] text-red-500 font-medium">
                      {getFieldError('recipient')}
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    if (validationErrors.length > 0) setValidationErrors([]);
                  }}
                  className={`w-full p-2.5 bg-[var(--background)] border rounded text-xs text-[var(--foreground)] ${
                    getFieldError('recipient')
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-[var(--border)] focus:border-[var(--primary)]'
                  }`}
                  placeholder="client@company.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[var(--muted-foreground)]">
                    Subject Line <span className="text-red-500">*</span>
                  </label>
                  {getFieldError('subject') && (
                    <span className="text-[11px] text-red-500 font-medium">
                      {getFieldError('subject')}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={subject}
                  maxLength={200}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (validationErrors.length > 0) setValidationErrors([]);
                  }}
                  className={`w-full p-2.5 bg-[var(--background)] border rounded text-xs text-[var(--foreground)] ${
                    getFieldError('subject')
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-[var(--border)] focus:border-[var(--primary)]'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[var(--muted-foreground)]">
                    Email Message Body <span className="text-red-500">*</span>
                  </label>
                  {getFieldError('message') && (
                    <span className="text-[11px] text-red-500 font-medium">
                      {getFieldError('message')}
                    </span>
                  )}
                </div>
                <textarea
                  rows={7}
                  maxLength={5000}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (validationErrors.length > 0) setValidationErrors([]);
                  }}
                  className={`w-full p-2.5 bg-[var(--background)] border rounded text-xs text-[var(--foreground)] font-sans ${
                    getFieldError('message')
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-[var(--border)] focus:border-[var(--primary)]'
                  }`}
                ></textarea>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn-shader-secondary inline-flex items-center gap-1.5 px-3.5 py-2 rounded font-semibold cursor-pointer"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 btn-icon-hover-bounce" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 btn-icon-hover-bounce" />
                  )}
                  <span>{copiedLink ? 'Link Copied' : 'Copy Direct Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !recipient.trim()}
                  className="btn-shader-primary inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded shadow disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 btn-icon-hover-bounce" />
                  <span>{sending ? 'Validating & Sending...' : 'Send Invoice Now'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
