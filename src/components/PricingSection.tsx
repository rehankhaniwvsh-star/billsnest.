import React, { useState } from 'react';
import { Check, ArrowRight, Layers } from 'lucide-react';
import {
  BillingCycle,
  PlanCurrency,
  SubscriptionPlanId,
} from '../types';
import {
  SUBSCRIPTION_PLANS,
  formatPlanCurrency,
} from '../data/subscriptionPlans';
import { useAuth } from '../context/AuthContext';

interface PricingSectionProps {
  onSelectPlan: (
    planId: SubscriptionPlanId,
    cycle: BillingCycle,
    currency: PlanCurrency
  ) => void;
  onOpenGenerator: () => void;
  onOpenPlansPage?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onSelectPlan,
  onOpenGenerator,
  onOpenPlansPage,
}) => {
  const { currentPlan, currentUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [currency, setCurrency] = useState<PlanCurrency>('INR');

  return (
    <section
      id="pricing"
      className="py-24 border-t border-[var(--border)] bg-[var(--background)]"
    >
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        {/* Section Header + Currency / Cycle Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
              Start free. Upgrade only when your invoicing outgrows limits.
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
              Every paid tier includes a 7-day money-back guarantee, instant Razorpay activation, and zero hidden transaction fees on UPI or bank wires.
            </p>
          </div>

          {/* Right Controls: Currency Switch + Billing Cycle Switch */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Currency Switch */}
            <div
              className="inline-flex items-center p-1 rounded-xl bg-[var(--muted)] border border-[var(--border)]"
              role="group"
              aria-label="Currency selector"
            >
              {(['INR', 'USD'] as const).map((cur) => {
                const active = currency === cur;
                return (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrency(cur)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {cur === 'INR' ? '₹ INR' : '$ USD'}
                  </button>
                );
              })}
            </div>

            {/* Billing Cycle Switch */}
            <div
              className="inline-flex items-center p-1 rounded-xl bg-[var(--muted)] border border-[var(--border)]"
              role="group"
              aria-label="Billing cycle selector"
            >
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>Annual</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold">
                  2 mos free
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Plan Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isPopular = plan.id === 'pro';
            const isCurrent = currentPlan === plan.id;
            const amount = plan.pricing[currency][billingCycle];
            const monthlyEquivalent =
              billingCycle === 'annual' && amount > 0
                ? Math.round((amount / 12) * 100) / 100
                : amount;
            const formattedMainPrice = formatPlanCurrency(amount, currency);
            const formattedMonthlyEq = formatPlanCurrency(monthlyEquivalent, currency);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-7 flex flex-col justify-between transition-all ${
                  isPopular
                    ? 'bg-[var(--card)] border-2 border-[var(--primary)] shadow-xl'
                    : 'bg-[var(--card)] border border-[var(--border)] shadow-sm'
                }`}
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-[var(--foreground)]">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {plan.audience}
                      </p>
                    </div>

                    {isCurrent ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap shrink-0">
                        Current Plan
                      </span>
                    ) : plan.badge ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--accent)] text-[var(--primary)] border border-[var(--primary)]/20 whitespace-nowrap shrink-0">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>

                  {/* Price Figure */}
                  <div className="pb-5 mb-5 border-b border-[var(--border)]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] font-mono tabular-nums">
                        {formattedMainPrice}
                      </span>
                      <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                        {amount === 0
                          ? 'forever'
                          : billingCycle === 'annual'
                          ? '/ year'
                          : '/ month'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1.5 tabular-nums">
                      {amount === 0
                        ? 'No credit card required · Instant local setup'
                        : billingCycle === 'annual'
                        ? `${formattedMonthlyEq}/mo equivalent · Billed annually`
                        : 'Cancel or switch tiers anytime · GST invoice included'}
                    </p>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3 mb-7">
                    {plan.highlights.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs sm:text-[13px] text-[var(--foreground)] leading-snug"
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            isPopular
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--accent)] text-[var(--primary)]'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                {plan.id === 'free' ? (
                  <button
                    type="button"
                    onClick={onOpenGenerator}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] text-[var(--foreground)] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>{isCurrent ? 'Open Invoice Studio' : plan.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectPlan(plan.id, billingCycle, currency)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                      isPopular
                        ? 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-md'
                        : 'bg-[#111116] hover:bg-[#23232e] text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200'
                    }`}
                  >
                    <span>
                      {isCurrent && currentUser?.billingCycle === billingCycle
                        ? `Extend ${plan.name}`
                        : isCurrent
                        ? `Switch to ${billingCycle === 'annual' ? 'Annual' : 'Monthly'}`
                        : plan.ctaLabel}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Link to Dedicated Plans Section */}
        {onOpenPlansPage && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onOpenPlansPage}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-xs font-bold text-[var(--foreground)] transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Open Plans Page &amp; Detailed Feature Comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
