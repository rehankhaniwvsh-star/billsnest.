import { BillingCycle, PlanCurrency, SubscriptionPlanId } from '../types';

export interface PlanEntitlements {
  maxInvoicesPerMonth: number | null; // null = unlimited
  maxClients: number | null;
  maxBusinessProfiles: number;
  maxTeamSeats: number;
  allowedTemplates: Array<'Minimal' | 'Classic' | 'Modern'>;
  customColorsAllowed: boolean;
  logoUploadAllowed: boolean;
  removeWatermarkAllowed: boolean;
  cloudSyncAllowed: boolean;
  emailDispatchAllowed: boolean;
  multiCurrencyAllowed: boolean;
  razorpayCheckoutAllowed: boolean;
  recurringAllowed: boolean;
  csvExportAllowed: boolean;
  aiQueriesPerMonth: number | null; // null = unlimited
}

export interface SubscriptionPlanDefinition {
  id: SubscriptionPlanId;
  name: string;
  audience: string;
  badge?: string;
  pricing: {
    INR: { monthly: number; annual: number };
    USD: { monthly: number; annual: number };
  };
  ctaLabel: string;
  highlights: string[];
  entitlements: PlanEntitlements;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  {
    id: 'free',
    name: 'Starter',
    audience: 'For solo freelancers trying Invobill',
    pricing: {
      INR: { monthly: 0, annual: 0 },
      USD: { monthly: 0, annual: 0 },
    },
    ctaLabel: 'Start with Starter',
    highlights: [
      'Up to 5 invoices / month & 3 saved clients',
      'Minimal invoice template & Invobill theme',
      'High-res PDF & PNG downloads (with footer)',
      'GST / VAT / TDS & discount math',
      'Bank wire & scannable UPI QR code',
      'Local browser draft storage',
    ],
    entitlements: {
      maxInvoicesPerMonth: 5,
      maxClients: 3,
      maxBusinessProfiles: 1,
      maxTeamSeats: 1,
      allowedTemplates: ['Minimal'],
      customColorsAllowed: false,
      logoUploadAllowed: false,
      removeWatermarkAllowed: false,
      cloudSyncAllowed: false,
      emailDispatchAllowed: false,
      multiCurrencyAllowed: false,
      razorpayCheckoutAllowed: false,
      recurringAllowed: false,
      csvExportAllowed: false,
      aiQueriesPerMonth: 3,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    audience: 'For active freelancers & independent creators',
    badge: 'Most Popular',
    pricing: {
      INR: { monthly: 199, annual: 1990 },
      USD: { monthly: 4.99, annual: 49 },
    },
    ctaLabel: 'Upgrade to Pro',
    highlights: [
      'Unlimited invoices & unlimited clients',
      'White-label PDFs (remove "Powered by Invobill")',
      'Custom logo upload & unlimited brand colors',
      'All 3 templates (Modern, Classic, Minimal)',
      'Cloud sync across devices & direct email delivery',
      'Multi-currency (₹, $, €, £) & 30 AI tax/copy queries/mo',
    ],
    entitlements: {
      maxInvoicesPerMonth: null,
      maxClients: null,
      maxBusinessProfiles: 1,
      maxTeamSeats: 1,
      allowedTemplates: ['Minimal', 'Classic', 'Modern'],
      customColorsAllowed: true,
      logoUploadAllowed: true,
      removeWatermarkAllowed: true,
      cloudSyncAllowed: true,
      emailDispatchAllowed: true,
      multiCurrencyAllowed: true,
      razorpayCheckoutAllowed: false,
      recurringAllowed: false,
      csvExportAllowed: false,
      aiQueriesPerMonth: 30,
    },
  },
  {
    id: 'business',
    name: 'Business',
    audience: 'For studios, agencies & GST businesses',
    pricing: {
      INR: { monthly: 499, annual: 4990 },
      USD: { monthly: 9.99, annual: 99 },
    },
    ctaLabel: 'Upgrade to Business',
    highlights: [
      'Everything in Pro, unlocked without limits',
      'Up to 5 business profiles & brands under 1 login',
      'Razorpay online checkout button on invoices',
      'Recurring invoices & automated overdue reminders',
      'Team & accountant access (up to 5 seats)',
      'Monthly GST / tax summary & CSV accounting export',
    ],
    entitlements: {
      maxInvoicesPerMonth: null,
      maxClients: null,
      maxBusinessProfiles: 5,
      maxTeamSeats: 5,
      allowedTemplates: ['Minimal', 'Classic', 'Modern'],
      customColorsAllowed: true,
      logoUploadAllowed: true,
      removeWatermarkAllowed: true,
      cloudSyncAllowed: true,
      emailDispatchAllowed: true,
      multiCurrencyAllowed: true,
      razorpayCheckoutAllowed: true,
      recurringAllowed: true,
      csvExportAllowed: true,
      aiQueriesPerMonth: null,
    },
  },
];

export interface ComparisonRow {
  label: string;
  free: string;
  pro: string;
  business: string;
}

export const PLAN_COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'Monthly invoices', free: '5 / month', pro: 'Unlimited', business: 'Unlimited' },
  { label: 'Saved clients', free: 'Up to 3', pro: 'Unlimited', business: 'Unlimited' },
  { label: 'Invoice templates', free: 'Minimal', pro: 'All 3 layouts', business: 'All 3 layouts' },
  { label: 'Custom logo & brand colors', free: 'Default theme', pro: 'Included', business: 'Included' },
  { label: 'White-label (no footer)', free: 'Invobill footer', pro: 'White-label', business: 'White-label' },
  { label: 'UPI QR & Bank wire details', free: 'Included', pro: 'Included', business: 'Included' },
  { label: 'Cloud sync & email delivery', free: 'Local only', pro: 'Included', business: 'Included' },
  { label: 'Business profiles / brands', free: '1 brand', pro: '1 brand', business: 'Up to 5 brands' },
  { label: 'Razorpay invoice checkout', free: '—', pro: '—', business: 'Included' },
  { label: 'GST summary & CSV export', free: '—', pro: '—', business: 'Included' },
  { label: 'Team & accountant seats', free: '1 user', pro: '1 user', business: 'Up to 5 seats' },
];

export function getPlanDefinition(planId?: SubscriptionPlanId): SubscriptionPlanDefinition {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[0];
}

export function getPlanEntitlements(planId?: SubscriptionPlanId): PlanEntitlements {
  return getPlanDefinition(planId).entitlements;
}

export function getPlanAmountInMinorUnits(
  planId: SubscriptionPlanId,
  cycle: BillingCycle,
  currency: PlanCurrency
): number {
  const plan = getPlanDefinition(planId);
  const major = plan.pricing[currency][cycle];
  return Math.round(major * 100);
}

export function formatPlanCurrency(amount: number, currency: PlanCurrency): string {
  if (amount === 0) return currency === 'INR' ? '₹0' : '$0';
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}
