import React, { useState, useEffect } from 'react';
import { defaultCmsContent } from './data/defaultCmsContent';
import { initialInvoices } from './data/initialInvoices';
import {
  BillingCycle,
  CmsContent,
  InvoiceData,
  PlanCurrency,
  SubscriptionPlanId,
  TestimonialItem,
} from './types';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { PricingSection } from './components/PricingSection';
import { PlansPageView } from './components/PlansPageView';
import { AboutSection } from './components/AboutSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { FaqSection } from './components/FaqSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { AddTestimonialModal } from './components/AddTestimonialModal';
import { CtaSection } from './components/CtaSection';
import { Footer } from './components/Footer';
import { InvoiceStudioView } from './components/InvoiceStudioView';
import { DashboardModal } from './components/DashboardModal';
import { EmailModal } from './components/EmailModal';
import { CmsAdminModal } from './components/CmsAdminModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { TermsPrivacyModal } from './components/TermsPrivacyModal';
import { SplashEntranceAnimation } from './components/SplashEntranceAnimation';
import { AuthWhiteScreenModal } from './components/AuthWhiteScreenModal';
import {
  SubscriptionCheckoutModal,
  InvoiceCheckoutPayload,
} from './components/SubscriptionCheckoutModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  saveInvoiceToFirestore,
  deleteInvoiceFromFirestore,
  subscribeToUserInvoices,
  subscribeToTestimonials,
  deleteTestimonialFromFirestore,
} from './services/firestoreService';
import { downloadInvoicePdf } from './utils/pdfExport';
import { calculateInvoiceMath } from './utils/invoiceCalculations';

const LOCAL_STORAGE_CMS_KEY = 'invobill_cms_data_v1';
const LOCAL_STORAGE_INVOICES_KEY = 'invobill_invoices_data_v1';
const LOCAL_STORAGE_ADMIN_AUTH_KEY = 'invobill_admin_auth_v1';

