import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  BillingCycle,
  PlanCurrency,
  SubscriptionPlanId,
} from '../types';
import {
  SUBSCRIPTION_PLANS,
  PLAN_COMPARISON_ROWS,
  getPlanDefinition,
  getPlanAmountInMinorUnits,
  formatPlanCurrency,
} from '../data/subscriptionPlans';
import { useAuth } from '../context/AuthContext';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export interface InvoiceCheckoutPayload {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  amountMajor: number;
  currency: PlanCurrency;
  businessName: string;
  onPaymentVerified: (paymentId: string, orderId: string) => void;
}

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: SubscriptionPlanId;
  initialCycle?: BillingCycle;
  initialCurrency?: PlanCurrency;
  invoiceCheckout?: InvoiceCheckoutPayload | null;
}

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  initialPlan = 'pro',
  initialCycle = 'monthly',
  initialCurrency = 'INR',
  invoiceCheckout = null,
}) => {
  const { currentUser, currentPlan, upgradePlan } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(
    initialPlan === 'free' ? 'pro' : initialPlan
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const [currency, setCurrency] = useState<PlanCurrency>(initialCurrency);

  const [customerName, setCustomerName] = useState<string>(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState<string>(currentUser?.email || '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(true);
  const [verifiedReceipt, setVerifiedReceipt] = useState<{
    orderId: string;
    paymentId: string;
    title: string;
    amountFormatted: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPlan(initialPlan === 'free' ? 'pro' : initialPlan);
    setBillingCycle(initialCycle);
    setCurrency(initialCurrency);
    setCustomerName(
      invoiceCheckout?.clientName || currentUser?.name || ''
    );
    setCustomerEmail(
      invoiceCheckout?.clientEmail || currentUser?.email || ''
    );
    setErrorMsg(null);
    setVerifiedReceipt(null);
    setIsProcessing(false);
  }, [isOpen, initialPlan, initialCycle, initialCurrency, invoiceCheckout, currentUser]);

  if (!isOpen) return null;

  const isInvoiceMode = !!invoiceCheckout;
  const paidPlans = SUBSCRIPTION_PLANS.filter((p) => p.id !== 'free');
  const planDef = getPlanDefinition(selectedPlan);

  const orderAmountMinor = isInvoiceMode
    ? Math.round(invoiceCheckout.amountMajor * 100)
    : getPlanAmountInMinorUnits(selectedPlan, billingCycle, currency);

  const orderCurrency: PlanCurrency = isInvoiceMode
    ? invoiceCheckout.currency
    : currency;

  const displayAmount = isInvoiceMode
    ? formatPlanCurrency(invoiceCheckout.amountMajor, invoiceCheckout.currency)
    : formatPlanCurrency(planDef.pricing[currency][billingCycle], currency);

  const handleRazorpayPay = async () => {
    setErrorMsg(null);

    if (orderAmountMinor < 100) {
      setErrorMsg('Minimum payable amount is 100 paise / 1.00 unit.');
      return;
    }

    if (typeof window.Razorpay !== 'function') {
      setErrorMsg(
        'Razorpay checkout script is unavailable right now. Please check your connection or disable script blockers.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      const receipt = isInvoiceMode
        ? `inv_${invoiceCheckout.invoiceNumber}_${Date.now()}`.slice(0, 38)
        : `sub_${selectedPlan}_${billingCycle}_${Date.now()}`.slice(0, 38);

      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderAmountMinor,
          currency: orderCurrency,
          receipt,
          notes: isInvoiceMode
            ? {
                type: 'invoice_payment',
                invoiceNumber: invoiceCheckout.invoiceNumber,
              }
            : {
                type: 'subscription',
                planId: selectedPlan,
                billingCycle,
                userId: currentUser?.id || 'guest',
              },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success || !orderData.order_id) {
        setErrorMsg(orderData.error || 'Could not create Razorpay order. Please try again.');
        setIsProcessing(false);
        return;
      }

      const keyId =
        orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || '';

      if (!keyId) {
        setErrorMsg('Razorpay Key ID is not configured in environment.');
        setIsProcessing(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: isInvoiceMode
          ? invoiceCheckout.businessName || 'Invobill'
          : 'Invobill',
        description: isInvoiceMode
          ? `Payment for Invoice ${invoiceCheckout.invoiceNumber}`
          : `${planDef.name} Plan (${billingCycle === 'annual' ? 'Annual' : 'Monthly'})`,
        order_id: orderData.order_id,
        prefill: {
          name: customerName || currentUser?.name || 'Invobill Customer',
          email: customerEmail || currentUser?.email || '',
        },
        theme: {
          color: '#FF5238',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setErrorMsg('Checkout cancelled. No amount was charged.');
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              setErrorMsg(
                verifyData.error ||
                  'Payment signature verification failed. Please contact support if charged.'
              );
              setIsProcessing(false);
              return;
            }

            if (isInvoiceMode) {
              invoiceCheckout.onPaymentVerified(
                response.razorpay_payment_id,
                response.razorpay_order_id
              );
            } else {
              await upgradePlan({
                planId: selectedPlan,
                billingCycle,
                currency: orderCurrency,
                amount: orderAmountMinor,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });
            }

            setVerifiedReceipt({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              title: isInvoiceMode
                ? `Invoice ${invoiceCheckout.invoiceNumber} Paid`
                : `${planDef.name} Plan Activated`,
              amountFormatted: displayAmount,
            });
            setIsProcessing(false);
          } catch (verifyErr: any) {
            setErrorMsg(
              verifyErr?.message ||
                'Network error while verifying payment signature.'
            );
            setIsProcessing(false);
          }
        },
      });

      rzp.on('payment.failed', (failureResp: any) => {
        const reason =
          failureResp?.error?.description ||
          failureResp?.error?.reason ||
          'Payment could not be completed.';
        setErrorMsg(`Payment failed: ${reason}`);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Unable to initiate Razorpay checkout. Please try again.'
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transition-all ${
          !isInvoiceMode && !verifiedReceipt ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                {isInvoiceMode
                  ? `Pay Invoice ${invoiceCheckout.invoiceNumber}`
                  : 'Upgrade Invobill Plan'}
              </h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Razorpay Standard Checkout · UPI, Cards, Netbanking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {verifiedReceipt ? (
            /* Success Receipt View */
            <div className="space-y-5 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-[var(--foreground)]">
                  {verifiedReceipt.title}
                </h4>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  HMAC-SHA256 signature verified on server. Your account has been updated immediately.
                </p>
              </div>

              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Amount Paid</span>
                  <span className="font-mono font-bold text-[var(--foreground)] tabular-nums">
                    {verifiedReceipt.amountFormatted}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--muted-foreground)] shrink-0">Payment ID</span>
                  <span className="font-mono text-[11px] text-[var(--foreground)] truncate">
                    {verifiedReceipt.paymentId}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[var(--muted-foreground)] shrink-0">Order ID</span>
                  <span className="font-mono text-[11px] text-[var(--foreground)] truncate">
                    {verifiedReceipt.orderId}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white cursor-pointer"
              >
                Continue to Invobill
              </button>
            </div>
          ) : (
            <>
              {!isInvoiceMode ? (
                <>
                  {/* Tier Selector */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {paidPlans.map((plan) => {
                      const active = selectedPlan === plan.id;
                      const priceStr = formatPlanCurrency(
                        plan.pricing[currency][billingCycle],
                        currency
                      );
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[var(--primary)] bg-[var(--accent)]/60'
                              : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-extrabold text-[var(--foreground)]">
                              {plan.name}
                            </span>
                            {currentPlan === plan.id && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-base font-extrabold text-[var(--foreground)] mt-1 tabular-nums">
                            {priceStr}
                            <span className="text-[11px] font-sans font-medium text-[var(--muted-foreground)]">
                              /{billingCycle === 'annual' ? 'yr' : 'mo'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Billing Cycle + Currency Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--background)] border border-[var(--border)] rounded-xl p-2.5">
                    <div className="inline-flex rounded-lg p-0.5 bg-[var(--muted)]">
                      {(['monthly', 'annual'] as const).map((cycle) => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => setBillingCycle(cycle)}
                          className={`px-3 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                            billingCycle === cycle
                              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                              : 'text-[var(--muted-foreground)]'
                          }`}
                        >
                          {cycle === 'monthly' ? 'Monthly' : 'Annual (2 mos free)'}
                        </button>
                      ))}
                    </div>

                    <div className="inline-flex rounded-lg p-0.5 bg-[var(--muted)]">
                      {(['INR', 'USD'] as const).map((cur) => (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => setCurrency(cur)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                            currency === cur
                              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                              : 'text-[var(--muted-foreground)]'
                          }`}
                        >
                          {cur === 'INR' ? '₹ INR' : '$ USD'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Plan Quick Benefits */}
                  <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--foreground)]">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>Included in {planDef.name}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {planDef.highlights.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]"
                        >
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Plan Comparison inside Purchase Flow */}
                  <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--background)]">
                    <button
                      type="button"
                      onClick={() => setShowComparison((v) => !v)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span>Detailed Plan Comparison</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${
                          showComparison ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showComparison && (
                      <div className="overflow-x-auto border-t border-[var(--border)] bg-[var(--card)]">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] bg-[var(--muted)]/30">
                              <th className="py-2 px-3">Capability</th>
                              <th className="py-2 px-2.5">Starter ({formatPlanCurrency(0, currency)})</th>
                              <th
                                className={`py-2 px-2.5 ${
                                  selectedPlan === 'pro' ? 'text-[var(--primary)]' : ''
                                }`}
                              >
                                Pro ({formatPlanCurrency(SUBSCRIPTION_PLANS[1].pricing[currency][billingCycle], currency)})
                              </th>
                              <th
                                className={`py-2 px-2.5 ${
                                  selectedPlan === 'business' ? 'text-[var(--primary)]' : ''
                                }`}
                              >
                                Business ({formatPlanCurrency(SUBSCRIPTION_PLANS[2].pricing[currency][billingCycle], currency)})
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {PLAN_COMPARISON_ROWS.map((row) => (
                              <tr key={row.label}>
                                <td className="py-1.5 px-3 font-semibold text-[var(--foreground)]">
                                  {row.label}
                                </td>
                                <td className="py-1.5 px-2.5 text-[var(--muted-foreground)] tabular-nums">
                                  {row.free}
                                </td>
                                <td
                                  className={`py-1.5 px-2.5 font-semibold tabular-nums ${
                                    selectedPlan === 'pro'
                                      ? 'bg-[var(--accent)]/35 text-[var(--foreground)]'
                                      : 'text-[var(--foreground)]'
                                  }`}
                                >
                                  {row.pro}
                                </td>
                                <td
                                  className={`py-1.5 px-2.5 font-semibold tabular-nums ${
                                    selectedPlan === 'business'
                                      ? 'bg-[var(--accent)]/35 text-[var(--foreground)]'
                                      : 'text-[var(--foreground)]'
                                  }`}
                                >
                                  {row.business}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Invoice Online Payment Summary */
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Billed By</span>
                    <span className="font-bold text-[var(--foreground)]">
                      {invoiceCheckout.businessName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Client</span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {invoiceCheckout.clientName}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-2">
                    <span className="font-bold text-[var(--foreground)]">Payable Total</span>
                    <span className="font-mono text-base font-extrabold text-[var(--primary)] tabular-nums">
                      {displayAmount}
                    </span>
                  </div>
                </div>
              )}

              {/* Billing Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--foreground)] mb-1">
                    Receipt Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Pay Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleRazorpayPay}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-md transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Razorpay Checkout...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span className="tabular-nums">
                        Pay {displayAmount} with Razorpay
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-[var(--muted-foreground)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified order & HMAC-SHA256 signature validation</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
