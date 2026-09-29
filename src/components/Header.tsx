import React, { useState, useRef, useEffect } from 'react';
import { BrandSettings } from '../types';
import { SlidersHorizontal, Sparkles, Menu, X, ArrowRight, Lock, Unlock, LogOut, User, ChevronDown, CheckCircle, LayoutDashboard } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { MorphingMascot } from './MorphingMascot';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  brand: BrandSettings;
  onOpenCms: () => void;
  onOpenGenerator: () => void;
  onOpenDashboard: () => void;
  isAdminOpen: boolean;
  isAdminAuthenticated: boolean;
  onLockAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brand,
  onOpenCms,
  onOpenGenerator,
  onOpenDashboard,
  isAdminOpen,
  isAdminAuthenticated,
  onLockAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const { currentUser, isAuthenticated, signOut, openAuthModal } = useAuth();
  const showAdminPublicly = brand.showAdminButtonInHeader ?? false;

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[var(--background)]/85 backdrop-blur-xl border-b border-[var(--border)] transition-all">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo with Enchanted Receipt Icon & Tagline */}
        <a href="#" className="cursor-pointer">
          <BrandLogo
            brandName={brand.brandName || 'Billnest'}
            tagline={brand.tagline || 'Invoices, paid faster'}
            size="md"
            showTagline={true}
          />
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7">
          <a
            href="#features"
            className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            How it works
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            FAQ
          </a>
          <button
            onClick={onOpenDashboard}
            className="text-sm font-semibold text-[var(--primary)] hover:opacity-80 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Dashboard</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-500/10 text-orange-600 rounded-full">
              Live
            </span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {/* User Account State / Sign In Button */}
          {isAuthenticated && currentUser ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2.5 pr-2 bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] rounded-full text-xs font-semibold text-[var(--foreground)] transition-all cursor-pointer shadow-xs"
                title="Account Settings"
              >
                {/* User avatar or monogram */}
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-zinc-200"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-[11px] flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate text-[11px] font-bold">
                  {currentUser.name.split(' ')[0]}
                </span>
                {currentUser.provider === 'google' ? (
                  <span className="w-3.5 h-3.5 flex items-center justify-center" title="Google Connected">
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  </span>
                ) : null}
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Account Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
                  <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono truncate">
                      {currentUser.email}
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1 pt-0.5">
                      <span>Auth:</span>
                      <span className="font-semibold capitalize text-zinc-700 dark:text-zinc-300">
                        {currentUser.provider === 'google' ? 'Google Account' : 'Email & Password'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenDashboard();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-orange-500" />
                      <span>Open Invoices Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        openAuthModal('signin');
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span>Switch / Link Account</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-full bg-white text-zinc-800 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              <User className="w-3.5 h-3.5 text-orange-600" />
              <span>Sign In</span>
            </button>
          )}

          {/* Admin Authenticated Badge & CMS Button */}
          {isAdminAuthenticated ? (
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full p-1 pl-3 shadow-xs">
              <button
                onClick={onOpenCms}
                className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                title="Open CMS Editor"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Admin CMS</span>
              </button>
              <button
                onClick={onLockAdmin}
                className="p-1 text-orange-600 hover:text-rose-600 hover:bg-orange-500/20 rounded-full transition-colors cursor-pointer"
                title="Lock / Log Out of Admin Mode"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            showAdminPublicly && (
              <button
                onClick={onOpenCms}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                  isAdminOpen
                    ? 'bg-[var(--foreground)] text-[var(--card)] border-[var(--foreground)]'
                    : 'bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
                title="Owner Admin Access (Requires PIN)"
              >
                <Lock className="w-3.5 h-3.5 text-orange-500" />
                <span>CMS Admin</span>
              </button>
            )
          )}

          {/* Interactive Micro Mascot in Header */}
          <div className="hidden lg:flex items-center" title="Billnest Animated Mascot">
            <MorphingMascot mode="cycle" size="custom" customSizeClass="w-7 h-7" interactive={true} />
          </div>

          {/* Signature Dark Pill Button with Circular Arrow */}
          <button
            onClick={onOpenGenerator}
            className="btn-pill-dark inline-flex items-center gap-2 pl-4 pr-2.5 py-2 text-xs font-bold cursor-pointer group"
          >
            <span>Create Invoice</span>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
              <ArrowRight className="w-3 h-3" />
            </span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          {(isAdminAuthenticated || showAdminPublicly) && (
            <button
              onClick={onOpenCms}
              className="px-2.5 py-1 text-xs font-semibold bg-orange-500/10 border border-orange-500/30 text-orange-600 rounded-full flex items-center gap-1"
            >
              {isAdminAuthenticated ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span>CMS</span>
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[var(--border)] bg-[var(--card)] px-6 py-4 space-y-3 shadow-lg">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[var(--foreground)] py-1.5"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[var(--foreground)] py-1.5"
          >
            How it works
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[var(--foreground)] py-1.5"
          >
            FAQ
          </a>
          <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
            {isAuthenticated && currentUser ? (
              <div className="p-3 bg-[var(--muted)]/50 rounded-xl border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2.5">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-[var(--foreground)] truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)] truncate font-mono">{currentUser.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenDashboard();
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-[var(--card)] border border-[var(--border)] text-xs font-semibold rounded-lg text-center"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="py-1.5 px-2.5 bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('signin');
                }}
                className="w-full py-2.5 bg-white text-zinc-900 border border-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs"
              >
                <User className="w-4 h-4 text-orange-600" />
                <span>Sign In / Create Account</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenGenerator();
              }}
              className="btn-pill-dark w-full justify-center inline-flex items-center gap-2 py-2.5 text-xs font-bold"
            >
              <span>Create Invoice Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCms();
              }}
              className="w-full py-2.5 text-center text-xs font-semibold text-orange-600 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center justify-center gap-1.5"
            >
              {isAdminAuthenticated ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isAdminAuthenticated ? 'Open CMS Admin' : 'Owner Admin Login'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