function AppContent() {
  const {
    currentUser,
    planEntitlements,
    isAuthReady,
    isAuthenticated,
    needsSignUpCompletion,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  } = useAuth();

  const [cms, setCms] = useState<CmsContent>(() => {
    try {
      const saved =
        localStorage.getItem(LOCAL_STORAGE_CMS_KEY) ||
        localStorage.getItem('billnest_cms_data_v1') ||
        localStorage.getItem('invoiceify_cms_data_v1') ||
        localStorage.getItem('ledgerly_cms_data_v1');
      if (saved) {
        const cleansedJson = saved
          .replace(/Invoiceify/g, 'Invobill')
          .replace(/invoiceify/g, 'invobill')
          .replace(/Ledgerly/g, 'Invobill')
          .replace(/ledgerly/g, 'invobill')
          .replace(/Billnest/g, 'Invobill')
          .replace(/billnest/g, 'invobill')
          .replace(/Billsnest/g, 'Invobill')
          .replace(/billsnest/g, 'invobill');
        const parsed: CmsContent = JSON.parse(cleansedJson);
        if (parsed.about?.stats?.[1]?.label === 'Locked features') {
          parsed.hero.eyebrow = defaultCmsContent.hero.eyebrow;
          parsed.about = defaultCmsContent.about;
          parsed.features.title = defaultCmsContent.features.title;
          parsed.features.subtitle = defaultCmsContent.features.subtitle;
          if (parsed.faqs?.items?.[0]) {
            parsed.faqs.items[0] = defaultCmsContent.faqs.items[0];
          }
        }
        return parsed;
      }
    } catch (err) {
      console.warn('Failed to load saved CMS data from localStorage:', err);
    }
    return defaultCmsContent;
  });

  const [invoices, setInvoices] = useState<InvoiceData[]>(() => {
    try {
      const saved =
        localStorage.getItem(LOCAL_STORAGE_INVOICES_KEY) ||
        localStorage.getItem('billnest_invoices_data_v1') ||
        localStorage.getItem('invoiceify_invoices_data_v1') ||
        localStorage.getItem('ledgerly_invoices_data_v1');
      if (saved) {
        const cleansedJson = saved
          .replace(/Invoiceify/g, 'Invobill')
          .replace(/invoiceify/g, 'invobill')
          .replace(/Ledgerly/g, 'Invobill')
          .replace(/ledgerly/g, 'invobill')
          .replace(/Billnest/g, 'Invobill')
          .replace(/billnest/g, 'invobill')
          .replace(/Billsnest/g, 'Invobill')
          .replace(/billsnest/g, 'invobill');
        const parsed: InvoiceData[] = JSON.parse(cleansedJson);
        return parsed;
      }
    } catch (err) {
      console.warn('Failed to load saved invoices from localStorage:', err);
    }
    return initialInvoices;
  });

  const [currentView, setCurrentView] = useState<'landing' | 'studio' | 'plans'>('landing');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    initialInvoices[0]?.id || 'inv-101'
  );

  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [cmsAdminOpen, setCmsAdminOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalMode, setEmailModalMode] = useState<'invoice' | 'reminder'>('invoice');
  const [adminAuthModalOpen, setAdminAuthModalOpen] = useState(false);
  const [termsPrivacyModalOpen, setTermsPrivacyModalOpen] = useState(false);
  const [termsPrivacyTab, setTermsPrivacyTab] = useState<'privacy' | 'terms'>('privacy');

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlanId>('pro');
  const [checkoutCycle, setCheckoutCycle] = useState<BillingCycle>('monthly');
  const [checkoutCurrency, setCheckoutCurrency] = useState<PlanCurrency>('INR');
  const [invoiceCheckoutPayload, setInvoiceCheckoutPayload] =
    useState<InvoiceCheckoutPayload | null>(null);
  const [addTestimonialModalOpen, setAddTestimonialModalOpen] = useState(false);
  const [firestoreTestimonials, setFirestoreTestimonials] = useState<TestimonialItem[]>([]);

  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_ADMIN_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Sync initial auth tab to signup when unauthenticated visitors arrive on /login or /signup
  useEffect(() => {
    if (isAuthReady && !isAuthenticated && !needsSignUpCompletion) {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      if (path === '/login' || window.location.hash === '#login') {
        openAuthModal('signin');
      } else {
        openAuthModal('signup');
      }
    }
  }, [isAuthReady, isAuthenticated, needsSignUpCompletion]);

  // Real-time Firestore synchronization for authenticated user's invoices
  useEffect(() => {
    if (currentUser?.id) {
      const unsubscribe = subscribeToUserInvoices(currentUser.id, (remoteInvoices) => {
        if (remoteInvoices && remoteInvoices.length > 0) {
          setInvoices(remoteInvoices);
          try {
            localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(remoteInvoices));
          } catch {}
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser?.id]);

  // Real-time Firestore subscription for public customer testimonials
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToTestimonials((remoteTestimonials) => {
        setFirestoreTestimonials(remoteTestimonials);
      });
    } catch (err) {
      console.warn('Firestore testimonials subscription error:', err);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleDeleteFirestoreTestimonial = async (testimonialId: string) => {
    try {
      await deleteTestimonialFromFirestore(testimonialId);
      setFirestoreTestimonials((prev) => prev.filter((item) => item.id !== testimonialId));
    } catch (err) {
      console.warn('Failed to delete testimonial:', err);
    }
  };

  // When auth succeeds, automatically open the Dashboard!
  const handleAuthSuccessRedirectDashboard = () => {
    closeAuthModal();
    setDashboardOpen(true);
  };

  // Handle CMS open request with security PIN protection
  const handleRequestOpenCms = () => {
    if (isAdminAuthenticated) {
      setCmsAdminOpen(true);
    } else {
      setAdminAuthModalOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    try {
      localStorage.setItem(LOCAL_STORAGE_ADMIN_AUTH_KEY, 'true');
    } catch {}
    setAdminAuthModalOpen(false);
    setCmsAdminOpen(true);
  };

  const handleLockAdmin = () => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_ADMIN_AUTH_KEY);
    } catch {}
    setCmsAdminOpen(false);
  };

  // Keyboard shortcut (Ctrl+Shift+A or Cmd+Shift+A) & URL Hash #admin listener for hidden owner access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        handleRequestOpenCms();
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        handleRequestOpenCms();
      } else if (window.location.hash === '#login') {
        openAuthModal('signin');
      } else if (window.location.hash === '#signup') {
        openAuthModal('signup');
      } else if (window.location.hash === '#dashboard') {
        setDashboardOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash === '#admin') {
      handleRequestOpenCms();
    } else if (window.location.hash === '#login') {
      openAuthModal('signin');
    } else if (window.location.hash === '#signup') {
      openAuthModal('signup');
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isAdminAuthenticated]);

  // Sitemap and Deep-Link URL Router
  useEffect(() => {
    const handleRouteFromUrl = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';

      if (path === '/login') {
        openAuthModal('signin');
      } else if (path === '/signup') {
        openAuthModal('signup');
      } else if (path === '/create' || path === '/studio') {
        setCurrentView('studio');
      } else if (path === '/dashboard') {
        setDashboardOpen(true);
      } else if (path === '/privacy') {
        setTermsPrivacyTab('privacy');
        setTermsPrivacyModalOpen(true);
      } else if (path === '/terms') {
        setTermsPrivacyTab('terms');
        setTermsPrivacyModalOpen(true);
      } else if (path === '/features' || path === '/templates') {
        setCurrentView('landing');
        setTimeout(() => {
          document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else if (path === '/how-it-works') {
        setCurrentView('landing');
        setTimeout(() => {
          document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else if (path === '/about') {
        setCurrentView('landing');
        setTimeout(() => {
          document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else if (path === '/faq') {
        setCurrentView('landing');
        setTimeout(() => {
          document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else if (path === '/plans') {
        setCurrentView('plans');
      } else if (path === '/pricing') {
        setCurrentView('landing');
        setTimeout(() => {
          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    };

    handleRouteFromUrl();
    window.addEventListener('popstate', handleRouteFromUrl);
    return () => window.removeEventListener('popstate', handleRouteFromUrl);
  }, []);

  // Synchronize browser tab title and Google Search Console meta tag with CMS brand settings
  useEffect(() => {
    if (cms.brand?.brandName) {
      document.title = `${cms.brand.brandName} — ${
        cms.brand.tagline || 'Invoices, paid faster'
      }`;
    }

    if (cms.brand?.googleSiteVerification) {
      let meta = document.querySelector('meta[name="google-site-verification"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'google-site-verification');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', cms.brand.googleSiteVerification);
    }
  }, [cms.brand]);

  // Persist invoices to localStorage and Firestore
  const saveInvoicesToStorage = (updatedList: InvoiceData[], changedInvoice?: InvoiceData) => {
    setInvoices(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.error('Failed to save invoices to localStorage:', err);
    }
    if (currentUser?.id && changedInvoice) {
      saveInvoiceToFirestore(currentUser.id, changedInvoice).catch((e) =>
        console.warn('Firestore invoice sync error:', e)
      );
    }
  };

  const handleSaveInvoice = (updatedInvoice: InvoiceData) => {
    const existingIndex = invoices.findIndex(
      (i) => i.id === updatedInvoice.id || i.invoiceNumber === updatedInvoice.invoiceNumber
    );
    let updatedList: InvoiceData[];
    if (existingIndex >= 0) {
      updatedList = [...invoices];
      updatedList[existingIndex] = updatedInvoice;
    } else {
      updatedList = [updatedInvoice, ...invoices];
    }
    saveInvoicesToStorage(updatedList, updatedInvoice);
    setSelectedInvoiceId(updatedInvoice.id || updatedInvoice.invoiceNumber);
  };

  const handleUpdateInvoiceStatus = (id: string, newStatus: InvoiceData['status']) => {
    let updatedTarget: InvoiceData | undefined;
    const updatedList = invoices.map((inv) => {
      if (inv.id === id || inv.invoiceNumber === id) {
        updatedTarget = { ...inv, status: newStatus };
        return updatedTarget;
      }
      return inv;
    });
    saveInvoicesToStorage(updatedList, updatedTarget);
  };

  const handleDeleteInvoice = (id: string) => {
    const updatedList = invoices.filter(
      (inv) => inv.id !== id && inv.invoiceNumber !== id
    );
    saveInvoicesToStorage(updatedList);
    if (currentUser?.id) {
      deleteInvoiceFromFirestore(currentUser.id, id).catch((e) =>
        console.warn('Firestore invoice delete error:', e)
      );
    }
    if (updatedList.length > 0) {
      setSelectedInvoiceId(updatedList[0].id || updatedList[0].invoiceNumber);
    } else {
      handleCreateNewInvoice();
    }
  };

  const handleDuplicateInvoice = (invoice: InvoiceData) => {
    const newInvoice: InvoiceData = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-00${Math.floor(40 + Math.random() * 50)}`,
      status: 'Draft',
      clientName: `${invoice.clientName} (Copy)`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    };
    saveInvoicesToStorage([newInvoice, ...invoices], newInvoice);
    setSelectedInvoiceId(newInvoice.id);
    setCurrentView('studio');
  };

  const handleSelectInvoiceForEdit = (invoice: InvoiceData) => {
    setSelectedInvoiceId(invoice.id || invoice.invoiceNumber);
    setDashboardOpen(false);
    setCurrentView('studio');
  };

  const handleOpenUpgrade = (
    plan: SubscriptionPlanId = 'pro',
    cycle: BillingCycle = 'monthly',
    currency: PlanCurrency = 'INR'
  ) => {
    setInvoiceCheckoutPayload(null);
    setCheckoutPlan(plan === 'free' ? 'pro' : plan);
    setCheckoutCycle(cycle);
    setCheckoutCurrency(currency);
    setCheckoutModalOpen(true);
  };

  const handlePayInvoiceRazorpay = (inv: InvoiceData) => {
    const { grandTotal } = calculateInvoiceMath(inv);
    setInvoiceCheckoutPayload({
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName,
      clientEmail: inv.clientEmail,
      amountMajor: grandTotal,
      currency: inv.currency === '$' ? 'USD' : 'INR',
      businessName: inv.businessName || cms.brand.brandName || 'Invobill',
      onPaymentVerified: () => {
        handleUpdateInvoiceStatus(inv.id || inv.invoiceNumber, 'Paid');
      },
    });
    setCheckoutModalOpen(true);
  };

  const handleCreateNewInvoice = () => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    const monthlyCount = invoices.filter((inv) =>
      (inv.issueDate || '').startsWith(currentMonthPrefix)
    ).length;

    if (
      planEntitlements.maxInvoicesPerMonth !== null &&
      monthlyCount >= planEntitlements.maxInvoicesPerMonth
    ) {
      setDashboardOpen(false);
      handleOpenUpgrade('pro');
      return;
    }

    // Default to configured brand name and professional billing email rather than personal Google account
    const businessTitle = cms.brand.brandName || 'Invobill Studio';
    const businessEmail = cms.brand.contactEmail || 'billing@invobill.app';

    const newInv: InvoiceData = {
      id: `inv-${Date.now()}`,
      businessName: businessTitle,
      businessEmail: businessEmail,
      businessLogoLetter: cms.brand.logoLetter || businessTitle.charAt(0).toUpperCase() || 'I',
      clientName: 'New Client',
      clientEmail: 'client@example.com',
      invoiceNumber: `INV-00${Math.floor(50 + Math.random() * 45)}`,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      currency: '₹',
      status: 'Draft',
      taxRate: 5,
      taxType: 'add',
      discountAmount: 0,
      discountType: 'amount',
      themeColor: cms.brand.primaryColor || '#FF5238',
      templateStyle: planEntitlements.allowedTemplates.includes('Modern')
        ? 'Modern'
        : 'Minimal',
      hideWatermark: planEntitlements.removeWatermarkAllowed,
      notes: 'Thank you for your business.',
      bankDetails: cms.brand.defaultBankDetails || {
        bankName: 'HDFC Bank Ltd',
        accountName: businessTitle,
        accountNumber: '50200084729103',
        routingCode: 'HDFC0001234',
        iban: 'IN50HDFC00012345020008472',
        upiId: 'invobill@hdfcbank',
        paymentInstructions: 'Please specify invoice number in wire transfer reference.',
      },
      items: [
        { id: `item-${Date.now()}`, description: 'Web design & Development', quantity: 1, rate: 25000 },
      ],
    };

    saveInvoicesToStorage([newInv, ...invoices], newInv);
    setSelectedInvoiceId(newInv.id);
    setDashboardOpen(false);
    setCurrentView('studio');
  };

  const handleOpenEmailModal = (invoice: InvoiceData) => {
    setSelectedInvoiceId(invoice.id || invoice.invoiceNumber);
    setEmailModalMode('invoice');
    setEmailModalOpen(true);
  };

  const handleSendReminderModal = (invoice: InvoiceData) => {
    setSelectedInvoiceId(invoice.id || invoice.invoiceNumber);
    setEmailModalMode('reminder');
    setEmailModalOpen(true);
  };

  const handleEmailSuccess = (invoiceId: string) => {
    const target = invoices.find(
      (inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId
    );
    if (emailModalMode === 'invoice' || target?.status === 'Draft') {
      handleUpdateInvoiceStatus(invoiceId, 'Sent');
    }
  };

  const handleDownloadPdf = (invoice: InvoiceData) => {
    downloadInvoicePdf(invoice, cms.brand.brandName);
  };

  const handleSaveCms = (updated: CmsContent) => {
    setCms(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CMS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save CMS state to localStorage:', err);
    }
  };

  const handleResetCms = () => {
    setCms(defaultCmsContent);
    try {
      localStorage.removeItem(LOCAL_STORAGE_CMS_KEY);
    } catch (err) {
      console.error('Failed to clear CMS localStorage:', err);
    }
  };

  const activeInvoice =
    invoices.find((i) => i.id === selectedInvoiceId || i.invoiceNumber === selectedInvoiceId) ||
    invoices[0];

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-6 text-zinc-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-orange-500/20 animate-pulse">
            {cms.brand?.logoLetter || 'I'}
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold tracking-tight text-zinc-900">
              {cms.brand?.brandName || 'Invobill'}
            </p>
            <p className="text-xs font-medium text-zinc-500">
              Checking your session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mandatory Entry Gate: new users must sign up with Google first before entering the site
  if (!isAuthenticated || needsSignUpCompletion) {
    return (
      <AuthWhiteScreenModal
        isOpen={true}
        required={true}
        onClose={closeAuthModal}
        onSuccessRedirectDashboard={handleAuthSuccessRedirectDashboard}
        brandName={cms.brand?.brandName || 'Invobill'}
        tagline={cms.brand?.tagline || 'Invoices, paid faster'}
        logoLetter={cms.brand?.logoLetter || 'I'}
      />
    );
  }

  return (
    <div
      className="min-h-screen text-[var(--foreground)] bg-[var(--background)] selection:bg-[var(--accent)] selection:text-[var(--primary)]"
    >
      {/* Full-Screen Website Entrance Splash Intro Animation */}
      <SplashEntranceAnimation
        brandName={cms.brand.brandName || 'Invobill'}
        tagline={cms.brand.tagline || 'Invoices, paid faster'}
      />

      {/* Universal Top Header Bar (Landing Mode) */}
      {currentView === 'landing' && (
        <Header
          brand={cms.brand}
          onOpenCms={handleRequestOpenCms}
          onOpenGenerator={handleCreateNewInvoice}
          onOpenDashboard={() => setDashboardOpen(true)}
          onOpenUpgrade={(plan) => handleOpenUpgrade(plan)}
          onOpenPlans={() => setCurrentView('plans')}
          isAdminOpen={cmsAdminOpen}
          isAdminAuthenticated={isAdminAuthenticated}
          onLockAdmin={handleLockAdmin}
        />
      )}

      {currentView === 'studio' ? (
        /* Full Screen Dedicated Invoice Studio Page */
        <InvoiceStudioView
          brand={cms.brand}
          invoices={invoices}
          selectedInvoiceId={selectedInvoiceId}
          onBackToLanding={() => setCurrentView('landing')}
          onSaveInvoice={handleSaveInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onSelectInvoiceById={(id) => setSelectedInvoiceId(id)}
          onCreateNew={handleCreateNewInvoice}
          onOpenEmail={handleOpenEmailModal}
          onOpenDashboard={() => setDashboardOpen(true)}
          onOpenUpgrade={(plan) => handleOpenUpgrade(plan)}
          onPayInvoiceRazorpay={handlePayInvoiceRazorpay}
        />
      ) : currentView === 'plans' ? (
        /* Dedicated Plans & Comparison Page */
        <PlansPageView
          brand={cms.brand}
          onBackToLanding={() => setCurrentView('landing')}
          onSelectPlan={(planId, cycle, currency) =>
            handleOpenUpgrade(planId, cycle, currency)
          }
          onOpenGenerator={handleCreateNewInvoice}
          onOpenDashboard={() => setDashboardOpen(true)}
        />
      ) : (
        /* Landing Page View */
        <>
          <HeroSection
            hero={cms.hero}
            brand={cms.brand}
            onOpenGenerator={handleCreateNewInvoice}
            onOpenDashboard={() => setDashboardOpen(true)}
            onOpenCms={handleRequestOpenCms}
          />

          <FeaturesSection
            features={cms.features}
            primaryColor={cms.brand.primaryColor}
          />

          <PricingSection
            onSelectPlan={(planId, cycle, currency) =>
              handleOpenUpgrade(planId, cycle, currency)
            }
            onOpenGenerator={handleCreateNewInvoice}
            onOpenPlansPage={() => setCurrentView('plans')}
          />

          <AboutSection
            about={cms.about}
            brandName={cms.brand?.brandName || 'Invobill'}
            primaryColor={cms.brand.primaryColor}
          />

          <HowItWorksSection
            howItWorks={cms.howItWorks}
            primaryColor={cms.brand.primaryColor}
          />

          <FaqSection
            faqs={cms.faqs}
            primaryColor={cms.brand.primaryColor}
          />

          <TestimonialsSection
            testimonials={cms.testimonials}
            firestoreTestimonials={firestoreTestimonials}
            primaryColor={cms.brand.primaryColor}
            onOpenAddTestimonial={() => setAddTestimonialModalOpen(true)}
            onDeleteTestimonial={handleDeleteFirestoreTestimonial}
          />

          <CtaSection
            cta={cms.cta}
            brand={cms.brand}
            onOpenGenerator={handleCreateNewInvoice}
          />

          <Footer
            brand={cms.brand}
            onOpenCms={handleRequestOpenCms}
            onOpenGenerator={handleCreateNewInvoice}
            onOpenDashboard={() => setDashboardOpen(true)}
            onOpenPlans={() => setCurrentView('plans')}
            onOpenPrivacy={() => {
              setTermsPrivacyTab('privacy');
              setTermsPrivacyModalOpen(true);
            }}
            onOpenTerms={() => {
              setTermsPrivacyTab('terms');
              setTermsPrivacyModalOpen(true);
            }}
            isAdminAuthenticated={isAdminAuthenticated}
          />
        </>
      )}

      {/* Account Switcher Modal (Post-Authentication) */}
      <AuthWhiteScreenModal
        isOpen={isAuthModalOpen}
        required={false}
        onClose={closeAuthModal}
        onSuccessRedirectDashboard={handleAuthSuccessRedirectDashboard}
        brandName={cms.brand?.brandName || 'Invobill'}
        tagline={cms.brand?.tagline || 'Invoices, paid faster'}
        logoLetter={cms.brand?.logoLetter || 'I'}
      />

      {/* Terms of Service & Privacy Policy Modal */}
      <TermsPrivacyModal
        isOpen={termsPrivacyModalOpen}
        onClose={() => setTermsPrivacyModalOpen(false)}
        initialTab={termsPrivacyTab}
        brandName={cms.brand?.brandName || 'Invobill'}
        contactEmail={cms.brand?.contactEmail || 'hello@invobill.app'}
      />

      {/* Live Invoices Dashboard Modal */}
      <DashboardModal
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        invoices={invoices}
        brand={cms.brand}
        onSelectInvoice={handleSelectInvoiceForEdit}
        onCreateNewInvoice={handleCreateNewInvoice}
        onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
        onDeleteInvoice={handleDeleteInvoice}
        onDuplicateInvoice={handleDuplicateInvoice}
        onDownloadPdf={handleDownloadPdf}
        onEmailInvoice={handleOpenEmailModal}
        onSendReminder={handleSendReminderModal}
        onOpenUpgrade={(plan) => handleOpenUpgrade(plan)}
      />

      {/* Razorpay Subscription & Invoice Checkout Modal */}
      <SubscriptionCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => {
          setCheckoutModalOpen(false);
          setInvoiceCheckoutPayload(null);
        }}
        initialPlan={checkoutPlan}
        initialCycle={checkoutCycle}
        initialCurrency={checkoutCurrency}
        invoiceCheckout={invoiceCheckoutPayload}
      />

      {/* Email Invoice / Payment Reminder Share Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        invoice={activeInvoice || null}
        brand={cms.brand}
        mode={emailModalMode}
        onSendSuccess={handleEmailSuccess}
      />

      {/* Master Admin PIN Verification Gate Modal */}
      <AdminAuthModal
        isOpen={adminAuthModalOpen}
        onClose={() => setAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
        correctPin={cms.brand.adminPin || '1234'}
        brandName={cms.brand.brandName || 'Invobill'}
      />

      {/* Add Testimonial Modal (Firestore Backed) */}
      <AddTestimonialModal
        isOpen={addTestimonialModalOpen}
        onClose={() => setAddTestimonialModalOpen(false)}
        onSubmitted={(created) => {
          setFirestoreTestimonials((prev) => [
            created,
            ...prev.filter((item) => item.id !== created.id),
          ]);
        }}
      />

      {/* Protected Live CMS Admin Modal */}
      <CmsAdminModal
        cms={cms}
        isOpen={cmsAdminOpen}
        onClose={() => setCmsAdminOpen(false)}
        onSave={handleSaveCms}
        onReset={handleResetCms}
        onLockAdmin={handleLockAdmin}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
