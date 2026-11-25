import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  User,
  Briefcase,
  Loader2,
  LogOut,
  FileText,
  QrCode,
  Cloud,
  Copy,
  Check,
  ExternalLink,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthWhiteScreenModalProps {
  isOpen: boolean;
  required?: boolean;
  onClose: () => void;
  onSuccessRedirectDashboard: () => void;
  brandName?: string;
  tagline?: string;
  logoLetter?: string;
}

const ROLE_OPTIONS = [
  'Freelancer',
  'Design / Creative Studio',
  'Agency',
  'Consultant',
  'Small Business',
];

const GoogleGlyph: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const AuthWhiteScreenModal: React.FC<AuthWhiteScreenModalProps> = ({
  isOpen,
  required = false,
  onClose,
  onSuccessRedirectDashboard,
  brandName = 'Invobill',
  tagline = 'Invoices, paid faster',
}) => {
  const {
    currentUser,
    needsSignUpCompletion,
    authModalTab,
    authenticateWithGoogle,
    completeGoogleSignUp,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  } = useAuth();

  // New visitors always start on Sign Up first
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>(
    authModalTab === 'signin' ? 'signin' : 'signup'
  );
  const [attemptedLoginAsNewUser, setAttemptedLoginAsNewUser] = useState(false);

  // Email & Password Form State (No OTP)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Shared / Step 2 Profile State
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('Freelancer');

  // UI feedback
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isBusy = isLoadingGoogle || isLoadingEmail;

  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
  const firebaseAuthProvidersUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

  useEffect(() => {
    if (isOpen && !needsSignUpCompletion) {
      setActiveTab(authModalTab === 'signin' ? 'signin' : 'signup');
      setErrorMessage(null);
      setErrorCode(null);
      setSuccessMessage(null);
      setAttemptedLoginAsNewUser(false);
    }
  }, [isOpen, authModalTab, needsSignUpCompletion]);

  useEffect(() => {
    if (currentUser && needsSignUpCompletion) {
      setFullName((prev) => prev || currentUser.name || '');
      setCompanyName(
        (prev) =>
          prev ||
          currentUser.companyName ||
          (currentUser.name ? `${currentUser.name.split(' ')[0]} Studio` : '')
      );
      if (currentUser.role) {
        setRole(currentUser.role);
      }
    }
  }, [currentUser, needsSignUpCompletion]);

  if (!isOpen && !required) return null;

  const isOnboardingStep = Boolean(currentUser && needsSignUpCompletion);

  const finishAuthNavigation = () => {
    if (!required) {
      onSuccessRedirectDashboard();
    } else {
      onClose();
    }
  };

  const handleGoogleContinue = async () => {
    setIsLoadingGoogle(true);
    setErrorMessage(null);
    setErrorCode(null);
    setSuccessMessage(null);
    setAttemptedLoginAsNewUser(false);

    try {
      const mode = activeTab === 'signup' ? 'signup' : 'login';
      const result = await authenticateWithGoogle(mode);

      if (result.needsProfileCompletion) {
        setFullName(result.account.name || '');
        setCompanyName(
          result.account.companyName ||
            (result.account.name ? `${result.account.name.split(' ')[0]} Studio` : '')
        );
        if (mode === 'login') {
          setAttemptedLoginAsNewUser(true);
        }
        setActiveTab('signup');
        setIsLoadingGoogle(false);
        return;
      }

      setSuccessMessage(`Welcome back, ${result.account.name}! Entering ${brandName}...`);
      setTimeout(() => {
        setIsLoadingGoogle(false);
        finishAuthNavigation();
      }, 400);
    } catch (err: any) {
      setIsLoadingGoogle(false);
      setErrorCode(err?.code || null);
      setErrorMessage(err?.message || 'Google authentication failed. Please try again.');
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (activeTab === 'signup') {
      const cleanName = fullName.trim();
      const cleanCompany = companyName.trim();
      if (cleanName.length < 2) {
        setErrorMessage('Please enter your full name (at least 2 characters).');
        return;
      }
      if (cleanCompany.length < 2) {
        setErrorMessage('Please enter your business, brand, or studio name.');
        return;
      }

      setIsLoadingEmail(true);
      try {
        const createdUser = await signUpWithEmail(
          cleanName,
          cleanEmail,
          password,
          cleanCompany,
          role
        );
        setSuccessMessage(`Account created! Welcome to ${brandName}, ${createdUser.name}.`);
        setTimeout(() => {
          setIsLoadingEmail(false);
          finishAuthNavigation();
        }, 400);
      } catch (err: any) {
        setIsLoadingEmail(false);
        setErrorCode(err?.code || null);
        setErrorMessage(err?.message || 'Could not create your account. Please try again.');
      }
      return;
    }

    // Returning user Email Log In (No OTP)
    setIsLoadingEmail(true);
    try {
      const signedInUser = await signInWithEmail(cleanEmail, password);
      setSuccessMessage(`Welcome back, ${signedInUser.name}! Entering ${brandName}...`);
      setTimeout(() => {
        setIsLoadingEmail(false);
        finishAuthNavigation();
      }, 400);
    } catch (err: any) {
      setIsLoadingEmail(false);
      setErrorCode(err?.code || null);
      setErrorMessage(err?.message || 'Could not log in. Please check your email and password.');
    }
  };

  const handleCopyHostname = async () => {
    if (!currentHostname) return;
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    } catch {
      // Clipboard fallback not required
    }
  };

  const handleCompleteSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);

    const cleanName = fullName.trim();
    const cleanCompany = companyName.trim();

    if (cleanName.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    if (cleanCompany.length < 2) {
      setErrorMessage('Please enter your business, brand, or studio name.');
      return;
    }

    setIsLoadingEmail(true);
    try {
      const user = await completeGoogleSignUp({
        name: cleanName,
        companyName: cleanCompany,
        role,
      });
      setSuccessMessage(`Account created! Welcome to ${brandName}, ${user.name}.`);
      setTimeout(() => {
        setIsLoadingEmail(false);
        onClose();
      }, 400);
    } catch (err: any) {
      setIsLoadingEmail(false);
      setErrorMessage(err?.message || 'Could not finish sign-up. Please try again.');
    }
  };

  const handleSwitchAccount = async () => {
    setErrorMessage(null);
    setErrorCode(null);
    setSuccessMessage(null);
    setAttemptedLoginAsNewUser(false);
    await signOut();
    setActiveTab('signup');
  };

  return (
    <div
      className={
        required
          ? 'min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] flex items-stretch'
          : 'fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto'
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-portal-heading"
    >
      <div
        className={
          required
            ? 'w-full grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] min-h-screen'
            : 'w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden my-auto'
        }
      >
        {/* Left Panel: Editorial Brand Welcome */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0f0f14] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-mesh opacity-15 pointer-events-none" />
          <div className="relative z-10">
            <BrandLogo
              brandName={brandName}
              tagline={tagline}
              size="md"
              showTagline={true}
            />
          </div>

          <div className="relative z-10 space-y-8 max-w-md">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-orange-400">
                Instant invoicing workspace · No OTP needed
              </p>
              <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-balance">
                Sign up once, invoice clients in under two minutes.
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Create branded invoices with scannable UPI QR codes, instant client auto-fill, PDF &amp; PNG exports, and real-time cloud sync.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Branded vector PDFs &amp; templates</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Modern, Classic, and Minimal layouts matched to your brand palette.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <QrCode className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Built-in UPI QR &amp; Razorpay Checkout</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Accept instant zero-fee UPI transfers or online card payments.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Cloud className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Private Firestore cloud sync</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Your invoices, saved clients, and subscription tier stay synced across devices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-zinc-500">
            © {new Date().getFullYear()} {brandName} · Secured with Firebase Authentication
          </div>
        </div>

        {/* Right Panel: Mandatory Sign-Up / Log-In Gate (Google + Email without OTP) */}
        <div className="bg-[var(--card)] text-[var(--foreground)] flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative">
          {/* Top Mobile Brand + Optional Close when NOT required */}
          <div className="flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <BrandLogo
                brandName={brandName}
                tagline={tagline}
                size="sm"
                showTagline={false}
              />
            </div>
            <div className="hidden lg:block text-xs text-[var(--muted-foreground)]">
              {required ? 'Sign up or log in to continue' : 'Account access'}
            </div>

            {!required && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close account modal"
                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Main Centered Auth Card Content */}
          <div className="w-full max-w-md mx-auto my-auto py-6 space-y-5">
            {isOnboardingStep && currentUser ? (
              /* STEP 2: New Google User Profile Completion (Mandatory before entering site) */
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[var(--primary)]">
                    Step 2 of 2 · Finish Sign Up
                  </p>
                  <h2
                    id="auth-portal-heading"
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)] text-balance"
                  >
                    Set up your workspace
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Confirm your business details to complete registration and enter {brandName}.
                  </p>
                </div>

                {attemptedLoginAsNewUser && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      No existing {brandName} account was found for{' '}
                      <strong className="font-mono">{currentUser.email}</strong>. New users are required to complete this quick sign-up first.
                    </span>
                  </div>
                )}

                {/* Connected Google Identity Summary */}
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  <div className="flex items-center gap-3 min-w-0">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-[var(--border)] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {(currentUser.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--foreground)] truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-[var(--muted-foreground)] font-mono truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <GoogleGlyph className="w-4 h-4 shrink-0" />
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleCompleteSignUp} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="signup-fullname"
                      className="block text-xs font-semibold text-[var(--foreground)] mb-1.5"
                    >
                      Full Name <span className="text-[var(--primary)]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="signup-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Your full name"
                        maxLength={120}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-company"
                      className="block text-xs font-semibold text-[var(--foreground)] mb-1.5"
                    >
                      Business / Studio Name <span className="text-[var(--primary)]">*</span>
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="signup-company"
                        type="text"
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="e.g., Nova Design Studio"
                        maxLength={120}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-role"
                      className="block text-xs font-semibold text-[var(--foreground)] mb-1.5"
                    >
                      How do you bill clients?
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        id="signup-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors cursor-pointer"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60"
                  >
                    {isLoadingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating your workspace...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Sign Up &amp; Enter {brandName}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-[var(--border)] flex justify-center">
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Use a different account</span>
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 1: Sign-Up (Default for New Users) & Returning Login — Google + Email (No OTP) */
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h2
                    id="auth-portal-heading"
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)] text-balance"
                  >
                    {activeTab === 'signup'
                      ? `Sign up for ${brandName}`
                      : `Log in to ${brandName}`}
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {activeTab === 'signup'
                      ? 'New users must sign up first with Google or Email (instant access, no OTP required).'
                      : 'Welcome back! Log in with Google or your email & password to open your invoices.'}
                  </p>
                </div>

                {/* Segmented Control: Sign Up (Default) / Log In */}
                <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signup');
                      setErrorMessage(null);
                      setErrorCode(null);
                      setSuccessMessage(null);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'signup'
                        ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    Sign Up (New User)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setErrorMessage(null);
                      setErrorCode(null);
                      setSuccessMessage(null);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === 'signin'
                        ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    Log In
                  </button>
                </div>

                {/* Feedback Alerts */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                    {errorCode === 'auth/unauthorized-domain' && currentHostname && (
                      <div className="pl-6 flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleCopyHostname}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          {copiedDomain ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied {currentHostname}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="font-mono">{currentHostname}</span>
                            </>
                          )}
                        </button>
                        <a
                          href={firebaseAuthSettingsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 transition-colors"
                        >
                          <span>Open Firebase Auth Settings</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {errorCode === 'auth/operation-not-allowed' && (
                      <div className="pl-6 pt-0.5">
                        <a
                          href={firebaseAuthProvidersUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 transition-colors"
                        >
                          <span>Enable Email/Password in Firebase Console</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Google Authentication Button */}
                <button
                  type="button"
                  onClick={handleGoogleContinue}
                  disabled={isBusy}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--background)] hover:bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {isLoadingGoogle ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <GoogleGlyph className="w-4 h-4 shrink-0" />
                      <span>
                        {activeTab === 'signup'
                          ? 'Continue with Google'
                          : 'Log in with Google'}
                      </span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative flex items-center py-0.5">
                  <div className="flex-grow border-t border-[var(--border)]" />
                  <span className="shrink-0 px-3 text-[11px] font-medium text-[var(--muted-foreground)]">
                    or continue with email (no OTP)
                  </span>
                  <div className="flex-grow border-t border-[var(--border)]" />
                </div>

                {/* Email & Password Form (No OTP Required) */}
                <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5" noValidate>
                  {activeTab === 'signup' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="email-signup-name"
                          className="block text-xs font-semibold text-[var(--foreground)] mb-1"
                        >
                          Full Name <span className="text-[var(--primary)]">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="email-signup-name"
                            type="text"
                            autoComplete="name"
                            value={fullName}
                            onChange={(e) => {
                              setFullName(e.target.value);
                              if (errorMessage) setErrorMessage(null);
                            }}
                            placeholder="Your name"
                            maxLength={120}
                            required
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="email-signup-company"
                          className="block text-xs font-semibold text-[var(--foreground)] mb-1"
                        >
                          Business / Studio <span className="text-[var(--primary)]">*</span>
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="email-signup-company"
                            type="text"
                            autoComplete="organization"
                            value={companyName}
                            onChange={(e) => {
                              setCompanyName(e.target.value);
                              if (errorMessage) setErrorMessage(null);
                            }}
                            placeholder="Studio name"
                            maxLength={120}
                            required
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="auth-email"
                      className="block text-xs font-semibold text-[var(--foreground)] mb-1"
                    >
                      Email Address <span className="text-[var(--primary)]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="you@example.com"
                        maxLength={256}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-semibold text-[var(--foreground)] mb-1"
                    >
                      Password <span className="text-[var(--primary)]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={activeTab === 'signup' ? 'new-password' : 'current-password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder={
                          activeTab === 'signup'
                            ? 'Create password (min. 6 characters)'
                            : 'Enter your password'
                        }
                        minLength={6}
                        required
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-3 px-4 rounded-xl bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  >
                    {isLoadingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {activeTab === 'signup' ? 'Creating account...' : 'Logging in...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          {activeTab === 'signup'
                            ? `Create Account & Enter ${brandName}`
                            : 'Log in with Email'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-[var(--muted-foreground)] text-center leading-relaxed">
                    {activeTab === 'signup'
                      ? 'Instant access without OTP · Free Starter plan included'
                      : 'Log in directly with your email and password — no OTP needed'}
                  </p>
                </form>

                {/* Cross-switch prompt */}
                <div className="pt-3 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
                  {activeTab === 'signup' ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('signin');
                          setErrorMessage(null);
                          setErrorCode(null);
                        }}
                        className="font-bold text-[var(--primary)] hover:underline cursor-pointer"
                      >
                        Log in
                      </button>
                    </>
                  ) : (
                    <>
                      First time visiting {brandName}?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('signup');
                          setErrorMessage(null);
                          setErrorCode(null);
                        }}
                        className="font-bold text-[var(--primary)] hover:underline cursor-pointer"
                      >
                        Sign up first
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Security Footer */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-center gap-2 text-[11px] text-[var(--muted-foreground)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Protected by Firebase Authentication (Google &amp; Email)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
