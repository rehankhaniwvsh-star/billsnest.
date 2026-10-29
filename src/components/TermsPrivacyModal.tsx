import React from 'react';
import { X, Shield, FileText, CheckCircle2, Lock } from 'lucide-react';
import { ReceiptLogoIcon } from './BrandLogo';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
  brandName?: string;
  contactEmail?: string;
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  brandName = 'Invobill',
  contactEmail = 'hello@invobill.app',
}) => {
  const [activeTab, setActiveTab] = React.useState<'privacy' | 'terms'>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <ReceiptLogoIcon sizeClass="w-8 h-8 rounded-lg" />
            <div>
              <h2 className="font-bold text-base text-[var(--foreground)]">
                {brandName} Legal & Policies
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Transparent terms of use and data privacy guarantees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 py-3 border-b border-[var(--border)] flex gap-2 bg-[var(--card)] shrink-0">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[var(--foreground)] leading-relaxed">
          {activeTab === 'privacy' ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Client-Side Privacy Guarantee: Your invoice data is your private property.</span>
              </div>

              <div>
                <h3 className="font-extrabold text-base mb-2">1. Information Collection & Storage</h3>
                <p className="text-[var(--muted-foreground)]">
                  {brandName} is architected to operate with minimal data collection. All invoice creation, calculations, client information, and banking configurations are generated and stored primarily inside your browser local storage. We do not sell, rent, or trade your financial or customer records with third-party advertisers.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base mb-2">2. PDF & Document Generation</h3>
                <p className="text-[var(--muted-foreground)]">
                  PDF exports and document previews are compiled directly within your device environment using vector styling and standard document printers. No third-party scrapers or external document aggregators process your generated bills.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base mb-2">3. Cookies & Local Storage</h3>
                <p className="text-[var(--muted-foreground)]">
                  We use standard local storage keys to preserve your branding preferences, invoice drafts, and administrative credentials. You may clear your browser cache at any time to purge all stored records locally.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base mb-2">4. Contacting Us</h3>
                <p className="text-[var(--muted-foreground)]">
                  If you have questions about privacy or data retention, please reach out to our privacy officer at{' '}
                  <a href={`mailto:${contactEmail}`} className="text-orange-600 font-semibold underline">
                    {contactEmail}
                  </a>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-xs font-bold bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>100% Free Forever: No hidden subscriptions, no watermarks, no limits.</span>
              </div>

              <div>
                <h3 className="font-extrabold text-base mb-2">1. Acceptance of Terms</h3>
                <p className="text-[var(--muted-foreground)]">
                  By accessing or using {brandName}, you agree to comply with and be bound by these Terms of Service. If you disagree with any part of these terms, you may cease using the platform at any time.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base mb-2">2. Permitted Commercial Use</h3>
                <p className="text-[var(--muted-foreground)]">
                  You are granted a worldwide, royalty-free license to generate, export, brand, and distribute commercial invoices, receipts, and quotations to your clients. All output files are 100% owned by you and your business.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base mb-2">3. Accuracy of Invoicing & Tax Calculations</h3>
                <p className="text-[var(--muted-foreground)]">
                  {brandName} provides customizable mathematical tools for calculating subtotals, GST/VAT tax rates, and currency symbols. Users are solely responsible for ensuring that final invoices comply with their local municipal, regional, and national tax regulations.
                </p>
              </div>

              <div>
                <h3 className="font-extrabold text-base mb-2">4. Warranties & Disclaimers</h3>
                <p className="text-[var(--muted-foreground)]">
                  The service is provided on an "as-is" and "as-available" basis without warranties of any kind. We strive for 99.9% availability and continuous data integrity.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--muted)]/40 flex items-center justify-between shrink-0">
          <span className="text-xs text-[var(--muted-foreground)]">
            Last Updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <button
            onClick={onClose}
            className="btn-shader-primary px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
