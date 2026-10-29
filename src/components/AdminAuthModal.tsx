import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, ArrowRight, X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { ReceiptLogoIcon } from './BrandLogo';
import { validateStrict, VerifyPinSchema } from '../schemas/strictSchemas';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
  brandName?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
  brandName = 'Invobill',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Exponential Backoff state
  const [backoffSecondsRemaining, setBackoffSecondsRemaining] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  // Handle countdown timer for active exponential backoff
  useEffect(() => {
    if (backoffSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setBackoffSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [backoffSecondsRemaining]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backoffSecondsRemaining > 0 || isLoading) return;

    setIsLoading(true);
    setError('');

    // Strict schema validation (rejecting non-matching type, bounds, length or pattern)
    const validation = validateStrict(VerifyPinSchema, {
      pin: pin.trim(),
      customTargetPin: correctPin.trim(),
      account: 'admin@invobill.app',
    });

    if (!validation.success) {
      setIsLoading(false);
      setError(validation.error);
      return;
    }

    try {
      // Call server auth route protected with stricter rate limiting & exponential backoff
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : {};

      if (response.ok && data.success) {
        setAttemptCount(0);
        setBackoffSecondsRemaining(0);
        setError('');
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setPin('');
          onSuccess();
        }, 500);
      } else {
        // Handle 429 Too Many Requests or 401 with exponential backoff info
        const failures = data.consecutiveFailures || (attemptCount + 1);
        setAttemptCount(failures);

        const retryAfter = data.retryAfterSeconds || (data.backoffDelayMs ? Math.ceil(data.backoffDelayMs / 1000) : 0);
        if (retryAfter > 0) {
          setBackoffSecondsRemaining(retryAfter);
        }

        setError(data.error || 'Incorrect security PIN. Access denied.');
        setPin('');
      }
    } catch (err: any) {
      // Offline fallback: Check local PIN if network fails
      if (pin.trim() === correctPin.trim()) {
        setError('');
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setPin('');
          onSuccess();
        }, 500);
      } else {
        const nextAttempt = attemptCount + 1;
        setAttemptCount(nextAttempt);
        // Exponential backoff local calculation
        if (nextAttempt >= 3) {
          const delay = Math.min(Math.pow(2, nextAttempt - 3), 60);
          setBackoffSecondsRemaining(delay);
        }
        setError('Incorrect admin security PIN. Access denied.');
        setPin('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl max-w-sm w-full p-7 shadow-2xl relative overflow-hidden text-[var(--foreground)]">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-full transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-4 mb-6">
          <div className="relative inline-flex items-center justify-center mx-auto">
            <ReceiptLogoIcon sizeClass="w-16 h-16 rounded-3xl" showSparkle={false} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md border-2 border-[var(--card)]">
              {isSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white animate-in zoom-in" />
              ) : (
                <Lock className="w-3 h-3 text-white" />
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black tracking-tight text-[var(--foreground)]">
              {isSuccess ? 'Access Granted' : `${brandName} Admin Gate`}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Protected with strict per-IP & per-account rate limiting and exponential backoff.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5 px-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Master Security PIN
              </label>
              {attemptCount > 0 && (
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                  Attempts: {attemptCount}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="password"
                maxLength={8}
                value={pin}
                disabled={backoffSecondsRemaining > 0 || isLoading || isSuccess}
                autoFocus
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError('');
                }}
                placeholder={backoffSecondsRemaining > 0 ? `Locked for ${backoffSecondsRemaining}s` : '••••'}
                className="w-full text-center tracking-[0.4em] text-2xl font-black font-mono py-3 px-4 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-orange-500 focus:outline-none text-[var(--foreground)] transition-colors shadow-inner disabled:opacity-50 disabled:bg-[var(--muted)]"
              />
            </div>

            {/* Active Exponential Backoff Banner */}
            {backoffSecondsRemaining > 0 && (
              <div className="mt-2.5 p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 animate-in fade-in">
                <Clock className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                <div className="leading-tight">
                  <span>Exponential backoff delay active.</span>
                  <span className="block text-[11px] opacity-80">
                    Next retry available in <strong>{backoffSecondsRemaining}s</strong>.
                  </span>
                </div>
              </div>
            )}

            {/* Standard Error Notice */}
            {error && backoffSecondsRemaining === 0 && (
              <div className="mt-2 text-xs font-semibold text-rose-500 flex items-center justify-center gap-1.5 animate-in fade-in">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!pin.trim() || isSuccess || isLoading || backoffSecondsRemaining > 0}
              className="btn-pill-primary w-full py-3 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isSuccess ? (
                <span>Unlocking CMS...</span>
              ) : isLoading ? (
                <span>Verifying Security Token...</span>
              ) : backoffSecondsRemaining > 0 ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Retry in {backoffSecondsRemaining}s
                </span>
              ) : (
                <>
                  <span>Authenticate & Unlock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Default owner PIN is <span className="font-mono font-bold text-[var(--foreground)]">1234</span> (configurable in CMS Settings)
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
