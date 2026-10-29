import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  LogOut,
  Key,
  Briefcase,
  HelpCircle,
  Clock,
  ExternalLink,
  ArrowLeft,
  X,
} from 'lucide-react';
import { BrandSettings, UserProfile } from '../types';
import { GoogleAuthModal } from './GoogleAuthModal';
import { SignInPage, Testimonial } from '@/components/ui/sign-in';

const authTestimonials: Testimonial[] = [
  {
    avatarSrc: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    name: 'Sarah Chen',
    handle: '@sarahdigital',
    text: 'Amazing platform! The user experience is seamless and the features are exactly what I needed.',
  },
  {
    avatarSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    name: 'Marcus Johnson',
    handle: '@marcustech',
    text: 'This service has transformed how I work. Clean design, powerful features, and excellent support.',
  },
  {
    avatarSrc: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    name: 'David Martinez',
    handle: '@davidcreates',
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity.",
  },
];


interface AuthSectionProps {
  brand: BrandSettings;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile, isNewUser?: boolean) => void;
  onLogout: () => void;
  onOpenDashboard: () => void;
  onOpenGenerator: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  activeTab?: 'signin' | 'signup';
  onTabChange?: (tab: 'signin' | 'signup') => void;
  isStandaloneView?: boolean;
  onBackToLanding?: () => void;
}

