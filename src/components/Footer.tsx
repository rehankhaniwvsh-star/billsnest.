import React, { useState, useEffect, useMemo } from 'react';
import { BrandSettings, FooterRatingEntry } from '../types';
import {
  Lock,
  Unlock,
  ExternalLink,
  Star,
  Send,
  Instagram,
  Check,
  Copy,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../context/AuthContext';

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

const LOCAL_RATINGS_KEY = 'invobill_footer_ratings_v1';

const RATING_LABELS: Record<number, string> = {
  1: 'Needs work',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

function mergeRatings(
  serverRatings: FooterRatingEntry[],
  localRatings: FooterRatingEntry[]
): FooterRatingEntry[] {
  const seen = new Map<string, FooterRatingEntry>();
  [...serverRatings, ...localRatings].forEach((item) => {
    if (!item || !item.id || !item.message) return;
    if (!seen.has(item.id)) {
      seen.set(item.id, item);
    }
  });
  return Array.from(seen.values())
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 50);
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
  const { currentUser } = useAuth();

  const instaHandle = (brand.instagramHandle || 'invobill.official').replace(/^@/, '');
  const instaUrl = `https://www.instagram.com/${instaHandle}/`;

  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [authorName, setAuthorName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [copiedInsta, setCopiedInsta] = useState<boolean>(false);

  const [ratings, setRatings] = useState<FooterRatingEntry[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_RATINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    if (currentUser?.name && !authorName) {
      setAuthorName(currentUser.name);
    }
  }, [currentUser?.name]);

  useEffect(() => {
    let active = true;
    fetch('/api/ratings', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.success || !Array.isArray(data.ratings)) return;
        setRatings((prev) => {
          const merged = mergeRatings(data.ratings, prev);
          try {
            localStorage.setItem(LOCAL_RATINGS_KEY, JSON.stringify(merged));
          } catch {
            // ignore storage errors
          }
          return merged;
        });
      })
      .catch(() => {
        // Keep localStorage ratings seamlessly when offline
      });
    return () => {
      active = false;
    };
  }, []);

  const averageRating = useMemo(() => {
    if (ratings.length === 0) return null;
    const sum = ratings.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
    return (sum / ratings.length).toFixed(1);
  }, [ratings]);

  const activeStarValue = hoveredRating || selectedRating;

  const handleCopyInstagram = () => {
    try {
      navigator.clipboard.writeText(`@${instaHandle}`);
      setCopiedInsta(true);
      setTimeout(() => setCopiedInsta(false), 2000);
    } catch {
      // ignore clipboard denial
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const trimmedMessage = message.trim();
    const trimmedName = (authorName || currentUser?.name || '').trim() || 'Invobill User';

    if (selectedRating < 1 || selectedRating > 5) {
      setSubmitError('Please select a star rating from 1 to 5.');
      return;
    }

    if (trimmedMessage.length < 2) {
      setSubmitError('Please write a short message before sending.');
      return;
    }

    if (trimmedMessage.length > 400) {
      setSubmitError('Message must be 400 characters or fewer.');
      return;
    }

    setIsSubmitting(true);

    let savedEntry: FooterRatingEntry = {
      id: `rat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      rating: selectedRating,
      message: trimmedMessage,
      authorName: trimmedName,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          message: trimmedMessage,
          authorName: trimmedName,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : null;

      if (res.ok && data?.success && data.entry) {
        savedEntry = data.entry;
      } else if (res.status === 400 && data?.error) {
        setSubmitError(data.error);
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Offline / static host fallback persists cleanly in localStorage
    }

    setRatings((prev) => {
      const updated = mergeRatings([savedEntry], prev);
      try {
        localStorage.setItem(LOCAL_RATINGS_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });

    setMessage('');
    setSubmitSuccess('Thanks for rating Invobill! Your review has been shared.');
    setIsSubmitting(false);
  };

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)] transition-colors">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Top Interactive Band: Rating & Message Bar + Official Instagram Page Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 pb-14 mb-14 border-b border-[var(--border)] items-stretch">
          {/* Left: Interactive Rating Section with Message Bar */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 sm:p-7 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-[var(--foreground)]">
                    Rate your experience
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
                    Pick a rating and leave a quick message to help us improve {brand.brandName || 'Invobill'}.
                  </p>
                </div>

                {averageRating ? (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] font-mono tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-[var(--foreground)]">{averageRating}/5</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {ratings.length} {ratings.length === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Be the first to rate
                  </span>
                )}
              </div>

              {/* Interactive 5-Star Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className="inline-flex items-center gap-1"
                  role="radiogroup"
                  aria-label="Rate Invobill from 1 to 5 stars"
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= activeStarValue;
                    return (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={selectedRating === star}
                        aria-label={`${star} out of 5 stars — ${RATING_LABELS[star]}`}
                        onMouseEnter={() => setHoveredRating(star)}
                        onClick={() => {
                          setSelectedRating(star);
                          setSubmitError(null);
                        }}
                        className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition-transform duration-150 hover:scale-105 cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors duration-150 ${
                            filled
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-[var(--muted-foreground)]/40'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <span className="text-xs font-semibold text-[var(--foreground)] tabular-nums">
                  {activeStarValue}/5 · {RATING_LABELS[activeStarValue]}
                </span>
              </div>

              {/* Message Bar Form */}
              <form onSubmit={handleSubmitRating} className="space-y-2.5" noValidate>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your name (optional)"
                    maxLength={80}
                    aria-label="Your name"
                    className="sm:w-40 shrink-0 px-3.5 py-2.5 text-xs sm:text-sm bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors"
                  />

                  <div className="flex-1 flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1.5 pl-3.5 focus-within:ring-2 focus-within:ring-[var(--primary)]/25 focus-within:border-[var(--primary)] transition-colors">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (submitError) setSubmitError(null);
                        if (submitSuccess) setSubmitSuccess(null);
                      }}
                      placeholder="Write a message, suggestion, or quick review..."
                      maxLength={400}
                      aria-label="Feedback message"
                      className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/70 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{isSubmitting ? 'Sending' : 'Send'}</span>
                    </button>
                  </div>
                </div>

                {submitError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{submitError}</span>
                  </p>
                )}

                {submitSuccess && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{submitSuccess}</span>
                  </p>
                )}
              </form>
            </div>

            {/* Latest Submitted Reviews Strip */}
            {ratings.length > 0 && (
              <div className="pt-4 border-t border-[var(--border)] space-y-2.5">
                <p className="text-xs font-semibold text-[var(--muted-foreground)]">
                  Recent feedback
                </p>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {ratings.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 text-xs py-1.5 border-b last:border-b-0 border-[var(--border)]/60"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                          <span className="font-semibold text-[var(--foreground)] truncate">
                            {item.authorName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-0.5 text-amber-500 font-mono tabular-nums">
                            {item.rating}/5
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </span>
                        </div>
                        <p className="text-[var(--foreground)]/90 mt-0.5 leading-snug break-words">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Official Instagram Page Showcase (@invobill.official) */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Instagram Ring Brand Avatar */}
                  <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] shrink-0">
                    <div className="w-full h-full rounded-full bg-[var(--card)] flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] truncate">
                        @{instaHandle}
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      Official Instagram Page · {brand.brandName || 'Invobill'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
                Follow our official Instagram page for new invoice templates, freelance billing tips, UPI &amp; GST guides, and product updates.
              </p>

              <div className="text-xs text-[var(--muted-foreground)] font-mono truncate">
                instagram.com/{instaHandle}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <a
                href={instaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Instagram className="w-4 h-4" />
                <span>Follow @{instaHandle}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-85" />
              </a>

              <button
                type="button"
                onClick={handleCopyInstagram}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title={`Copy @${instaHandle}`}
              >
                {copiedInsta ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span>Copy Handle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Columns */}
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
            <div className="pt-1">
              <a
                href={instaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              >
                <Instagram className="w-4 h-4 text-[var(--primary)]" />
                <span>@{instaHandle}</span>
                <ExternalLink className="w-3 h-3 text-[var(--muted-foreground)]" />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="text-xs font-bold text-[var(--foreground)] mb-4">
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
            <h4 className="text-xs font-bold text-[var(--foreground)] mb-4">
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
              <li>
                <a
                  href={instaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Instagram (@{instaHandle})</span>
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
            <h4 className="text-xs font-bold text-[var(--foreground)] mb-4">
              Owner Access
            </h4>
            <button
              onClick={onOpenCms}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 bg-[var(--background)] border border-[var(--border)] rounded-full text-[var(--foreground)] hover:bg-[var(--muted)] transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
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
            <p className="text-[11px] text-[var(--muted-foreground)] mt-2">
              Protected by master PIN
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted-foreground)]">
          <p>© {new Date().getFullYear()} {brand.brandName || 'Invobill'}. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <a
              href={instaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Instagram</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[var(--foreground)]">@{instaHandle}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
