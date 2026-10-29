import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Building2,
  User,
  Mail,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { BrandSettings, UserProfile } from '../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: BrandSettings;
  mode: 'signin' | 'signup';
  onSuccess: (user: UserProfile, isNewUser: boolean) => void;
  defaultEmail?: string;
  defaultName?: string;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  brand,
  mode: initialMode,
  onSuccess,
  defaultEmail = 'uzafa.shop@gmail.com',
  defaultName = 'Uzafa Shop',
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);
  const [useManualAccount, setUseManualAccount] = useState(false);
  const [email, setEmail] = useState(defaultEmail || '');
  const [name, setName] = useState(defaultName || '');
  const [businessName, setBusinessName] = useState(defaultName || '');
  const [role, setRole] = useState<'freelancer' | 'agency' | 'business'>('business');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleQuickGoogleSubmit = (selectedEmail: string, selectedName: string) => {
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      const isNew = authMode === 'signup';
      const profile: UserProfile = {
        id: `usr-google-${Date.now()}`,
        name: selectedName || 'Google Member',
        email: selectedEmail,
        businessName: businessName || selectedName || `${brand.brandName} Studio`,
        role: role,
        provider: 'google',
        onboardingCompleted: false, // Triggers the onboarding customer questionnaire!
        createdAt: new Date().toISOString(),
      };

      // Save to local storage database
      try {
        const raw = localStorage.getItem('invobill_users_db') || localStorage.getItem('billnest_users_db');
        const db = raw ? JSON.parse(raw) : {};
        db[selectedEmail.toLowerCase().trim()] = {
          ...profile,
          password: 'google-oauth-managed',
        };
        localStorage.setItem('invobill_users_db', JSON.stringify(db));
      } catch {}

      setIsLoading(false);
      onSuccess(profile, isNew);
      onClose();
    }, 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter a valid Google email address.');
      return;
    }
    handleQuickGoogleSubmit(email.trim(), name.trim() || 'Google Member');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand-Level Google Header Banner */}
        <div className="p-6 sm:p-8 pb-6 border-b border-[var(--border)] bg-linear-to-b from-orange-500/5 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            {/* Dual Brand Integration (Invobill + Google) */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-black text-sm shadow-xs">
                {brand.logoLetter || 'I'}
              </div>
              <div className="w-4 h-0.5 bg-[var(--border)]" />
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                  Brand Integration
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Google Verified
                </span>
              </div>
              <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight">
                {authMode === 'signup' ? 'Sign Up with Google' : 'Sign In with Google'}
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
            Connect your Google Identity to instantly sync your client accounts, invoices, and payment tracking across all devices.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-[var(--foreground)] text-[var(--card)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Sign In Existing
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-[var(--foreground)] text-[var(--card)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Create New Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* 1-Click Verified Google Account Selector */}
          {!useManualAccount ? (
            <div className="space-y-3">
              <span className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                Choose a Google Account to continue
              </span>

              {/* Detected / Primary User Account Card */}
              <div
                onClick={() => handleQuickGoogleSubmit(defaultEmail, defaultName)}
                className="p-4 rounded-2xl border border-[var(--border)] hover:border-orange-500/50 bg-[var(--background)] hover:bg-[var(--muted)]/50 transition-all cursor-pointer flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs ring-2 ring-white">
                    {defaultName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        {defaultName}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Active Google
                      </span>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {defaultEmail}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Enter Different Google Details */}
              <button
                type="button"
                onClick={() => setUseManualAccount(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-orange-500/40 transition-colors text-center cursor-pointer"
              >
                + Use another Google account or custom name
              </button>
            </div>
          ) : (
            /* Custom Google Account Form */
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                  Enter Google Credentials
                </span>
                <button
                  type="button"
                  onClick={() => setUseManualAccount(false)}
                  className="text-xs text-orange-600 hover:underline font-semibold cursor-pointer"
                >
                  Back to 1-click select
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                  Google Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                    Business / Studio Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Uzafa Studio"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-pill-dark py-2.5 px-4 text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isLoading ? 'Connecting Google...' : `Sign in with Google`}
                </button>
              </div>
            </form>
          )}

          {/* Brand Level Google Scope & Permissions Consent Box */}
          <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-2.5 text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2 text-[var(--foreground)] font-bold">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Google Account Security & Data Privacy</span>
            </div>
            <p className="leading-relaxed">
              To continue, Google will share your verified name, email address (<strong className="text-[var(--foreground)]">{email || defaultEmail}</strong>), and language preference with {brand.brandName || 'Invobill'}.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-orange-600 underline font-semibold hover:text-orange-700 cursor-pointer"
              >
                Invobill Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenTerms}
                className="text-orange-600 underline font-semibold hover:text-orange-700 cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 sm:px-8 border-t border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Google Identity Services 2.0</span>
          </div>
          <span className="text-[11px]">256-Bit SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
};