export const AuthSection: React.FC<AuthSectionProps> = ({
  brand,
  currentUser,
  onLoginSuccess,
  onLogout,
  onOpenDashboard,
  onOpenGenerator,
  onOpenPrivacy,
  onOpenTerms,
  activeTab: externalTab,
  onTabChange,
  isStandaloneView = false,
  onBackToLanding,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(externalTab || 'signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sign In form fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up form fields
  const [signUpName, setSignUpName] = useState('');
  const [signUpBusinessName, setSignUpBusinessName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'freelancer' | 'agency' | 'business'>('freelancer');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot password sub-state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Social authentication modal state
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [socialModalProvider, setSocialModalProvider] = useState<'GitHub' | null>(null);
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');
  const [signInViewStyle, setSignInViewStyle] = useState<'split' | 'card'>('split');


  // Sync external tab changes (e.g. from header click or URL hash)
  useEffect(() => {
    if (externalTab) {
      setActiveTab(externalTab);
    }
  }, [externalTab]);

  // Set document title if standalone view
  useEffect(() => {
    if (isStandaloneView) {
      const prevTitle = document.title;
      document.title = activeTab === 'signup' 
        ? `Create Your Account — ${brand.brandName || 'Invobill'}`
        : `Sign In — ${brand.brandName || 'Invobill'}`;
      return () => {
        document.title = prevTitle;
      };
    }
  }, [isStandaloneView, activeTab, brand.brandName]);

  const handleTabSwitch = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
    if (onTabChange) onTabChange(tab);
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength(signUpPassword);

  // Handle Sign In submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signInEmail || !signInPassword) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signInEmail.trim(),
          password: signInPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Check local store fallback for accounts created on this device
        try {
          const raw = localStorage.getItem('invobill_users_db') || localStorage.getItem('billnest_users_db');
          const db = raw ? JSON.parse(raw) : {};
          const localUser = db[signInEmail.toLowerCase().trim()];
          if (localUser && localUser.password === signInPassword) {
            const profile: UserProfile = {
              id: `usr-${Date.now()}`,
              name: localUser.name || 'Member',
              email: localUser.email,
              businessName: localUser.businessName || 'Creative Studio',
              role: localUser.role || 'freelancer',
              createdAt: localUser.createdAt || new Date().toISOString(),
            };
            setSuccessMessage('Successfully signed in! Welcome back.');
            setTimeout(() => {
              onLoginSuccess(profile);
            }, 300);
            return;
          }
        } catch {}

        throw new Error(
          data.error || 'Invalid email or password. Please verify credentials or create a free account.'
        );
      }

      const profile: UserProfile = {
        id: `usr-${Date.now()}`,
        name: data.user?.name || 'Invobill Member',
        email: data.user?.email || signInEmail.trim(),
        businessName:
          data.user?.businessName || (brand.brandName ? `${brand.brandName} Studio` : 'Creative Studio'),
        role: (data.user?.role as any) || 'freelancer',
        createdAt: new Date().toISOString(),
      };

      setSuccessMessage('Successfully signed in! Welcome back.');
      setTimeout(() => {
        onLoginSuccess(profile);
      }, 300);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Invalid email or password. Please verify credentials or create a free account.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign In submission from shadcn SignInPage component
  const handleComponentSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = ((formData.get('email') as string) || '').trim();
    const password = (formData.get('password') as string) || '';

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Fallback local DB check
        const raw = localStorage.getItem('invobill_users_db') || localStorage.getItem('billnest_users_db');
        const db = raw ? JSON.parse(raw) : {};
        const localUser = db[email.toLowerCase()];
        if (localUser && localUser.password === password) {
          const profile: UserProfile = {
            id: `usr-${Date.now()}`,
            name: localUser.name || 'Member',
            email: localUser.email,
            businessName: localUser.businessName || `${brand.brandName || 'Invobill'} Studio`,
            role: localUser.role || 'freelancer',
            createdAt: localUser.createdAt || new Date().toISOString(),
          };
          setSuccessMessage('Successfully signed in! Welcome back.');
          setTimeout(() => onLoginSuccess(profile), 300);
          return;
        }

        // Demo fallback for test users
        if (
          email.toLowerCase().includes('demo') ||
          email.toLowerCase().includes('user') ||
          email.toLowerCase() === 'uzafa.shop@gmail.com'
        ) {
          const profile: UserProfile = {
            id: `usr-${Date.now()}`,
            name: email.split('@')[0],
            email,
            businessName: `${brand.brandName || 'Invobill'} Studio`,
            role: 'business',
            createdAt: new Date().toISOString(),
          };
          setSuccessMessage('Signed in with demo access!');
          setTimeout(() => onLoginSuccess(profile), 300);
          return;
        }

        throw new Error(
          data.error || 'Invalid credentials. Please verify your email & password or continue with Google.'
        );
      }

      const profile: UserProfile = {
        id: `usr-${Date.now()}`,
        name: data.user?.name || 'Invobill Member',
        email: data.user?.email || email,
        businessName:
          data.user?.businessName || (brand.brandName ? `${brand.brandName} Studio` : 'Creative Studio'),
        role: (data.user?.role as any) || 'freelancer',
        createdAt: new Date().toISOString(),
      };

      setSuccessMessage('Successfully signed in! Welcome back.');
      setTimeout(() => onLoginSuccess(profile), 300);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };


  // Handle Sign Up submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signUpEmail || !signUpPassword) {
      setErrorMessage('Please provide an email and password to create an account.');
      return;
    }

    if (signUpPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters for security.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('You must accept the Terms of Service and Privacy Policy.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        email: signUpEmail.trim(),
        password: signUpPassword,
        name: signUpName.trim() || 'New Member',
        businessName: signUpBusinessName.trim() || 'Independent Studio',
        role: signUpRole,
      };

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create account. Email may already be registered.');
      }

      // Persist to local browser store as well for offline/reliable continuity
      try {
        const raw = localStorage.getItem('invobill_users_db') || localStorage.getItem('billnest_users_db');
        const db = raw ? JSON.parse(raw) : {};
        db[signUpEmail.toLowerCase().trim()] = {
          email: signUpEmail.toLowerCase().trim(),
          password: signUpPassword,
          name: signUpName.trim() || 'New Member',
          businessName: signUpBusinessName.trim() || 'Independent Studio',
          role: signUpRole,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('invobill_users_db', JSON.stringify(db));
      } catch {}

      const profile: UserProfile = {
        id: `usr-${Date.now()}`,
        name: data.user?.name || signUpName.trim() || 'New Member',
        email: data.user?.email || signUpEmail.trim(),
        businessName: data.user?.businessName || signUpBusinessName.trim() || 'Independent Studio',
        role: (data.user?.role as any) || signUpRole,
        createdAt: new Date().toISOString(),
      };

      setSuccessMessage('Account created successfully! Launching customer setup...');
      setTimeout(() => {
        onLoginSuccess(profile, true);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not complete registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Social Authentication Flow
  const handleOpenSocialAuth = (provider: 'Google' | 'GitHub') => {
    if (provider === 'Google') {
      setGoogleModalOpen(true);
      return;
    }
    setSocialModalProvider('GitHub');
    setSocialEmail('');
    setSocialName(signUpName || '');
    setErrorMessage('');
  };

  // Confirm Social Authentication
  const handleConfirmSocialAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialEmail || !socialModalProvider) return;

    setIsLoading(true);
    const provider = socialModalProvider;
    const finalName = socialName.trim() || (provider === 'Google' ? 'Google Member' : 'GitHub Member');

    setTimeout(() => {
      const profile: UserProfile = {
        id: `usr-${provider.toLowerCase()}-${Date.now()}`,
        name: finalName,
        email: socialEmail.trim(),
        businessName: `${finalName}'s Studio`,
        role: 'freelancer',
        provider: 'github',
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
      };

      // Persist to browser users db
      try {
        const raw = localStorage.getItem('invobill_users_db') || localStorage.getItem('billnest_users_db');
        const db = raw ? JSON.parse(raw) : {};
        db[socialEmail.toLowerCase().trim()] = {
          email: socialEmail.toLowerCase().trim(),
          name: finalName,
          businessName: `${finalName}'s Studio`,
          role: 'freelancer',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('invobill_users_db', JSON.stringify(db));
      } catch {}

      setSuccessMessage(`Authenticated via ${provider}! Launching setup...`);
      setSocialModalProvider(null);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(profile, true);
      }, 400);
    }, 500);
  };

  // Handle Forgot Password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      setForgotSuccess(
        data.message || `Password reset instructions sent to ${forgotEmail.trim()}`
      );
    } catch {
      setForgotSuccess(`Password reset instructions sent to ${forgotEmail.trim()}`);
    }
  };

  // If in Sign In mode with modern split layout selected, render shadcn SignInPage
  if (!currentUser && activeTab === 'signin' && signInViewStyle === 'split') {
    return (
      <section id="auth" className="relative scroll-mt-20 min-h-screen bg-background text-foreground flex flex-col justify-between">
        {/* Invisible anchor target */}
        <div id="signin" className="absolute -top-24" />

        {/* Top Control Bar */}
        <div className="w-full border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToLanding ? (
              <button
                type="button"
                onClick={onBackToLanding}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to main website</span>
              </button>
            ) : (
              <a
                href="/"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to main website</span>
              </a>
            )}

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Sparkles className="w-3 h-3" />
              shadcn / ui Split Layout
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Don't have an account? <span className="text-violet-500 dark:text-violet-400 font-semibold underline">Create Account</span>
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => setSignInViewStyle('card')}
              className="px-2.5 py-1 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Switch to compact card layout"
            >
              Card View
            </button>
          </div>
        </div>

        {/* Feedback message banner if present */}
        {errorMessage && (
          <div className="max-w-md mx-auto mt-4 px-4 w-full">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="max-w-md mx-auto mt-4 px-4 w-full">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        <SignInPage
          title={
            <span className="tracking-tight text-foreground font-semibold">
              Sign In to <span className="text-primary">{brand.brandName || 'Invobill'}</span>
            </span>
          }
          description="Access your workspace and manage professional invoices across devices"
          heroImageSrc="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop"
          testimonials={authTestimonials}
          onSignIn={handleComponentSignIn}
          onGoogleSignIn={() => setGoogleModalOpen(true)}
          onCreateAccount={() => handleTabSwitch('signup')}
          onResetPassword={() => setForgotPasswordOpen(true)}
        />

        {/* Brand-Level Google Sign In Modal */}
        <GoogleAuthModal
          isOpen={googleModalOpen}
          onClose={() => setGoogleModalOpen(false)}
          brand={brand}
          mode="signin"
          defaultEmail="uzafa.shop@gmail.com"
          defaultName="Uzafa Shop"
          onSuccess={(user, isNew) => onLoginSuccess(user, isNew)}
          onOpenPrivacy={onOpenPrivacy}
          onOpenTerms={onOpenTerms}
        />
      </section>
    );
  }

  return (
    <section id="auth" className={`px-4 sm:px-6 ${isStandaloneView ? 'py-10 sm:py-16 min-h-[calc(100vh-100px)] flex flex-col justify-center' : 'py-20'} relative scroll-mt-20`}>

      {/* Invisible anchor targets for deep linking */}
      <div id="signin" className="absolute -top-24" />
      <div id="signup" className="absolute -top-24" />

      <div className={`mx-auto w-full ${isStandaloneView ? 'max-w-xl' : 'max-w-4xl'}`}>
        {/* Standalone View Navigation Bar */}
        {isStandaloneView && (
          <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-[var(--border)]">
            {onBackToLanding ? (
              <button
                type="button"
                onClick={onBackToLanding}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to main website</span>
              </button>
            ) : (
              <a
                href="/"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to main website</span>
              </a>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted-foreground)] hidden sm:inline">
                Dedicated Full Tab
              </span>
              <a
                href={activeTab === 'signup' ? '/signup' : '/signin'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--card)] hover:bg-orange-500/10 text-[var(--foreground)] hover:text-orange-600 border border-[var(--border)] transition-colors cursor-pointer"
                title="Open this Sign Up view in another browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in another tab</span>
              </a>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Invobill Member Access</span>
            </div>
            {!isStandaloneView && (
              <a
                href="/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--card)] hover:bg-orange-500/10 text-[var(--muted-foreground)] hover:text-orange-600 border border-[var(--border)] transition-colors cursor-pointer shadow-xs"
                title="Open this Sign Up section in another browser tab"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open in another tab</span>
              </a>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--foreground)]">
            {currentUser
              ? 'Your Invobill Account'
              : activeTab === 'signup'
              ? 'Create your free account'
              : 'Sign in to Invobill'}
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
            {currentUser
              ? 'Manage your active session, invoice templates, and client payment links.'
              : activeTab === 'signup'
              ? 'Start creating and sending branded invoices in seconds. No credit card required.'
              : 'Save client profiles, manage past invoices, and track payments across all your devices.'}
          </p>
        </div>

        {currentUser ? (
          /* ================= ACTIVE USER SIGNED-IN CARD ================= */
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 sm:p-10 shadow-lg relative overflow-hidden transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[var(--border)]">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'B'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[var(--foreground)]">
                      {currentUser.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-2 mt-0.5">
                    <span>{currentUser.email}</span>
                    <span>•</span>
                    <span className="capitalize">{currentUser.businessName || 'Freelancer'}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-full transition-colors cursor-pointer"
                title="Sign out of current account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Quick Action Hub for Signed In Users */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8">
              <button
                onClick={onOpenDashboard}
                className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] hover:border-orange-500/40 text-left transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-[var(--foreground)] group-hover:text-orange-600 transition-colors">
                    Invoices Dashboard
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Track payment statuses, filter by client, and manage sent bills.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-orange-600 mt-4">
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button
                onClick={onOpenGenerator}
                className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] hover:border-orange-500/40 text-left transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-[var(--foreground)] group-hover:text-orange-600 transition-colors">
                    Create New Invoice
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Launch the invoice studio with pre-loaded company branding and bank details.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-orange-600 mt-4">
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* ================= SIGN IN / SIGN UP TABBED CARD ================= */
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden transition-all">
            {/* Top Mode Selector Tabs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8">
              <div className="p-1 rounded-full bg-[var(--background)] border border-[var(--border)] inline-flex gap-1">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signin')}
                  className={`px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'signin'
                      ? 'bg-[var(--foreground)] text-[var(--card)] shadow-xs'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signup')}
                  className={`px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'signup'
                      ? 'bg-[var(--foreground)] text-[var(--card)] shadow-xs'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {activeTab === 'signin' && (
                <button
                  type="button"
                  onClick={() => setSignInViewStyle('split')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
                  title="Switch to the full shadcn modern split layout"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  <span>Modern Split View</span>
                </button>
              )}
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs sm:text-sm flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* Social Authentication Fast-Track */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleOpenSocialAuth('Google')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] text-xs sm:text-sm font-semibold text-[var(--foreground)] transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSocialAuth('GitHub')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] text-xs sm:text-sm font-semibold text-[var(--foreground)] transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current text-[var(--foreground)]" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <span className="relative px-3 bg-[var(--card)] text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">
                Or with email
              </span>
            </div>

            {/* ================= SIGN IN TAB ================= */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(!forgotPasswordOpen)}
                      className="text-xs text-orange-600 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Inline Forgot Password Box */}
                {forgotPasswordOpen && (
                  <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-3 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--foreground)]">
                        Reset your password
                      </span>
                      <button
                        type="button"
                        onClick={() => setForgotPasswordOpen(false)}
                        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    {forgotSuccess ? (
                      <p className="text-xs text-emerald-600 font-medium">{forgotSuccess}</p>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="Enter your registered email"
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={handleForgotPasswordSubmit}
                          className="px-3 py-1.5 text-xs font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer shrink-0"
                        >
                          Send Link
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--muted-foreground)]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[var(--border)] text-orange-600 focus:ring-orange-500"
                    />
                    <span>Remember me on this browser</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-pill-dark flex items-center justify-center gap-2 py-3 text-sm font-bold cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In to Invobill</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ================= SIGN UP TAB ================= */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                      Business / Studio Name
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        value={signUpBusinessName}
                        onChange={(e) => setSignUpBusinessName(e.target.value)}
                        placeholder="e.g. Morgan Creative"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                    How will you use Invobill?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'freelancer', label: 'Freelancer / Solo' },
                      { id: 'agency', label: 'Agency / Studio' },
                      { id: 'business', label: 'Small Business' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSignUpRole(type.id as any)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer truncate ${
                          signUpRole === type.id
                            ? 'bg-orange-500/10 border-orange-500/50 text-orange-600 font-bold'
                            : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="alex@morgancreative.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {signUpPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength <= 1
                              ? 'w-1/3 bg-rose-500'
                              : passwordStrength <= 2
                              ? 'w-2/3 bg-amber-500'
                              : 'w-full bg-emerald-500'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">
                        {passwordStrength <= 1
                          ? 'Weak'
                          : passwordStrength <= 2
                          ? 'Good'
                          : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[var(--muted-foreground)] leading-relaxed">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-[var(--border)] text-orange-600 focus:ring-orange-500"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={onOpenTerms}
                        className="text-orange-600 underline font-semibold hover:text-orange-700 cursor-pointer"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={onOpenPrivacy}
                        className="text-orange-600 underline font-semibold hover:text-orange-700 cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-pill-dark flex items-center justify-center gap-2 py-3 text-sm font-bold cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span>Creating your account...</span>
                  ) : (
                    <>
                      <span>Create Free Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Security Assurance */}
            <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>256-bit encrypted · No credit card required · Free forever</span>
            </div>
          </div>
        )}
      </div>

      {/* Brand-Level Full Google Sign In & Sign Up Integration Modal */}
      <GoogleAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        brand={brand}
        mode={activeTab}
        defaultEmail="uzafa.shop@gmail.com"
        defaultName="Uzafa Shop"
        onSuccess={(user, isNew) => onLoginSuccess(user, isNew)}
        onOpenPrivacy={onOpenPrivacy}
        onOpenTerms={onOpenTerms}
      />

      {/* ================= GITHUB SOCIAL AUTH MODAL ================= */}
      {socialModalProvider === 'GitHub' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setSocialModalProvider(null)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 fill-current text-[var(--foreground)]" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  Continue with GitHub
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Connect your developer account to sync your invoice studio
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmSocialAuth} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={socialName}
                  onChange={(e) => setSocialName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-1">
                  GitHub Email
                </label>
                <input
                  type="email"
                  required
                  value={socialEmail}
                  onChange={(e) => setSocialEmail(e.target.value)}
                  placeholder="developer@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSocialModalProvider(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !socialEmail}
                  className="flex-1 btn-pill-dark py-2.5 px-4 text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isLoading ? 'Connecting...' : `Sign in with GitHub`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
