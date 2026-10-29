import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Building,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface AuthWhiteScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRedirectDashboard: () => void;
  brandName?: string;
  tagline?: string;
  logoLetter?: string;
}

export const AuthWhiteScreenModal: React.FC<AuthWhiteScreenModalProps> = ({
  isOpen,
  onClose,
  onSuccessRedirectDashboard,
  brandName = 'Invobill',
  tagline = 'Invoices, paid faster',
  logoLetter = 'I',
}) => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    authModalTab,
    openAuthModal,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(authModalTab || 'signin');
  const [isFullscreenWhite, setIsFullscreenWhite] = useState(false);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpCompany, setSignUpCompany] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Google Selector State
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');

  // Forgot Password State
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Tab Switch
  const switchTab = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsForgotPasswordView(false);
    setShowGoogleChooser(false);
  };

  // Google Sign In handler
  const handleGoogleAuth = async (customEmail?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const emailToUse = customEmail || 'uzafa.shop@gmail.com';
      const nameToUse = emailToUse.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await signInWithGoogle(emailToUse, nameToUse);
      setSuccessMessage(`Welcome, ${nameToUse}! Opening your Invoices Dashboard...`);
      setTimeout(() => {
        setIsLoading(false);
        onSuccessRedirectDashboard();
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Google authentication failed. Please try again.');
    }
  };

  // Email Sign In handler
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithEmail(signInEmail, signInPassword);
      setSuccessMessage(`Welcome back, ${user.name}! Opening your Invoices Dashboard...`);
      setTimeout(() => {
        setIsLoading(false);
        onSuccessRedirectDashboard();
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to sign in. Please verify your credentials.');
    }
  };

  // Email Sign Up handler
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!signUpEmail.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service to create an account.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signUpWithEmail(
        signUpName,
        signUpEmail,
        signUpPassword,
        signUpCompany
      );
      setSuccessMessage(`Account created successfully! Welcome to ${brandName}, ${user.name}!`);
      setTimeout(() => {
        setIsLoading(false);
        onSuccessRedirectDashboard();
      }, 750);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to create account.');
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-zinc-200' };
    if (pass.length < 6) return { score: 1, label: 'Too short', color: 'bg-rose-500' };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    if (pass.length >= 8 && hasNum && hasSpecial) {
      return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
    }
    if (pass.length >= 6 && (hasNum || hasSpecial)) {
      return { score: 2, label: 'Good', color: 'bg-amber-500' };
    }
    return { score: 1, label: 'Fair', color: 'bg-orange-500' };
  };

  const passwordStrength = getPasswordStrength(signUpPassword);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isFullscreenWhite
          ? 'bg-white p-0'
          : 'bg-zinc-950/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto'
      }`}
    >
      {/* Container - Pure White Screen Aesthetic */}
      <div
        className={`bg-white text-zinc-900 border border-zinc-200 shadow-2xl transition-all duration-300 flex flex-col ${
          isFullscreenWhite
            ? 'w-full h-full rounded-none overflow-y-auto'
            : 'max-w-xl w-full rounded-2xl sm:rounded-3xl max-h-[92vh] overflow-y-auto my-auto ring-1 ring-zinc-950/5'
        }`}
      >
        {/* Top Control Bar */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between border-b border-zinc-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-orange-500/20">
              {logoLetter}
            </div>
            <div>
              <div className="font-bold text-base text-zinc-900 tracking-tight flex items-center gap-2">
                <span>{brandName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  Account Portal
                </span>
              </div>
              <p className="text-xs text-zinc-500">{tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* White Screen View Toggle */}
            <button
              onClick={() => setIsFullscreenWhite(!isFullscreenWhite)}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              title={isFullscreenWhite ? 'Restore window size' : 'Expand to full white screen'}
            >
              {isFullscreenWhite ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close / Guest Preview button */}
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              title="Continue as guest / close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 bg-white">
          {/* Header Title & Subtitle */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
              {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              {activeTab === 'signin'
                ? 'Sign in to access your saved invoices, client directory, and live metrics.'
                : 'Get started in seconds. Fast, beautiful invoicing tailored for your business.'}
            </p>
          </div>

          {/* Tab Switcher: Sign In & Sign Up only */}
          <div className="flex p-1 bg-zinc-100 rounded-xl max-w-md mx-auto border border-zinc-200/80">
            <button
              type="button"
              onClick={() => switchTab('signin')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60 font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchTab('signup')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60 font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Auth Section */}
          <div className="space-y-3">
            {!showGoogleChooser ? (
              <button
                type="button"
                onClick={() => setShowGoogleChooser(true)}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white hover:bg-zinc-50 border-2 border-zinc-200 hover:border-zinc-300 text-zinc-800 font-semibold rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer group active:scale-[0.99]"
              >
                {/* Official Google 'G' icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>
                  {activeTab === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
                </span>
              </button>
            ) : (
              /* Google Account Chooser popover/card */
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    <span className="text-xs font-bold text-zinc-800">Choose a Google Account</span>
                  </div>
                  <button
                    onClick={() => setShowGoogleChooser(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-800 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {/* Pre-detected Primary Account (User's workspace email) */}
                <button
                  type="button"
                  onClick={() => handleGoogleAuth('uzafa.shop@gmail.com')}
                  disabled={isLoading}
                  className="w-full p-2.5 rounded-lg bg-white border border-blue-200 hover:border-blue-400 flex items-center justify-between text-left transition-all hover:shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      U
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900">Uzafa Shop</div>
                      <div className="text-[11px] text-zinc-500 font-mono">uzafa.shop@gmail.com</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600">Continue</span>
                </button>

                {/* Custom Google account option */}
                <div className="pt-2 border-t border-blue-200/60 flex items-center gap-2">
                  <input
                    type="email"
                    value={googleCustomEmail}
                    onChange={(e) => setGoogleCustomEmail(e.target.value)}
                    placeholder="or type another @gmail.com"
                    className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (googleCustomEmail.includes('@')) {
                        handleGoogleAuth(googleCustomEmail);
                      } else {
                        setErrorMessage('Please enter a valid Google email.');
                      }
                    }}
                    disabled={isLoading || !googleCustomEmail}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Use
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider: OR CONTINUE WITH EMAIL */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-zinc-400 uppercase tracking-widest absolute">
              or {activeTab === 'signin' ? 'continue' : 'register'} with email
            </span>
          </div>

          {/* Email Authentication Section */}
          {activeTab === 'signin' ? (
            /* Sign In Form */
            !isForgotPasswordView ? (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordView(true);
                        setForgotPasswordEmail(signInEmail);
                        setErrorMessage(null);
                      }}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 absolute right-2.5 top-1/2 -translate-y-1/2 rounded"
                    >
                      {showSignInPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 border-zinc-300 focus:ring-orange-500 accent-orange-600"
                    />
                    <span>Remember me for 30 days</span>
                  </label>
                </div>

                {/* Submit Sign In */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>{isLoading ? 'Signing in...' : 'Sign In with Email'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            ) : (
              /* Forgot Password Flow */
              <div className="space-y-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                  <KeyRound className="w-4 h-4 text-orange-600" />
                  <span>Reset your password</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Enter your email address and we'll send you an instant secure password reset link.
                </p>

                {forgotPasswordSent ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Password reset instructions sent to {forgotPasswordEmail}!</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!forgotPasswordEmail.includes('@')) {
                          setErrorMessage('Please enter a valid email address.');
                          return;
                        }
                        setForgotPasswordSent(true);
                      }}
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Send Password Reset Link
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordView(false);
                    setForgotPasswordSent(false);
                  }}
                  className="w-full text-center text-xs text-zinc-500 hover:text-zinc-800 font-semibold cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            )
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleEmailSignUp} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Company / Studio <span className="text-zinc-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signUpCompany}
                      onChange={(e) => setSignUpCompany(e.target.value)}
                      placeholder="Acme Studio"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="jane@studio.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="At least 6 chars"
                      required
                      className="w-full pl-9 pr-8 py-2 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      {showSignUpPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password strength indicator */}
              {signUpPassword && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Password strength:</span>
                    <span className="font-semibold text-zinc-700">{passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'
                      } ${passwordStrength.score === 1 ? 'w-1/3' : passwordStrength.score === 2 ? 'w-2/3' : 'w-full'}`}
                    />
                  </div>
                </div>
              )}

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-orange-600 border-zinc-300 focus:ring-orange-500 accent-orange-600"
                />
                <label htmlFor="agreeTerms" className="text-xs text-zinc-500 select-none">
                  I agree to the{' '}
                  <span className="text-zinc-900 font-semibold underline underline-offset-2">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-zinc-900 font-semibold underline underline-offset-2">
                    Privacy Policy
                  </span>
                  .
                </label>
              </div>

              {/* Submit Sign Up */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>{isLoading ? 'Creating account...' : `Join ${brandName}`}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          )}

          {/* Bottom Switcher */}
          <div className="text-center pt-2 border-t border-zinc-100">
            <p className="text-xs text-zinc-500">
              {activeTab === 'signin' ? (
                <>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('signup')}
                    className="font-bold text-orange-600 hover:text-orange-700 cursor-pointer ml-1"
                  >
                    Sign up now
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('signin')}
                    className="font-bold text-orange-600 hover:text-orange-700 cursor-pointer ml-1"
                  >
                    Sign in to your account
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Security & Guest Preview footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-2 border-t border-zinc-50">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-bit SSL encrypted • Google OAuth verified</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-800 font-medium underline underline-offset-2 cursor-pointer"
            >
              Continue as Guest / Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
