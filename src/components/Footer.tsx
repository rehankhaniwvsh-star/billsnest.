import React from 'react';
import { BrandSettings } from '../types';
import { SlidersHorizontal, Sparkles, Lock, Unlock, ExternalLink } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  brand: BrandSettings;
  onOpenCms: () => void;
  onOpenGenerator: () => void;
  onOpenDashboard?: () => void;
  onOpenPlans?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  isAdminAuthenticated?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  brand,
  onOpenCms,
  onOpenGenerator,
  onOpenDashboard,
  onOpenPlans,
  onOpenPrivacy,
  onOpenTerms,
  isAdminAuthenticated = false,
}) => {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)] transition-colors">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <BrandLogo
              brandName={brand.brandName || 'Invobill'}
              tagline={brand.tagline || 'Invoices, paid faster'}
              size="md"
              showTagline={true}
            />
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-sm leading-relaxed">
              {brand.tagline === 'Invoices, paid faster'
                ? 'Branded, trackable invoicing for freelancers, creators, and agencies — built to feel like a real product, not a spreadsheet.'
                : brand.tagline}
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--muted-foreground)]">
              <li>
                <a href="#features" className="hover:text-[var(--foreground)] transition-colors">
                  Features
                </a>
              </li>
              <li>
                {onOpenPlans ? (
                  <button
                    type="button"
                    onClick={onOpenPlans}
                    className="hover:text-[var(--foreground)] transition-colors text-left cursor-pointer"
                  >
                    Plans &amp; Pricing
                  </button>
                ) : (
                  <a href="#pricing" className="hover:text-[var(--foreground)] transition-colors">
                    Plans &amp; Pricing
                  </a>
                )}
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[var(--foreground)] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[var(--foreground)] transition-colors">
                  Invoice Templates
                </a>
              </li>
              <li>
                <a href="#signin" className="hover:text-[var(--foreground)] transition-colors">
                  Sign In
                </a>
              </li>
              <li>
                <div className="flex items-center gap-1.5">
                  <a href="#signup" className="hover:text-[var(--foreground)] transition-colors">
                    Create Account
                  </a>
                  <a
                    href="/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open Sign Up section in another tab"
                    className="text-[var(--muted-foreground)] hover:text-orange-600 transition-colors inline-flex items-center"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
              {onOpenDashboard && (
                <li>
                  <button
                    onClick={onOpenDashboard}
                    className="hover:text-[var(--foreground)] transition-colors text-left cursor-pointer"
                  >
                    Invoices Dashboard
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={onOpenGenerator}
                  className="hover:text-orange-500 font-semibold transition-colors text-left cursor-pointer"
                >
                  Live Generator →
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Company & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] mb-4">
              Company &amp; Legal
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[var(--muted-foreground)]">
              <li>
                <a href="#about" className="hover:text-[var(--foreground)] transition-colors">
                  About Invobill
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[var(--foreground)] transition-colors">
                  FAQ &amp; Support
                </a>
              </li>
              {onOpenPrivacy && (
                <li>
                  <button
                    onClick={onOpenPrivacy}
                    className="hover:text-[var(--foreground)] transition-colors text-left cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
              )}
              {onOpenTerms && (
                <li>
                  <button
                    onClick={onOpenTerms}
                    className="hover:text-[var(--foreground)] transition-colors text-left cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
              )}
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-orange-500 transition-colors inline-flex items-center gap-1 font-mono text-[11px]"
                >
                  XML Sitemap
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${brand.contactEmail || 'hello@invobill.app'}`}
                  className="hover:text-[var(--foreground)] transition-colors"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Admin & CMS */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] mb-4">
              Owner Access
            </h4>
            <button
              onClick={onOpenCms}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 bg-[var(--background)] border border-[var(--border)] rounded-full text-[var(--foreground)] hover:bg-[var(--muted)] transition-all cursor-pointer shadow-xs"
              title="Site Owner Admin Panel (PIN Protected)"
            >
              {isAdminAuthenticated ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Admin CMS (Unlocked)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-orange-500" />
                  <span>Admin Portal</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
              Protected by master PIN
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted-foreground)]">
          <p>© {new Date().getFullYear()} {brand.brandName || 'Invobill'}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
