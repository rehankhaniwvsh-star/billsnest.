import React from 'react';
import { TestimonialItem } from '../types';
import { Star } from 'lucide-react';

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
  primaryColor?: string;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonials,
}) => {
  return (
    <section id="testimonials" className="py-24 border-t border-[var(--border)] bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-bold uppercase tracking-wider">
            <span>Client Stories</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
            Loved by independent professionals
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm sm:text-base">
            Here is what freelancers and modern agencies say about Invobill.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(testimonials || []).map((t) => {
            const cleanQuote = (t.quote || '')
              .replace(/Invoiceify/g, 'Invobill')
              .replace(/invoiceify/g, 'invobill')
              .replace(/Ledgerly/g, 'Invobill')
              .replace(/ledgerly/g, 'invobill')
              .replace(/Billnest/g, 'Invobill')
              .replace(/billnest/g, 'invobill')
              .replace(/Billsnest/g, 'Invobill')
              .replace(/billsnest/g, 'invobill');
            return (
              <div
                key={t.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-7 flex flex-col justify-between shadow-xs hover:-translate-y-1.5 hover:shadow-lg hover:border-orange-500/30 transition-all duration-300 relative group"
              >
                <div>
                  {/* Rating stars */}
                  <div className="flex items-center gap-1 mb-4 text-amber-500">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--foreground)] leading-relaxed italic mb-6">
                    "{cleanQuote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF3366] to-[#FFA000] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--foreground)]">{t.author}</h4>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {t.role}, {t.company}
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
