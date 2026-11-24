import React, { useMemo, useState } from 'react';
import { TestimonialItem } from '../types';
import { Star, MessageSquarePlus, Trash2 } from 'lucide-react';
import { auth } from '../lib/firebase';

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
  firestoreTestimonials?: TestimonialItem[];
  primaryColor?: string;
  onOpenAddTestimonial?: () => void;
  onDeleteTestimonial?: (id: string) => Promise<void> | void;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials,
  firestoreTestimonials = [],
  onOpenAddTestimonial,
  onDeleteTestimonial,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const combinedTestimonials = useMemo(() => {
    const seen = new Set<string>();
    const merged: TestimonialItem[] = [];

    [...firestoreTestimonials, ...(testimonials || [])].forEach((item) => {
      if (!item || !item.id || seen.has(item.id)) return;
      seen.add(item.id);
      merged.push(item);
    });

    return merged;
  }, [firestoreTestimonials, testimonials]);

  const averageRating = useMemo(() => {
    if (combinedTestimonials.length === 0) return '5.0';
    const total = combinedTestimonials.reduce(
      (sum, item) => sum + (Number(item.rating) || 5),
      0
    );
    return (total / combinedTestimonials.length).toFixed(1);
  }, [combinedTestimonials]);

  const activeUid = auth.currentUser?.uid;

  const handleDelete = async (id: string) => {
    if (!onDeleteTestimonial) return;
    setDeletingId(id);
    try {
      await onDeleteTestimonial(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section id="testimonials" className="py-24 border-t border-[var(--border)] bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted-foreground)]">
              <span className="text-[var(--primary)] font-bold">Client Stories</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[var(--foreground)]">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {averageRating}/5
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {combinedTestimonials.length}{' '}
                {combinedTestimonials.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] tracking-tight text-balance">
              Loved by independent professionals
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm sm:text-base">
              Real feedback from freelancers, studios, and agencies using Invobill every day.
            </p>
          </div>

          {onOpenAddTestimonial && (
            <button
              type="button"
              onClick={onOpenAddTestimonial}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Add Testimonial</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {combinedTestimonials.map((t) => {
            const cleanQuote = (t.quote || '')
              .replace(/Invoiceify/g, 'Invobill')
              .replace(/invoiceify/g, 'invobill')
              .replace(/Ledgerly/g, 'Invobill')
              .replace(/ledgerly/g, 'invobill')
              .replace(/Billnest/g, 'Invobill')
              .replace(/billnest/g, 'invobill')
              .replace(/Billsnest/g, 'Invobill')
              .replace(/billsnest/g, 'invobill');

            const attribution = [t.role, t.company].filter(Boolean).join(', ');
            const isAuthorOwner =
              t.source === 'firestore' && Boolean(activeUid) && activeUid === t.userId;

            return (
              <div
                key={t.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-7 flex flex-col justify-between shadow-xs hover:-translate-y-1 hover:border-[var(--primary)]/35 transition-all duration-200 relative group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: Math.min(5, Math.max(1, Math.round(t.rating || 5))) }).map(
                        (_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        )
                      )}
                    </div>

                    {isAuthorOwner && onDeleteTestimonial && (
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        title="Delete your testimonial"
                        aria-label="Delete your testimonial"
                        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed italic mb-6 break-words">
                    &ldquo;{cleanQuote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF3366] to-[#FFA000] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {(t.author || 'U').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[var(--foreground)] truncate">
                      {t.author}
                    </h4>
                    <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                      {attribution || 'Verified Invobill User'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
