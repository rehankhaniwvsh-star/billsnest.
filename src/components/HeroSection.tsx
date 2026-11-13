import React, { useState } from 'react';
import { HeroData, BrandSettings } from '../types';
import { ArrowRight, Check, Star, Sparkles, Zap, Shield, Search, Sliders, QrCode } from 'lucide-react';
import BookmarkIcon from './icons/BookmarkIcon';
import MagnifierIcon from './icons/MagnifierIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import { MorphingMascot, MascotMode } from './MorphingMascot';

interface HeroSectionProps {
  hero: HeroData;
  brand: BrandSettings;
  onOpenGenerator: () => void;
  onOpenDashboard: () => void;
  onOpenCms: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  hero,
  brand,
  onOpenGenerator,
  onOpenDashboard,
  onOpenCms,
}) => {
  const [invoiceStatus, setInvoiceStatus] = useState<'Paid' | 'Sent' | 'Draft'>(
    (hero.previewInvoice.status as any) || 'Paid'
  );
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAudited, setAiAudited] = useState(false);
  const [mascotMode, setMascotMode] = useState<MascotMode>('blob');

  const toggleStatus = () => {
    if (invoiceStatus === 'Paid') {
      setInvoiceStatus('Sent');
      setMascotMode('dots');
    } else if (invoiceStatus === 'Sent') {
      setInvoiceStatus('Draft');
      setMascotMode('exclamation');
    } else {
      setInvoiceStatus('Paid');
      setMascotMode('atom');
    }
  };

  return (
    <section className="relative px-6 pt-10 pb-16 md:pb-24 overflow-hidden bg-grid-mesh">
      {/* Background radial glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[450px] ambient-glow-warm pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          {/* Left Hero Copy */}
          <div className="space-y-6">
            {/* Review pill banner & Animated Micro Mascot */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-3 bg-[var(--card)] border border-[var(--border)] rounded-full px-3.5 py-1.5 shadow-xs">
                <div className="flex -space-x-1.5">
                  <img
                    className="w-5 h-5 rounded-full ring-2 ring-[var(--card)] object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces"
                    alt="User"
                  />
                  <img
                    className="w-5 h-5 rounded-full ring-2 ring-[var(--card)] object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces"
                    alt="User"
                  />
                  <img
                    className="w-5 h-5 rounded-full ring-2 ring-[var(--card)] object-cover"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces"
                    alt="User"
                  />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--foreground)]">
                  <div className="flex text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                  </div>
                  <span>3,600+ 5-Star Reviews</span>
                </div>
              </div>

              {/* Animated Companion Chip */}
              <div
                onClick={() => setMascotMode((prev) => prev === 'blob' ? 'atom' : prev === 'atom' ? 'dots' : prev === 'dots' ? 'rainbow' : 'blob')}
                className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/25 rounded-full text-[11px] font-bold text-orange-600 dark:text-orange-400 cursor-pointer hover:scale-105 transition-transform"
                title="Click mascot to morph!"
              >
                <MorphingMascot mode={mascotMode} size="custom" customSizeClass="w-5 h-5" interactive={false} />
                <span>Animated Copilot Live</span>
              </div>
            </div>

            {/* Headline with vibrant gradient punch */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-[var(--foreground)] leading-[1.12] tracking-tight">
              {hero.headlineMain}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3366] via-[#FF5722] to-[#FFA000]">
                {hero.headlineAccent}
              </span>
            </h1>

            <p className="text-[var(--muted-foreground)] text-base sm:text-lg leading-relaxed max-w-xl">
              {hero.subheadline}
            </p>

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenGenerator}
                className="btn-pill-dark inline-flex items-center gap-3 pl-6 pr-3 py-3.5 text-sm font-bold cursor-pointer group"
              >
                <span>{hero.primaryCtaText || 'Get Started Free'}</span>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <button
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>{hero.secondaryCtaText || 'See Dashboard'}</span>
              </button>
            </div>

            {/* Feature tick markers */}
            <div className="pt-4 border-t border-[var(--border)]/70 flex flex-wrap items-center gap-5 text-xs text-[var(--muted-foreground)] font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>Free · No credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <Zap className="w-2.5 h-2.5" />
                </span>
                <span>Instant PDF & Share Links</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Shield className="w-2.5 h-2.5" />
                </span>
                <span>100% Data Privacy</span>
              </div>
            </div>
          </div>

          {/* Right Live Invoice Preview Card with Glowing Framer Frame */}
          <div className="relative group">
            {/* Ambient Coral Glow Aura */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-orange-500/20 via-pink-500/15 to-amber-500/20 blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />

            <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 sm:p-7 shadow-xl">
              {/* Quick Search & AI Audit Header with Morphing Mascot */}
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--border)]">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    placeholder="Search invoice items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Interactive Mascot Reacting to Audit */}
                <div className="flex items-center gap-1.5">
                  <MorphingMascot
                    mode={mascotMode}
                    size="custom"
                    customSizeClass="w-8 h-8"
                    interactive={true}
                    onModeChange={(m) => setMascotMode(m)}
                  />

                  <button
                    onClick={() => {
                      setAiAudited(!aiAudited);
                      setMascotMode(aiAudited ? 'blob' : 'atom');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      aiAudited
                        ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                        : 'bg-[var(--card)] text-orange-600 border-[var(--border)] hover:bg-orange-50 dark:hover:bg-neutral-800'
                    }`}
                    title="Toggle AI Audit Check"
                  >
                    <BrainCircuitIcon size={14} color={aiAudited ? '#ffffff' : '#FF5722'} strokeWidth={2} />
                    <span>{aiAudited ? 'AI Verified' : 'AI Audit'}</span>
                  </button>
                </div>
              </div>

              {/* Card Client Details */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF3366] to-[#FFA000] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {hero.previewInvoice.clientName?.charAt(0) || 'N'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--foreground)]">
                      {hero.previewInvoice.clientName || 'Nova Studio'}
                    </p>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {hero.previewInvoice.clientEmail || 'hello@novastudio.com'}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-md">
                  {hero.previewInvoice.invoiceNumber || 'INV-0042'}
                </span>
              </div>

              {/* Line Items */}
              <div className="py-4 space-y-2.5">
                {(hero.previewInvoice.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-[var(--muted)]/50 transition-colors"
                  >
                    <span className="font-medium text-[var(--foreground)] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      {item.description}
                    </span>
                    <span className="font-mono font-semibold text-[var(--foreground)]">
                      {hero.previewInvoice.currencySymbol}
                      {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-[var(--border)] my-1"></div>

              {/* Total Row */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Amount Due
                </span>
                <span className="text-2xl font-black font-mono text-[var(--foreground)] tracking-tight">
                  {hero.previewInvoice.currencySymbol}
                  {(hero.previewInvoice.total || 57820).toLocaleString()}
                </span>
              </div>

              {/* Instant UPI QR Badge */}
              <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400 text-[11px]">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Instant UPI QR Enabled</span>
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                  GPay • PhonePe • BHIM
                </span>
              </div>

              {/* Status Switcher Badge */}
              <div className="mt-4 flex items-center justify-between bg-[var(--muted)] border border-[var(--border)] rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--muted-foreground)]">Status:</span>
                  <button
                    onClick={toggleStatus}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                      invoiceStatus === 'Paid'
                        ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                        : invoiceStatus === 'Sent'
                        ? 'bg-orange-500/15 text-orange-700 border border-orange-500/30'
                        : 'bg-zinc-500/15 text-zinc-700 border border-zinc-500/30'
                    }`}
                    title="Click to toggle status demo"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        invoiceStatus === 'Paid'
                          ? 'bg-emerald-500 animate-pulse'
                          : invoiceStatus === 'Sent'
                          ? 'bg-orange-500'
                          : 'bg-zinc-500'
                      }`}
                    ></span>
                    <span>{invoiceStatus}</span>
                  </button>
                </div>

                <button
                  onClick={onOpenGenerator}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
                >
                  <span>Customize</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Core Capabilities & Trust Highlights Strip */}
        <div className="mt-16 pt-10 border-t border-[var(--border)]/70">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-left transition-all duration-300 hover:border-orange-500/40 hover:-translate-y-0.5 group">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[var(--foreground)] mb-0.5">0.4s Instant PDF</h4>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">
                Pixel-perfect vector rendering ready for print or email.
              </p>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-left transition-all duration-300 hover:border-orange-500/40 hover:-translate-y-0.5 group">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[var(--foreground)] mb-0.5">100% Client-Side</h4>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">
                Your client data and numbers stay private on your browser.
              </p>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-left transition-all duration-300 hover:border-orange-500/40 hover:-translate-y-0.5 group">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[var(--foreground)] mb-0.5">Zero Watermarks</h4>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">
                Purely your brand colors, your typography, your identity.
              </p>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-left transition-all duration-300 hover:border-orange-500/40 hover:-translate-y-0.5 group">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <BrainCircuitIcon size={18} color="#FF5722" strokeWidth={2} />
              </div>
              <h4 className="text-xs font-bold text-[var(--foreground)] mb-0.5">AI Smart Copilot</h4>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">
                Auto-generate item descriptions and invoice scopes instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
