import React from 'react';
import { CmsContent } from '../types';
import { Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react';

interface AboutSectionProps {
  about: CmsContent['about'];
  brandName?: string;
  primaryColor?: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  about,
  brandName = 'Invobill',
}) => {
  // Sanitize any legacy names from previous localStorage states
  const sanitizeText = (text?: string) => {
    if (!text) return '';
    return text
      .replace(/Invoiceify/g, brandName)
      .replace(/invoiceify/g, brandName.toLowerCase())
      .replace(/Ledgerly/g, brandName)
      .replace(/ledgerly/g, brandName.toLowerCase())
      .replace(/Billnest/g, brandName)
      .replace(/billnest/g, brandName.toLowerCase())
      .replace(/Billsnest/g, brandName)
      .replace(/billsnest/g, brandName.toLowerCase());
  };

  const eyebrowText = about.eyebrow
    ? sanitizeText(about.eyebrow)
    : `About ${brandName}`;
  const paragraph1Text = sanitizeText(
    about.paragraph1 ||
      `${brandName} was created with a clear mission: provide creators, freelancers, and growing agencies with high-end, bespoke invoice generation that is 100% royalty-free and unrestricted.`
  );
  const paragraph2Text = sanitizeText(
    about.paragraph2 ||
      `Every invoice is generated client-side with zero watermarks, zero hidden fees, and zero locked features. You retain full ownership of your data, documents, and client records.`
  );

  return (
    <section id="about" className="py-24 border-t border-[var(--border)] bg-[var(--card)] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          {/* Narrative Column */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{eyebrowText}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] tracking-tight leading-tight">
              {about.title || 'Built for people who invoice on their own.'}
            </h2>

            <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
              {paragraph1Text}
            </p>

            <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
              {paragraph2Text}
            </p>

            {/* Non-copyright / Royalty-Free Promise Banner */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3" />
                </span>
                <span>100% Non-Copyright & Royalty-Free</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/15 text-orange-600 flex items-center justify-center">
                  <HeartHandshake className="w-3 h-3" />
                </span>
                <span>Unrestricted Commercial Use</span>
              </div>
            </div>
          </div>

          {/* Stats Grid Box */}
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 grid grid-cols-2 gap-4 sm:gap-6 shadow-sm">
            {(about.stats || []).map((stat) => (
              <div
                key={stat.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-md hover:border-orange-500/30"
              >
                <div className="text-3xl sm:text-4xl font-black mb-1.5 font-mono text-transparent bg-clip-text bg-gradient-to-tr from-[#FF3366] via-[#FF5722] to-[#FFA000]">
                  {stat.number}
                </div>
                <div className="text-xs text-[var(--muted-foreground)] font-bold uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

