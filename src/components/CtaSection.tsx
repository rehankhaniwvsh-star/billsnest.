import React from 'react';
import { CmsContent, BrandSettings } from '../types';
import { ArrowRight, Sparkles, Instagram, ExternalLink } from 'lucide-react';

interface CtaSectionProps {
  cta: CmsContent['cta'];
  brand: BrandSettings;
  onOpenGenerator: () => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({
  cta,
  brand,
  onOpenGenerator,
}) => {
  const instaHandle = (brand.instagramHandle || 'invobill.official').replace(/^@/, '');
  const instaUrl = `https://www.instagram.com/${instaHandle}/`;

  return (
    <section className="px-6 py-16 relative">
      <div className="max-w-6xl mx-auto rounded-3xl p-10 sm:p-16 md:p-20 text-center bg-[#0f0f14] border border-[#23232f] text-white shadow-2xl relative overflow-hidden">
        {/* Background mesh grid and warm radial glow */}
        <div className="absolute inset-0 bg-grid-mesh opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] ambient-glow-warm pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready in 60 Seconds</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight text-balance">
            {cta.headline || 'Send your first invoice in two minutes.'}
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Join thousands of modern creators, freelancers, and businesses who send invoices with confidence and zero fuss.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={onOpenGenerator}
              className="btn-pill-primary inline-flex items-center gap-3 pl-7 pr-4 py-4 text-sm font-black uppercase tracking-wider cursor-pointer group shadow-xl whitespace-nowrap shrink-0"
            >
              <span>{cta.buttonText || 'Create Invoice Free'}</span>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-orange-600 transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <a
              href={instaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Instagram className="w-4 h-4 text-orange-400" />
              <span>@{instaHandle}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
