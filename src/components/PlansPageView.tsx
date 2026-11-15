import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Layers,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  BillingCycle,
  BrandSettings,
  PlanCurrency,
  SubscriptionPlanId,
} from '../types';
import {
  SUBSCRIPTION_PLANS,
  PLAN_COMPARISON_ROWS,
  formatPlanCurrency,
  getPlanDefinition,
} from '../data/subscriptionPlans';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';

interface PlansPageViewProps {
  brand: BrandSettings;
  onBackToLanding: () => void;
  onSelectPlan: (
    planId: SubscriptionPlanId,
    cycle: BillingCycle,
    currency: PlanCurrency
  ) => void;
  onOpenGenerator: () => void;
  onOpenDashboard: () => void;
}

export const PlansPageView: React.FC<PlansPageViewProps> = ({
  brand,
  onBackToLanding,
  onSelectPlan,
  onOpenGenerator,
  onOpenDashboard,
}) => {
  const { currentPlan, currentUser } = useAuth();
  const activePlanDef = getPlanDefinition(currentPlan);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [currency, setCurrency] = useState<PlanCurrency>('INR');

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20">
      {/* Dedicated Top Bar */}
      <header className="sticky top-0 z-40 bg-[var(--card)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToLanding}
              className="shrink-0 cursor-pointer flex items-center"
              title="Return to Home"
            >
              <BrandLogo
                brandName={brand.brandName || 'Invobill'}
                size="sm"
                showTagline={false}
              />
            </button>

            <button
              type="button"
              onClick={onBackToLanding}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[var(--accent)] text-[var(--primary)] border border-[var(--primary)]/20 whitespace-nowrap">
              <Sparkles className="w-3 h-3" />
              <span>Current: {activePlanDef.name}</span>
            </span>

            <button
              type="button"
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] border border-[var(--border)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <button
              type="button"
              onClick={onOpenGenerator}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pt-12 space-y-12">
        {/* Heading + Switches */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
              Plans &amp; Subscriptions
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
              Pick the plan that scales with your billing
            </h1>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
              Start free with Starter, upgrade to Pro for white-label PDFs and unlimited clients, or unlock Business for online Razorpay invoice checkout and GST accounting exports.
            </p>
          </div>

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

        {/* 3 Plan Cards */}
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
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-[var(--foreground)]">
                        {plan.name}
                      </h2>
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

        {/* Detailed Plan Comparison Matrix (In the dedicated Plans Section) */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                Detailed Plan Comparison
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted-foreground)]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured by Razorpay Standard Checkout</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  <th className="py-3.5 px-6">Capability</th>
                  <th className="py-3.5 px-5">Starter ({formatPlanCurrency(0, currency)})</th>
                  <th className="py-3.5 px-5 text-[var(--primary)]">
                    Pro ({formatPlanCurrency(SUBSCRIPTION_PLANS[1].pricing[currency][billingCycle], currency)})
                  </th>
                  <th className="py-3.5 px-5">
                    Business ({formatPlanCurrency(SUBSCRIPTION_PLANS[2].pricing[currency][billingCycle], currency)})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {PLAN_COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="py-3 px-6 font-semibold text-[var(--foreground)]">
                      {row.label}
                    </td>
                    <td className="py-3 px-5 text-[var(--muted-foreground)] tabular-nums">
                      {row.free}
                    </td>
                    <td className="py-3 px-5 font-semibold text-[var(--foreground)] bg-[var(--accent)]/25 tabular-nums">
                      {row.pro}
                    </td>
                    <td className="py-3 px-5 font-semibold text-[var(--foreground)] tabular-nums">
                      {row.business}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
