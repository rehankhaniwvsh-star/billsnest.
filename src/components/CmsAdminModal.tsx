import React, { useState, useEffect } from 'react';
import { CmsContent, FeatureItem, FaqItem, StepItem } from '../types';
import {
  X,
  Save,
  RotateCcw,
  Download,
  Upload,
  Sparkles,
  Plus,
  Trash2,
  Sliders,
  Type,
  Layout,
  HelpCircle,
  BarChart,
  Quote,
  Palette,
  Check,
  Bot,
  Lock,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Globe,
  Copy,
  ExternalLink,
  FileCode,
  CheckCheck,
  Search,
  ShieldCheck,
  Activity,
  Gauge,
  Zap,
  RefreshCw,
  SlidersHorizontal,
  AlertCircle,
  Key,
  Timer,
  Clock,
  CheckCircle2,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { BrandLogo, ReceiptLogoIcon } from './BrandLogo';
import {
  RateLimitConfigSchema,
  GenerateCopySchema,
  FullCmsContentSchema,
  validateStrict,
  ValidationErrorDetail,
} from '../schemas/strictSchemas';
import { validateAndParseCmsJsonFile } from '../utils/fileUploadValidator';

interface CmsAdminModalProps {
  cms: CmsContent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CmsContent) => void;
  onReset: () => void;
  onLockAdmin?: () => void;
}

export const CmsAdminModal: React.FC<CmsAdminModalProps> = ({
  cms,
  isOpen,
  onClose,
  onSave,
  onReset,
  onLockAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'brand'
    | 'hero'
    | 'features'
    | 'howItWorks'
    | 'about'
    | 'faqs'
    | 'testimonials'
    | 'ai'
    | 'seo'
    | 'security'
  >('brand');

  const [formData, setFormData] = useState<CmsContent>(cms);
  const [saveNotification, setSaveNotification] = useState(false);
  const [copiedSitemap, setCopiedSitemap] = useState(false);

  // Gemini AI Copywriting State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiContentType, setAiContentType] = useState('Hero Headline');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiError, setAiError] = useState('');

  // -----------------------------------------------------------------
  // RATE LIMITING & SECURITY STATE
  // -----------------------------------------------------------------
  const [rateLimitConfig, setRateLimitConfig] = useState({
    public: {
      windowMs: 60000,
      maxRequests: 100,
    },
    authenticatedUser: {
      windowMs: 60000,
      maxRequests: 300,
    },
    authRoutes: {
      ipWindowMs: 900000,
      ipMaxRequests: 20,
      accountMaxAttempts: 5,
      baseBackoffMs: 1000,
      maxBackoffMs: 300000,
      backoffFactor: 2,
      failureDecayMs: 1800000,
    },
  });

  const [rateLimitMetrics, setRateLimitMetrics] = useState<any>(null);
  const [rateLimitSaving, setRateLimitSaving] = useState(false);
  const [rateLimitSaveMsg, setRateLimitSaveMsg] = useState('');

  // Rate Limiter Simulator State
  const [simEmail, setSimEmail] = useState('developer@example.com');
  const [simPassword, setSimPassword] = useState('wrong-pass');
  const [simLogs, setSimLogs] = useState<
    Array<{
      time: string;
      status: number;
      action: string;
      message: string;
      backoffDelay?: number;
      retryAfter?: number;
      limit?: string;
      remaining?: string;
    }>
  >([]);
  const [simLoading, setSimLoading] = useState(false);

  // Schema Validation Playground State
  const [schemaTestEndpoint, setSchemaTestEndpoint] = useState<string>('/api/auth/login');
  const [schemaTestPayload, setSchemaTestPayload] = useState<string>(
    JSON.stringify({ email: 'bad-email-format', password: '123' }, null, 2)
  );
  const [schemaTestResult, setSchemaTestResult] = useState<any>(null);
  const [schemaTestLoading, setSchemaTestLoading] = useState(false);

  const [cmsValidationErrors, setCmsValidationErrors] = useState<ValidationErrorDetail[]>([]);

  const fetchRateLimits = async () => {
    try {
      const res = await fetch('/api/admin/rate-limit/status', {
        headers: { Accept: 'application/json' },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.metrics) {
          setRateLimitMetrics(data.metrics);
          if (data.metrics.config) {
            setRateLimitConfig(data.metrics.config);
          }
        }
      } else if (!rateLimitMetrics) {
        // Fallback default metrics when backend is initializing or in static mode
        setRateLimitMetrics({
          totalRequestsChecked: 0,
          totalThrottled: 0,
          throttledAuthIp: 0,
          throttledAuthAccount: 0,
          throttledPublic: 0,
          throttledAuthUser: 0,
          startTime: Date.now(),
          uptimeSeconds: 1,
          config: rateLimitConfig,
        });
      }
    } catch {
      // Gracefully set fallback metrics without throwing unhandled exceptions
      if (!rateLimitMetrics) {
        setRateLimitMetrics({
          totalRequestsChecked: 0,
          totalThrottled: 0,
          throttledAuthIp: 0,
          throttledAuthAccount: 0,
          throttledPublic: 0,
          throttledAuthUser: 0,
          startTime: Date.now(),
          uptimeSeconds: 1,
          config: rateLimitConfig,
        });
      }
    }
  };

  useEffect(() => {
    if (isOpen && (activeTab === 'security' || !rateLimitMetrics)) {
      fetchRateLimits();
    }
  }, [isOpen, activeTab]);

  const handleSaveRateLimits = async () => {
    setRateLimitSaving(true);
    setRateLimitSaveMsg('');

    // Strict schema validation check
    const validation = validateStrict(RateLimitConfigSchema, { config: rateLimitConfig });
    if (!validation.success) {
      setRateLimitSaveMsg(`Schema Rejected: ${validation.error}`);
      setRateLimitSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/rate-limit/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(validation.data),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setRateLimitSaveMsg('Rate limiting thresholds strictly validated and updated successfully!');
          fetchRateLimits();
          setTimeout(() => setRateLimitSaveMsg(''), 3500);
        } else {
          setRateLimitSaveMsg(data.error || 'Failed to update thresholds.');
        }
      } else {
        setRateLimitSaveMsg('Unable to save settings: server returned an unexpected response.');
      }
    } catch {
      setRateLimitSaveMsg('An error occurred while saving rate limit configuration. Please try again.');
    } finally {
      setRateLimitSaving(false);
    }
  };

  const handleResetRateLimitStores = async () => {
    if (!confirm('Are you sure you want to reset all rate limit stores and backoff penalties?')) return;
    try {
      const res = await fetch('/api/admin/rate-limit/reset', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        alert('All rate-limiting caches and backoff states cleared!');
        fetchRateLimits();
        setSimLogs([]);
      } else {
        alert('All rate-limiting caches reset locally.');
        fetchRateLimits();
      }
    } catch (e) {
      alert('Failed to reset rate limiter stores.');
    }
  };

  // Run Auth Rate Limiter Test Simulator
  const handleSimulateAuth = async (isCorrectPassword = false) => {
    setSimLoading(true);
    const timeStr = new Date().toLocaleTimeString();
    try {
      const targetPass = isCorrectPassword ? 'admin1234' : simPassword;
      const targetEmail = isCorrectPassword ? 'admin@invobill.app' : simEmail;

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          password: targetPass,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : {};
      const limitHdr = res.headers.get('x-ratelimit-limit') || '-';
      const remHdr = res.headers.get('x-ratelimit-remaining') || '-';
      const retryHdr = res.headers.get('retry-after');

      setSimLogs((prev) => [
        {
          time: timeStr,
          status: res.status,
          action: isCorrectPassword ? 'Success Login' : 'Failed Login Attempt',
          message: data.error || data.message || (res.ok ? 'Authentication Succeeded' : 'Request failed'),
          backoffDelay: data.backoffDelayMs,
          retryAfter: retryHdr ? parseInt(retryHdr, 10) : data.retryAfterSeconds,
          limit: limitHdr,
          remaining: remHdr,
        },
        ...prev.slice(0, 19),
      ]);

      fetchRateLimits();
    } catch (err: any) {
      setSimLogs((prev) => [
        {
          time: timeStr,
          status: 500,
          action: 'Network Failure',
          message: err?.message || 'Request failed',
        },
        ...prev.slice(0, 19),
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  // Run Burst Traffic Test on Public Endpoint
  const handleSimulateBurst = async () => {
    setSimLoading(true);
    const timeStr = new Date().toLocaleTimeString();
    try {
      let passed = 0;
      let blocked = 0;
      for (let i = 0; i < 5; i++) {
        const res = await fetch('/api/health');
        if (res.ok) passed++;
        else blocked++;
      }
      setSimLogs((prev) => [
        {
          time: timeStr,
          status: blocked > 0 ? 429 : 200,
          action: 'Public Burst (5 reqs)',
          message: `Burst test completed: ${passed} passed, ${blocked} throttled (429).`,
        },
        ...prev.slice(0, 19),
      ]);
      fetchRateLimits();
    } finally {
      setSimLoading(false);
    }
  };

  // Run Interactive Schema Validation Test on selected endpoint
  const handleRunSchemaTest = async () => {
    setSchemaTestLoading(true);
    setSchemaTestResult(null);

    let parsedBody: any;
    try {
      parsedBody = JSON.parse(schemaTestPayload);
    } catch (e: any) {
      setSchemaTestResult({
        status: 400,
        statusText: 'Bad Request',
        success: false,
        error: `Client-side JSON syntax error: ${e.message}`,
        details: [{ field: 'root', message: 'Malformed JSON payload' }],
      });
      setSchemaTestLoading(false);
      return;
    }

    try {
      const res = await fetch(schemaTestEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(parsedBody),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = {};
        }
      } else {
        data = { error: `Server responded with non-JSON content: ${res.statusText || res.status}` };
      }

      setSchemaTestResult({
        status: res.status,
        statusText: res.statusText,
        ...data,
      });
    } catch {
      setSchemaTestResult({
        status: 500,
        statusText: 'Internal Server Error',
        success: false,
        error: 'Network request failed while testing schema endpoint.',
      });
    } finally {
      setSchemaTestLoading(false);
    }
  };

  const handleSelectPresetSchemaTest = (type: 'valid_login' | 'invalid_email' | 'short_password' | 'invalid_pin' | 'invalid_invoice' | 'valid_invoice') => {
    if (type === 'valid_login') {
      setSchemaTestEndpoint('/api/auth/login');
      setSchemaTestPayload(
        JSON.stringify({ email: 'admin@invobill.app', password: 'admin1234' }, null, 2)
      );
    } else if (type === 'invalid_email') {
      setSchemaTestEndpoint('/api/auth/login');
      setSchemaTestPayload(
        JSON.stringify({ email: 'not-an-email-address', password: 'validpassword123' }, null, 2)
      );
    } else if (type === 'short_password') {
      setSchemaTestEndpoint('/api/auth/signup');
      setSchemaTestPayload(
        JSON.stringify({ email: 'newuser@example.com', password: '123', name: 'A' }, null, 2)
      );
    } else if (type === 'invalid_pin') {
      setSchemaTestEndpoint('/api/auth/verify-pin');
      setSchemaTestPayload(
        JSON.stringify({ pin: 'abc', account: 'admin' }, null, 2)
      );
    } else if (type === 'invalid_invoice') {
      setSchemaTestEndpoint('/api/invoices/save');
      setSchemaTestPayload(
        JSON.stringify(
          {
            invoice: {
              invoiceNumber: 'INV-1234',
              clientName: '',
              clientEmail: 'bad-email',
              taxRate: -15,
              discountAmount: -50,
              items: [],
            },
          },
          null,
          2
        )
      );
    } else if (type === 'valid_invoice') {
      setSchemaTestEndpoint('/api/invoices/save');
      setSchemaTestPayload(
        JSON.stringify(
          {
            invoice: {
              invoiceNumber: 'INV-9901',
              businessName: 'Invobill Studio',
              businessEmail: 'billing@invobill.app',
              clientName: 'Acme Corp',
              clientEmail: 'finance@acmeworks.com',
              issueDate: '2026-08-01',
              dueDate: '2026-08-15',
              currency: '₹',
              status: 'Draft',
              taxRate: 5,
              discountAmount: 0,
              items: [
                {
                  id: 'item-1',
                  description: 'Design System Engineering',
                  quantity: 1,
                  rate: 25000,
                },
              ],
            },
          },
          null,
          2
        )
      );
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    setCmsValidationErrors([]);

    // Strict schema check on full CMS payload
    const validation = validateStrict(FullCmsContentSchema, formData);
    if (!validation.success) {
      setCmsValidationErrors(validation.details);
      alert(`CMS settings rejected by strict schema:\n${validation.error}`);
      return;
    }

    const updated = {
      ...validation.data,
      lastUpdated: new Date().toISOString(),
    };
    onSave(updated);
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 2500);
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `invobill_cms_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input element value immediately so re-uploading the same file triggers change
    const targetElement = e.target;

    try {
      // Complete type, size, MIME, executable pattern, JSON syntax, and strict schema validation
      const result = await validateAndParseCmsJsonFile(file);

      if (!result.valid || !result.data) {
        alert(`File Upload Rejected:\n${result.error || 'Invalid file format or structure.'}`);
        return;
      }

      // Safely apply parsed data to in-memory state
      setFormData(result.data);
      alert('CMS configuration verified and imported successfully.');
    } catch {
      alert('An unexpected error occurred while processing the uploaded file. Please verify the file format and try again.');
    } finally {
      targetElement.value = '';
    }
  };

  // Call Gemini Server Endpoint (Strictly Validated with Sanitized Error Handling)
  const handleGenerateAiCopy = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiError('');
    setAiResult('');

    const payload = {
      prompt: aiPrompt.trim(),
      contentType: aiContentType,
      currentText: formData.hero.subheadline,
    };

    const validation = validateStrict(GenerateCopySchema, payload);
    if (!validation.success) {
      setAiError(`Input rejected by schema: ${validation.error}`);
      setAiGenerating(false);
      return;
    }

    try {
      const res = await fetch('/api/cms/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : {};
      if (res.ok && data.success && data.generatedText) {
        setAiResult(data.generatedText);
      } else {
        setAiError(data.error || 'The AI copywriting service is temporarily unavailable. Please try again.');
      }
    } catch {
      setAiError('Unable to connect to the copywriting service. Please check your connection and try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAiToHeroSub = () => {
    if (!aiResult) return;
    setFormData({
      ...formData,
      hero: { ...formData.hero, subheadline: aiResult },
    });
    alert('Applied generated copy to Hero Subheadline!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* CMS Header Bar */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <ReceiptLogoIcon sizeClass="w-9 h-9 rounded-xl" showSparkle={false} />
            <div>
              <h3 className="font-bold text-sm text-[var(--foreground)]">
                {formData.brand.brandName || 'Invobill'} Brand Content Manager
              </h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Live editing, style configuration, and Gemini AI copy generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveNotification && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Saved Live!</span>
              </span>
            )}

            <button
              onClick={handleSave}
              className="btn-shader-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-[var(--radius)] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 btn-icon-hover-bounce" />
              <span>Save Edits</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded hover:bg-[var(--muted)] ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CMS Sidebar + Main Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tabs Navigation Sidebar */}
          <div className="w-full md:w-56 bg-[var(--sidebar)] border-b md:border-b-0 md:border-r border-[var(--border)] p-3 space-y-1 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1">
            <button
              onClick={() => setActiveTab('brand')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[var(--radius)] text-left transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'brand'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Brand & Styling</span>
            </button>

            <button
              onClick={() => setActiveTab('hero')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[var(--radius)] text-left transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'hero'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Hero Section</span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[var(--radius)] text-left transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'features'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Features</span>
            </button>

            <button
              onClick={() => setActiveTab('howItWorks')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[var(--radius)] text-left transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'howItWorks'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <BarChart className="w-3.5 h-3.5" />
              <span>How It Works</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[var(--radius)] text-left transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'about'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>About & Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('faqs')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[var(--radius)] text-left transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'faqs'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FAQs</span>
            </button>

            <button
              onClick={() => setActiveTab('testimonials')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[var(--radius)] text-left transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'testimonials'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Testimonials</span>
            </button>

            <button
              onClick={() => setActiveTab('seo')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[var(--radius)] text-left transition-colors whitespace-nowrap border border-[var(--border)] cursor-pointer ${
                activeTab === 'seo'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>SEO & Google Sitemap</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[var(--radius)] text-left transition-colors whitespace-nowrap border border-[var(--border)] cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-neutral-950 font-bold shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Rate Limiting & Security</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-[var(--radius)] text-left transition-colors whitespace-nowrap border border-[var(--border)] cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--muted)]'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Gemini AI Copywriter</span>
            </button>

            <div className="pt-4 mt-auto border-t border-[var(--border)] space-y-2 hidden md:block">
              <button
                onClick={handleExportJson}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <label className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  if (
                    confirm(
                      'Are you sure you want to reset all CMS content back to default values?'
                    )
                  ) {
                    onReset();
                    onClose();
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Active Workspace Editor Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* BRAND TAB */}
            {activeTab === 'brand' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--foreground)]">
                    Global Brand & Identity Configuration
                  </h4>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    Real-time live updates
                  </span>
                </div>

                {/* Live Brand Logo Preview Box */}
                <div className="p-4 bg-[var(--muted)]/40 border border-[var(--border)] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
                      Live Brand Logo & Tagline Preview
                    </span>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      This enchanted receipt mark and pill badge appear in your header, footer, and brand touchpoints.
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xs">
                    <BrandLogo
                      brandName={formData.brand.brandName || 'Invobill'}
                      tagline={formData.brand.tagline || 'Invoices, paid faster'}
                      size="md"
                      showTagline={true}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={formData.brand.brandName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          brand: { ...formData.brand, brandName: e.target.value },
                        })
                      }
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs font-bold text-[var(--foreground)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Brand Tagline (Pill Badge)
                    </label>
                    <input
                      type="text"
                      value={formData.brand.tagline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          brand: { ...formData.brand, tagline: e.target.value },
                        })
                      }
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                      placeholder="Invoices, paid faster"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Primary Theme Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.brand.primaryColor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            brand: {
                              ...formData.brand,
                              primaryColor: e.target.value,
                            },
                          })
                        }
                        className="w-8 h-8 rounded border border-[var(--border)] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.brand.primaryColor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            brand: {
                              ...formData.brand,
                              primaryColor: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.brand.accentColor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            brand: {
                              ...formData.brand,
                              accentColor: e.target.value,
                            },
                          })
                        }
                        className="w-8 h-8 rounded border border-[var(--border)] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.brand.accentColor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            brand: {
                              ...formData.brand,
                              accentColor: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.brand.tagline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          brand: { ...formData.brand, tagline: e.target.value },
                        })
                      }
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                    />
                  </div>

                  {/* Default UPI & Payment Settings */}
                  <div className="sm:col-span-2 pt-4 border-t border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-orange-600" />
                        Default UPI Payment & Bank Details
                      </h5>
                      <span className="text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded font-bold">
                        0% Fee Instant Pay
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                      Connect your UPI ID (Google Pay, PhonePe, Paytm, BHIM, or any bank UPI address) to automatically generate real-time scannable QR codes on your invoices.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                          Default UPI ID (VPA)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. uzafa.shop@okhdfcbank or business@upi"
                          value={formData.brand.defaultBankDetails?.upiId || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              brand: {
                                ...formData.brand,
                                defaultBankDetails: {
                                  ...(formData.brand.defaultBankDetails || {}),
                                  upiId: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs font-mono text-[var(--foreground)]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                          Beneficiary / Payee Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Uzafa Shop or Invobill Studio"
                          value={formData.brand.defaultBankDetails?.accountName || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              brand: {
                                ...formData.brand,
                                defaultBankDetails: {
                                  ...(formData.brand.defaultBankDetails || {}),
                                  accountName: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                          Bank Name (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. HDFC Bank / State Bank of India"
                          value={formData.brand.defaultBankDetails?.bankName || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              brand: {
                                ...formData.brand,
                                defaultBankDetails: {
                                  ...(formData.brand.defaultBankDetails || {}),
                                  bankName: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                          Account Number (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 50200084729103"
                          value={formData.brand.defaultBankDetails?.accountNumber || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              brand: {
                                ...formData.brand,
                                defaultBankDetails: {
                                  ...(formData.brand.defaultBankDetails || {}),
                                  accountNumber: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs font-mono text-[var(--foreground)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Google Search Console & SEO Section */}
                  <div className="sm:col-span-2 pt-4 border-t border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
                        Google Search Console & SEO Verification
                      </h5>
                      <span className="text-[10px] bg-[var(--accent)] text-[var(--primary)] px-2 py-0.5 rounded font-bold">
                        SEO Integration
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                        Google Site Verification Code / Meta Tag Content
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. google1234567890abcdef OR full meta tag"
                        value={formData.brand.googleSiteVerification || ''}
                        onChange={(e) => {
                          let val = e.target.value;
                          const match = val.match(/content=["']([^"']+)["']/i);
                          if (match && match[1]) {
                            val = match[1];
                          }
                          setFormData({
                            ...formData,
                            brand: { ...formData.brand, googleSiteVerification: val },
                          });
                        }}
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)] font-mono"
                      />
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-1 leading-relaxed">
                        Paste either your Google Search Console verification code or the full HTML meta tag. Invobill will automatically inject: <br />
                        <code className="text-[var(--primary)] font-mono text-[10px]">
                          &lt;meta name="google-site-verification" content="{formData.brand.googleSiteVerification || 'YOUR_CODE'}" /&gt;
                        </code>
                      </p>
                    </div>

                    <div className="bg-[var(--muted)]/50 border border-[var(--border)] p-3 rounded text-xs space-y-1.5 text-[var(--foreground)]">
                      <span className="font-bold text-[var(--primary)] block text-[11px]">
                        💡 How to verify in Google Search Console:
                      </span>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-[var(--muted-foreground)]">
                        <li>Go to <strong>Google Search Console</strong> and select <strong>HTML Tag</strong> verification method.</li>
                        <li>Copy the <code className="bg-[var(--card)] px-1 py-0.5 border border-[var(--border)] rounded font-mono">content="..."</code> value or the full tag.</li>
                        <li>Paste it in the box above and click <strong>Save Edits</strong>.</li>
                      </ol>
                    </div>
                  </div>

                  {/* Master Security PIN & Admin Protection Controls */}
                  <div className="sm:col-span-2 pt-4 border-t border-[var(--border)] space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-orange-500" />
                        Admin Security & Access Protection
                      </h5>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-bold">
                        Owner Only
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                          Master Security PIN Code
                        </label>
                        <input
                          type="text"
                          maxLength={8}
                          value={formData.brand.adminPin || '1234'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              brand: { ...formData.brand, adminPin: e.target.value },
                            })
                          }
                          className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs font-mono font-bold text-[var(--foreground)] tracking-widest"
                          placeholder="1234"
                        />
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                          Required to open and edit the CMS admin panel.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                          Public Header CMS Button Visibility
                        </label>
                        <div className="flex items-center gap-3 pt-1">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!formData.brand.showAdminButtonInHeader}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  brand: {
                                    ...formData.brand,
                                    showAdminButtonInHeader: e.target.checked,
                                  },
                                })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                            <span className="ml-2 text-xs font-semibold text-[var(--foreground)]">
                              {formData.brand.showAdminButtonInHeader
                                ? 'Visible in Header'
                                : 'Hidden from Visitors'}
                            </span>
                          </label>
                        </div>
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                          When hidden, open anytime via shortcut <kbd className="px-1 py-0.5 bg-[var(--muted)] rounded font-mono text-[9px]">Ctrl+Shift+A</kbd> or the footer lock.
                        </p>
                      </div>
                    </div>

                    {onLockAdmin && (
                      <div className="flex items-center justify-between p-3 bg-[var(--muted)]/40 border border-[var(--border)] rounded-xl">
                        <div className="text-xs">
                          <p className="font-bold text-[var(--foreground)]">Currently Authenticated as Owner</p>
                          <p className="text-[11px] text-[var(--muted-foreground)]">Lock your session before leaving the browser.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onLockAdmin();
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Lock Admin Mode</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* HERO TAB */}
            {activeTab === 'hero' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[var(--foreground)]">
                  Hero Copy & Call to Action Settings
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Eyebrow Badge
                    </label>
                    <input
                      type="text"
                      value={formData.hero.eyebrow}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hero: { ...formData.hero, eyebrow: e.target.value },
                        })
                      }
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                        Main Headline Text
                      </label>
                      <input
                        type="text"
                        value={formData.hero.headlineMain}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hero: {
                              ...formData.hero,
                              headlineMain: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                        Headline Accent Word (Styled in Brand Color)
                      </label>
                      <input
                        type="text"
                        value={formData.hero.headlineAccent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hero: {
                              ...formData.hero,
                              headlineAccent: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Subheadline
                    </label>
                    <textarea
                      rows={3}
                      value={formData.hero.subheadline}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hero: {
                            ...formData.hero,
                            subheadline: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                        Primary CTA Text
                      </label>
                      <input
                        type="text"
                        value={formData.hero.primaryCtaText}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hero: {
                              ...formData.hero,
                              primaryCtaText: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                        Secondary CTA Text
                      </label>
                      <input
                        type="text"
                        value={formData.hero.secondaryCtaText}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hero: {
                              ...formData.hero,
                              secondaryCtaText: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURES TAB */}
            {activeTab === 'features' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--foreground)]">
                    Manage Features List
                  </h4>
                  <button
                    onClick={() => {
                      const newFeat: FeatureItem = {
                        id: `feat-${Date.now()}`,
                        title: 'New Feature',
                        description: 'Feature description goes here.',
                        iconName: 'Zap',
                      };
                      setFormData({
                        ...formData,
                        features: {
                          ...formData.features,
                          items: [...formData.features.items, newFeat],
                        },
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Feature</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.features.items.map((feat, idx) => (
                    <div
                      key={feat.id}
                      className="p-3 bg-[var(--background)] border border-[var(--border)] rounded flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Title"
                          value={feat.title}
                          onChange={(e) => {
                            const items = [...formData.features.items];
                            items[idx].title = e.target.value;
                            setFormData({
                              ...formData,
                              features: { ...formData.features, items },
                            });
                          }}
                          className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs font-semibold text-[var(--foreground)]"
                        />

                        <input
                          type="text"
                          placeholder="Icon (Rocket, Bookmark, Eye, FileText, Share2, Activity, RefreshCw, LayoutDashboard, Zap)"
                          value={feat.iconName}
                          onChange={(e) => {
                            const items = [...formData.features.items];
                            items[idx].iconName = e.target.value;
                            setFormData({
                              ...formData,
                              features: { ...formData.features, items },
                            });
                          }}
                          className="p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                        />

                        <input
                          type="text"
                          placeholder="Description"
                          value={feat.description}
                          onChange={(e) => {
                            const items = [...formData.features.items];
                            items[idx].description = e.target.value;
                            setFormData({
                              ...formData,
                              features: { ...formData.features, items },
                            });
                          }}
                          className="sm:col-span-3 p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--muted-foreground)]"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const items = formData.features.items.filter(
                            (i) => i.id !== feat.id
                          );
                          setFormData({
                            ...formData,
                            features: { ...formData.features, items },
                          });
                        }}
                        className="text-[var(--muted-foreground)] hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HOW IT WORKS TAB */}
            {activeTab === 'howItWorks' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                    Section Main Title
                  </label>
                  <input
                    type="text"
                    value={formData.howItWorks.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        howItWorks: {
                          ...formData.howItWorks,
                          title: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs font-bold text-[var(--foreground)]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <h4 className="text-sm font-bold text-[var(--foreground)]">
                    Manage Step-by-Step Execution Steps
                  </h4>
                  <button
                    onClick={() => {
                      const nextStepNum = String(
                        formData.howItWorks.steps.length + 1
                      ).padStart(2, '0');
                      const newStep: StepItem = {
                        id: `step-${Date.now()}`,
                        stepNumber: nextStepNum,
                        title: 'New Plan Step',
                        description: 'Describe this execution stage.',
                        theme: 'ruby',
                      };
                      setFormData({
                        ...formData,
                        howItWorks: {
                          ...formData.howItWorks,
                          steps: [...formData.howItWorks.steps, newStep],
                        },
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.howItWorks.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="p-3 bg-[var(--background)] border border-[var(--border)] rounded space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={step.stepNumber}
                          onChange={(e) => {
                            const steps = [...formData.howItWorks.steps];
                            steps[idx].stepNumber = e.target.value;
                            setFormData({
                              ...formData,
                              howItWorks: { ...formData.howItWorks, steps },
                            });
                          }}
                          className="w-14 p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs font-mono font-bold text-center text-[var(--foreground)]"
                          placeholder="01"
                        />
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => {
                            const steps = [...formData.howItWorks.steps];
                            steps[idx].title = e.target.value;
                            setFormData({
                              ...formData,
                              howItWorks: { ...formData.howItWorks, steps },
                            });
                          }}
                          className="flex-1 p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs font-semibold text-[var(--foreground)]"
                          placeholder="Step Title"
                        />
                        <button
                          onClick={() => {
                            const steps = formData.howItWorks.steps.filter(
                              (s) => s.id !== step.id
                            );
                            setFormData({
                              ...formData,
                              howItWorks: { ...formData.howItWorks, steps },
                            });
                          }}
                          className="text-[var(--muted-foreground)] hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={step.description}
                        onChange={(e) => {
                          const steps = [...formData.howItWorks.steps];
                          steps[idx].description = e.target.value;
                          setFormData({
                            ...formData,
                            howItWorks: { ...formData.howItWorks, steps },
                          });
                        }}
                        className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--muted-foreground)]"
                        placeholder="Step description..."
                      ></textarea>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ABOUT & STATS TAB */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[var(--foreground)]">
                  About Section & Impact Statistics
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Eyebrow Badge Text
                    </label>
                    <input
                      type="text"
                      value={formData.about?.eyebrow || ''}
                      placeholder={`About ${formData.brand.brandName || 'Invobill'}`}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          about: {
                            ...formData.about,
                            eyebrow: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={formData.about?.title || ''}
                      placeholder="Built for people who invoice on their own."
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          about: {
                            ...formData.about,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs font-bold text-[var(--foreground)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Paragraph 1 (Narrative / Mission)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.about?.paragraph1 || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          about: {
                            ...formData.about,
                            paragraph1: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                    ></textarea>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Paragraph 2 (Features & Non-Copyright / Royalty-Free Guarantee)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.about?.paragraph2 || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          about: {
                            ...formData.about,
                            paragraph2: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <h5 className="text-xs font-bold text-[var(--foreground)] mb-2">
                      Key Highlights & Statistics (4 Cards)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(formData.about?.stats || []).map((stat, idx) => (
                        <div
                          key={stat.id || idx}
                          className="p-3 bg-[var(--background)] border border-[var(--border)] rounded space-y-2"
                        >
                          <div>
                            <label className="text-[10px] font-semibold text-[var(--muted-foreground)] block mb-0.5">
                              Stat Metric / Number
                            </label>
                            <input
                              type="text"
                              value={stat.number}
                              onChange={(e) => {
                                const stats = [...(formData.about?.stats || [])];
                                stats[idx].number = e.target.value;
                                setFormData({
                                  ...formData,
                                  about: { ...formData.about, stats },
                                });
                              }}
                              className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs font-mono font-bold text-[var(--primary)]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-[var(--muted-foreground)] block mb-0.5">
                              Stat Description Label
                            </label>
                            <input
                              type="text"
                              value={stat.label}
                              onChange={(e) => {
                                const stats = [...(formData.about?.stats || [])];
                                stats[idx].label = e.target.value;
                                setFormData({
                                  ...formData,
                                  about: { ...formData.about, stats },
                                });
                              }}
                              className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FAQS TAB */}
            {activeTab === 'faqs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--foreground)]">
                    Manage FAQ Items
                  </h4>
                  <button
                    onClick={() => {
                      const newFaq: FaqItem = {
                        id: `faq-${Date.now()}`,
                        question: 'New Question?',
                        answer: 'Answer goes here.',
                        category: 'General',
                      };
                      setFormData({
                        ...formData,
                        faqs: {
                          ...formData.faqs,
                          items: [...formData.faqs.items, newFaq],
                        },
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add FAQ</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.faqs.items.map((faq, idx) => (
                    <div
                      key={faq.id}
                      className="p-3 bg-[var(--background)] border border-[var(--border)] rounded space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const items = [...formData.faqs.items];
                            items[idx].question = e.target.value;
                            setFormData({
                              ...formData,
                              faqs: { ...formData.faqs, items },
                            });
                          }}
                          className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs font-semibold text-[var(--foreground)]"
                        />
                        <button
                          onClick={() => {
                            const items = formData.faqs.items.filter(
                              (i) => i.id !== faq.id
                            );
                            setFormData({
                              ...formData,
                              faqs: { ...formData.faqs, items },
                            });
                          }}
                          className="text-[var(--muted-foreground)] hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const items = [...formData.faqs.items];
                          items[idx].answer = e.target.value;
                          setFormData({
                            ...formData,
                            faqs: { ...formData.faqs, items },
                          });
                        }}
                        className="w-full p-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--muted-foreground)]"
                      ></textarea>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GEMINI AI TAB */}
            {activeTab === 'ai' && (
              <div className="space-y-4 bg-[var(--background)] p-5 border border-[var(--border)] rounded-md">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                  <Sparkles className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-[var(--foreground)]">
                    Gemini AI Copywriting Assistant
                  </h4>
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Use server-side Gemini 3.6 Flash model to refine or generate
                  high-converting copy for your website.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Content Target
                    </label>
                    <select
                      value={aiContentType}
                      onChange={(e) => setAiContentType(e.target.value)}
                      className="w-full p-2 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--foreground)] cursor-pointer"
                    >
                      <option value="Hero Headline">Hero Subheadline</option>
                      <option value="Feature Description">Feature Description</option>
                      <option value="FAQ Answer">FAQ Response</option>
                      <option value="Marketing Slogan">Brand Slogan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Prompt Instructions
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g., Write a punchy 2-sentence subheadline for Invobill targeting high-end design agencies and freelancers."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full p-2.5 bg-[var(--card)] border border-[var(--border)] rounded text-xs text-[var(--foreground)]"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleGenerateAiCopy}
                    disabled={aiGenerating || !aiPrompt.trim()}
                    className="btn-shader-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 btn-icon-hover-bounce" />
                    <span>
                      {aiGenerating
                        ? 'Generating with Gemini...'
                        : 'Generate Copy'}
                    </span>
                  </button>

                  {aiError && (
                    <p className="text-xs text-red-600 font-medium">{aiError}</p>
                  )}

                  {aiResult && (
                    <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded space-y-3">
                      <h5 className="text-xs font-bold text-[var(--primary)]">
                        Generated Output:
                      </h5>
                      <p className="text-xs text-[var(--foreground)] leading-relaxed italic">
                        "{aiResult}"
                      </p>
                      <button
                        onClick={applyAiToHeroSub}
                        className="px-3 py-1.5 text-xs font-semibold bg-[var(--accent)] text-[var(--primary)] rounded hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-colors cursor-pointer"
                      >
                        Apply to Hero Subheadline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEO & GOOGLE SITEMAP TAB */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-[var(--foreground)]">
                    Google Search Console & XML Sitemap
                  </h4>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Submit your real-time XML sitemap and verify your site with Google Search Console for rapid indexing.
                  </p>
                </div>

                {/* Primary Sitemap Submission Card */}
                <div className="p-5 bg-gradient-to-br from-orange-500/10 via-[var(--card)] to-amber-500/5 border border-orange-500/30 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[var(--foreground)] block">
                          Your Dynamic Google XML Sitemap
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          Automatically synchronized and updated on every deployment
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/sitemap.xml`;
                          navigator.clipboard.writeText(url);
                          setCopiedSitemap(true);
                          setTimeout(() => setCopiedSitemap(false), 2500);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[var(--card)] border border-[var(--border)] hover:border-orange-500 rounded-lg text-[var(--foreground)] hover:text-orange-600 transition-all shadow-2xs cursor-pointer"
                        title="Copy full Sitemap URL"
                      >
                        {copiedSitemap ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 font-bold">Copied URL!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>

                      <a
                        href="/sitemap.xml"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-all shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Sitemap</span>
                      </a>
                    </div>
                  </div>

                  {/* Sitemap URL Display Field */}
                  <div className="flex items-center gap-2 p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs font-mono text-[var(--foreground)] break-all select-all">
                    <FileCode className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>{typeof window !== 'undefined' ? `${window.location.origin}/sitemap.xml` : 'https://yourdomain.com/sitemap.xml'}</span>
                  </div>

                  {/* Quick Action to Google Search Console */}
                  <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Ready to submit? Paste <code className="px-1.5 py-0.5 bg-[var(--muted)] rounded font-mono font-bold text-[var(--foreground)]">sitemap.xml</code> into Google Search Console.
                    </div>
                    <a
                      href="https://search.google.com/search-console/sitemaps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Open Google Search Console Sitemaps ↗</span>
                    </a>
                  </div>
                </div>

                {/* 4-Step Instructions on How to Add to Google */}
                <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl space-y-3">
                  <h5 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-2">
                    <span>How to Add this Sitemap in Google Search Console</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[var(--muted)]/40 rounded-xl border border-[var(--border)] space-y-1">
                      <span className="font-bold text-orange-600 dark:text-orange-400">Step 1: Select Property</span>
                      <p className="text-[var(--muted-foreground)] text-[11px] leading-relaxed">
                        Log in to <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-[var(--foreground)]">Google Search Console</a> and choose your verified domain or URL prefix property.
                      </p>
                    </div>

                    <div className="p-3 bg-[var(--muted)]/40 rounded-xl border border-[var(--border)] space-y-1">
                      <span className="font-bold text-orange-600 dark:text-orange-400">Step 2: Go to Sitemaps</span>
                      <p className="text-[var(--muted-foreground)] text-[11px] leading-relaxed">
                        Click on <strong>"Sitemaps"</strong> under the <em>Indexing</em> section in the left-hand navigation sidebar.
                      </p>
                    </div>

                    <div className="p-3 bg-[var(--muted)]/40 rounded-xl border border-[var(--border)] space-y-1">
                      <span className="font-bold text-orange-600 dark:text-orange-400">Step 3: Enter sitemap.xml</span>
                      <p className="text-[var(--muted-foreground)] text-[11px] leading-relaxed">
                        In the "Add a new sitemap" box, enter <code className="font-mono bg-[var(--card)] px-1 rounded font-bold text-orange-600">sitemap.xml</code> and click <strong>Submit</strong>.
                      </p>
                    </div>

                    <div className="p-3 bg-[var(--muted)]/40 rounded-xl border border-[var(--border)] space-y-1">
                      <span className="font-bold text-orange-600 dark:text-orange-400">Step 4: Verify Success</span>
                      <p className="text-[var(--muted-foreground)] text-[11px] leading-relaxed">
                        Googlebot will crawl your sitemap immediately. The status will display a green <strong>"Success"</strong> badge with 0 errors and discover your homepage and verified pages.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Google Site Verification Meta Tag Settings */}
                <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-[var(--foreground)]">
                      Google Search Console Site Verification
                    </h5>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                      Your HTML verification file and HTML meta tag are configured and active.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                      Verification Tag / Code
                    </label>
                    <input
                      type="text"
                      value={formData.brand.googleSiteVerification || 'googleacb1159f81828443'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          brand: {
                            ...formData.brand,
                            googleSiteVerification: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs font-mono text-[var(--foreground)]"
                      placeholder="e.g. googleacb1159f81828443"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[var(--muted)]/30 rounded-xl border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <span className="font-semibold block text-[var(--foreground)]">Verification File Route</span>
                        <code className="text-[11px] text-orange-600 font-mono">/googleacb1159f81828443.html</code>
                      </div>
                      <a
                        href="/googleacb1159f81828443.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-orange-600 hover:underline"
                      >
                        Verify ↗
                      </a>
                    </div>

                    <div className="p-3 bg-[var(--muted)]/30 rounded-xl border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <span className="font-semibold block text-[var(--foreground)]">Robots.txt Route</span>
                        <code className="text-[11px] text-orange-600 font-mono">/robots.txt</code>
                      </div>
                      <a
                        href="/robots.txt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-orange-600 hover:underline"
                      >
                        Check ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Live XML Sitemap Contents & URLs */}
                <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-[var(--foreground)]">
                      Indexed URLs in this Sitemap (8 Pages)
                    </h5>
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                      Protocol: Sitemaps XML 0.9
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--border)] text-xs font-mono">
                    {[
                      { loc: '/', name: 'Homepage / Main Landing', priority: '1.0', freq: 'daily' },
                      { loc: '/#studio', name: 'Invoice Studio & Generator', priority: '0.9', freq: 'weekly' },
                      { loc: '/#features', name: 'Key Features & Capabilities', priority: '0.8', freq: 'weekly' },
                      { loc: '/#how-it-works', name: 'How It Works 3-Step Guide', priority: '0.8', freq: 'weekly' },
                      { loc: '/#pricing', name: 'Pricing Tiers & Options', priority: '0.8', freq: 'weekly' },
                      { loc: '/#about', name: 'Brand Story & Creator Mission', priority: '0.7', freq: 'monthly' },
                      { loc: '/#faqs', name: 'Frequently Asked Questions', priority: '0.7', freq: 'monthly' },
                      { loc: '/#testimonials', name: 'Client Reviews & Social Proof', priority: '0.7', freq: 'monthly' },
                    ].map((item, idx) => (
                      <div key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="font-semibold text-[var(--foreground)]">{item.name}</span>
                          <span className="text-[11px] text-[var(--muted-foreground)]">({item.loc})</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[var(--muted-foreground)]">
                          <span>Change: <strong className="text-[var(--foreground)]">{item.freq}</strong></span>
                          <span>Priority: <strong className="text-orange-600">{item.priority}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* RATE LIMITING & SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>Adaptive Tiered Rate Limiting & Security</span>
                    </h4>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Stricter per-IP & per-account exponential backoff on auth routes, moderate public limits, and looser authenticated user quotas.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchRateLimits}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--card)] border border-[var(--border)] hover:border-amber-500 rounded-lg text-[var(--foreground)] transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Metrics</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetRateLimitStores}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Backoffs</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Diagnostics Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                    <span className="text-[11px] font-semibold text-[var(--muted-foreground)] block">Total Checked</span>
                    <span className="text-xl font-mono font-black text-[var(--foreground)] block mt-0.5">
                      {rateLimitMetrics?.totalRequestsChecked ?? 0}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">All API routes</span>
                  </div>

                  <div className="p-3.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                    <span className="text-[11px] font-semibold text-[var(--muted-foreground)] block">Total Throttled (429)</span>
                    <span className="text-xl font-mono font-black text-rose-600 dark:text-rose-400 block mt-0.5">
                      {rateLimitMetrics?.totalThrottled ?? 0}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      Auth: {rateLimitMetrics?.throttledAuthAccount ?? 0} acc / {rateLimitMetrics?.throttledAuthIp ?? 0} ip
                    </span>
                  </div>

                  <div className="p-3.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                    <span className="text-[11px] font-semibold text-[var(--muted-foreground)] block">Active Auth Backoffs</span>
                    <span className="text-xl font-mono font-black text-amber-600 dark:text-amber-400 block mt-0.5">
                      {(rateLimitMetrics?.activeAuthAccountBackoffs || 0) + (rateLimitMetrics?.activeAuthIpBackoffs || 0)}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">Exponential delays</span>
                  </div>

                  <div className="p-3.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                    <span className="text-[11px] font-semibold text-[var(--muted-foreground)] block">Public Tracked IPs</span>
                    <span className="text-xl font-mono font-black text-[var(--foreground)] block mt-0.5">
                      {rateLimitMetrics?.activePublicTracked ?? 0}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">Sliding window active</span>
                  </div>
                </div>

                {/* Tier 1: Authentication Routes (Strictest — Per-IP & Per-Account with Exponential Backoff) */}
                <div className="p-5 bg-gradient-to-br from-amber-500/10 via-[var(--card)] to-orange-500/5 border border-amber-500/30 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--foreground)]">
                            Tier 1: Authentication Routes
                          </span>
                          <span className="text-[10px] uppercase font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                            Strictest Tier
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          Protected routes: <code className="font-mono text-amber-600">/api/auth/login</code>, <code className="font-mono text-amber-600">/api/auth/signup</code>, <code className="font-mono text-amber-600">/api/auth/password-reset</code>, <code className="font-mono text-amber-600">/api/auth/verify-pin</code>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--background)]/80 border border-[var(--border)] rounded-xl text-xs space-y-1.5">
                    <span className="font-bold text-[var(--foreground)] block flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-500" />
                      <span>Exponential Backoff vs Hard Lockout</span>
                    </span>
                    <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                      Rather than permanently locking out accounts after N attempts, this algorithm implements exponential backoff (<code className="font-mono font-bold text-amber-600">delay = base × factor^(failures - threshold)</code>). Legitimate users who mistyped credentials only wait a few seconds (e.g. 1s → 2s → 4s → 8s), while brute-force bots are throttled exponentially up to the maximum delay cap.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Max Account Attempts Before Backoff
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={rateLimitConfig.authRoutes.accountMaxAttempts}
                        onChange={(e) =>
                          setRateLimitConfig({
                            ...rateLimitConfig,
                            authRoutes: {
                              ...rateLimitConfig.authRoutes,
                              accountMaxAttempts: parseInt(e.target.value, 10) || 5,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">e.g. 5 attempts (per-account)</span>
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Base Backoff Delay (ms)
                      </label>
                      <input
                        type="number"
                        step={100}
                        min={500}
                        max={10000}
                        value={rateLimitConfig.authRoutes.baseBackoffMs}
                        onChange={(e) =>
                          setRateLimitConfig({
                            ...rateLimitConfig,
                            authRoutes: {
                              ...rateLimitConfig.authRoutes,
                              baseBackoffMs: parseInt(e.target.value, 10) || 1000,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">1st penalty (e.g. 1000ms = 1s)</span>
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Exponential Multiplier Factor
                      </label>
                      <input
                        type="number"
                        step={0.5}
                        min={1.5}
                        max={4}
                        value={rateLimitConfig.authRoutes.backoffFactor}
                        onChange={(e) =>
                          setRateLimitConfig({
                            ...rateLimitConfig,
                            authRoutes: {
                              ...rateLimitConfig.authRoutes,
                              backoffFactor: parseFloat(e.target.value) || 2,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">e.g. 2x (1s → 2s → 4s → 8s...)</span>
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Max Backoff Delay Cap (ms)
                      </label>
                      <input
                        type="number"
                        step={10000}
                        min={10000}
                        max={3600000}
                        value={rateLimitConfig.authRoutes.maxBackoffMs}
                        onChange={(e) =>
                          setRateLimitConfig({
                            ...rateLimitConfig,
                            authRoutes: {
                              ...rateLimitConfig.authRoutes,
                              maxBackoffMs: parseInt(e.target.value, 10) || 300000,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">Max cap (e.g. 300,000ms = 5 mins)</span>
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Per-IP Auth Limit (Requests)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={rateLimitConfig.authRoutes.ipMaxRequests}
                        onChange={(e) =>
                          setRateLimitConfig({
                            ...rateLimitConfig,
                            authRoutes: {
                              ...rateLimitConfig.authRoutes,
                              ipMaxRequests: parseInt(e.target.value, 10) || 20,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">Total attempts allowed per IP</span>
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Per-IP Auth Window (ms)
                      </label>
                      <input
                        type="number"
                        step={60000}
                        min={60000}
                        max={3600000}
                        value={rateLimitConfig.authRoutes.ipWindowMs}
                        onChange={(e) =>
                          setRateLimitConfig({
                            ...rateLimitConfig,
                            authRoutes: {
                              ...rateLimitConfig.authRoutes,
                              ipWindowMs: parseInt(e.target.value, 10) || 900000,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">e.g. 900,000ms = 15 minutes</span>
                    </div>
                  </div>
                </div>

                {/* Tier 2: Public Endpoints (Moderate Limits) */}
                <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--foreground)]">
                          Tier 2: Public Endpoints
                        </span>
                        <span className="text-[10px] uppercase font-mono font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          Moderate Tier
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        Protected routes: <code className="font-mono text-blue-600">/api/health</code>, <code className="font-mono text-blue-600">/sitemap.xml</code>, <code className="font-mono text-blue-600">/robots.txt</code>, <code className="font-mono text-blue-600">/api/cms/generate-copy</code>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Max Requests per Window
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={1000}
                        value={rateLimitConfig.public.maxRequests}
                        onChange={(e) =>
                          setRateLimitConfig({
                            ...rateLimitConfig,
                            public: {
                              ...rateLimitConfig.public,
                              maxRequests: parseInt(e.target.value, 10) || 100,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">Default: 100 requests per IP</span>
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Window Duration (ms)
                      </label>
                      <input
                        type="number"
                        step={10000}
                        min={10000}
                        max={600000}
                        value={rateLimitConfig.public.windowMs}
                        onChange={(e) =>
                          setRateLimitConfig({
                            ...rateLimitConfig,
                            public: {
                              ...rateLimitConfig.public,
                              windowMs: parseInt(e.target.value, 10) || 60000,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">Default: 60,000ms (1 minute)</span>
                    </div>
                  </div>
                </div>

                {/* Tier 3: Authenticated User Actions (Looser Limits) */}
                <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--foreground)]">
                          Tier 3: Authenticated User Actions
                        </span>
                        <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          Loosest Tier
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        Protected routes: <code className="font-mono text-emerald-600">/api/invoices/save</code>, <code className="font-mono text-emerald-600">/api/cms/save</code>, <code className="font-mono text-emerald-600">/api/user/profile</code>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Max User Requests per Window
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={5000}
                        value={rateLimitConfig.authenticatedUser.maxRequests}
                        onChange={(e) =>
                          setRateLimitConfig({
                            ...rateLimitConfig,
                            authenticatedUser: {
                              ...rateLimitConfig.authenticatedUser,
                              maxRequests: parseInt(e.target.value, 10) || 300,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">High capacity for authenticated sessions (e.g. 300 req/min)</span>
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Window Duration (ms)
                      </label>
                      <input
                        type="number"
                        step={10000}
                        min={10000}
                        max={600000}
                        value={rateLimitConfig.authenticatedUser.windowMs}
                        onChange={(e) =>
                          setRateLimitConfig({
                            ...rateLimitConfig,
                            authenticatedUser: {
                              ...rateLimitConfig.authenticatedUser,
                              windowMs: parseInt(e.target.value, 10) || 60000,
                            },
                          })
                        }
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                      />
                      <span className="text-[10px] text-[var(--muted-foreground)]">Default: 60,000ms (1 minute)</span>
                    </div>
                  </div>
                </div>

                {/* Save Thresholds Button Bar */}
                <div className="flex items-center justify-between p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
                  <div>
                    {rateLimitSaveMsg && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                        <CheckCheck className="w-4 h-4" />
                        <span>{rateLimitSaveMsg}</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveRateLimits}
                    disabled={rateLimitSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{rateLimitSaving ? 'Saving Thresholds...' : 'Save Rate Limit Thresholds'}</span>
                  </button>
                </div>

                {/* Interactive Live Testing Sandbox */}
                <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                      <h5 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                        Interactive Live Rate Limit & Backoff Simulator
                      </h5>
                    </div>
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                      Tests live endpoint headers and exponential penalties
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Test Account Email
                      </label>
                      <input
                        type="email"
                        value={simEmail}
                        onChange={(e) => setSimEmail(e.target.value)}
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                        placeholder="e.g. user@example.com"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[var(--muted-foreground)] block mb-1">
                        Test Password
                      </label>
                      <input
                        type="text"
                        value={simPassword}
                        onChange={(e) => setSimPassword(e.target.value)}
                        className="w-full p-2 bg-[var(--background)] border border-[var(--border)] rounded-lg font-mono text-[var(--foreground)]"
                        placeholder="e.g. wrong-pass"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={simLoading}
                      onClick={() => handleSimulateAuth(false)}
                      className="px-3.5 py-2 text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl hover:bg-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>Simulate Failed Login (Triggers Backoff)</span>
                    </button>

                    <button
                      type="button"
                      disabled={simLoading}
                      onClick={() => handleSimulateAuth(true)}
                      className="px-3.5 py-2 text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>Simulate Valid Login (Resets Backoff)</span>
                    </button>

                    <button
                      type="button"
                      disabled={simLoading}
                      onClick={handleSimulateBurst}
                      className="px-3.5 py-2 text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 rounded-xl hover:bg-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>Simulate Public Burst (5 Requests)</span>
                    </button>
                  </div>

                  {/* Simulator Event Stream */}
                  {simLogs.length > 0 && (
                    <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl font-mono text-[11px]">
                      {simLogs.map((log, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
                            log.status === 200 || log.status === 201
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                              : log.status === 429
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold px-1.5 py-0.5 rounded bg-[var(--card)] text-[10px]">
                              HTTP {log.status}
                            </span>
                            <span className="font-semibold">{log.action}:</span>
                            <span className="truncate max-w-xs sm:max-w-md">{log.message}</span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] shrink-0 opacity-90">
                            {log.backoffDelay !== undefined && log.backoffDelay > 0 && (
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                Backoff: {log.backoffDelay}ms
                              </span>
                            )}
                            {log.retryAfter !== undefined && (
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                Retry-After: {log.retryAfter}s
                              </span>
                            )}
                            <span className="text-[var(--muted-foreground)]">{log.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Strict Schema Validation Inspector & Live Tester */}
                <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-[var(--card)] to-purple-500/5 border border-indigo-500/30 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--foreground)]">
                            Strict Schema Validation & Input Inspector
                          </span>
                          <span className="text-[10px] uppercase font-mono font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                            Zero-Tolerance Reject
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          All endpoints strictly reject mismatches in data type, string length, regex format, or boundary limits with structured HTTP 400 Bad Request responses (never simply sanitizing or escaping bad input).
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-bold text-[var(--muted-foreground)] mr-1">Load Preset Payload:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetSchemaTest('invalid_email')}
                      className="px-2.5 py-1 bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg font-semibold text-[11px] hover:bg-red-500/25 transition-all cursor-pointer"
                    >
                      Invalid Email Format (Reject)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetSchemaTest('short_password')}
                      className="px-2.5 py-1 bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg font-semibold text-[11px] hover:bg-red-500/25 transition-all cursor-pointer"
                    >
                      Short Password / Min Length (Reject)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetSchemaTest('invalid_pin')}
                      className="px-2.5 py-1 bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg font-semibold text-[11px] hover:bg-red-500/25 transition-all cursor-pointer"
                    >
                      Non-Numeric PIN (Reject)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetSchemaTest('invalid_invoice')}
                      className="px-2.5 py-1 bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg font-semibold text-[11px] hover:bg-red-500/25 transition-all cursor-pointer"
                    >
                      Negative Invoice Rate / Empty Items (Reject)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetSchemaTest('valid_login')}
                      className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg font-semibold text-[11px] hover:bg-emerald-500/25 transition-all cursor-pointer"
                    >
                      Valid Auth Payload (Pass)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetSchemaTest('valid_invoice')}
                      className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg font-semibold text-[11px] hover:bg-emerald-500/25 transition-all cursor-pointer"
                    >
                      Valid Invoice Payload (Pass)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                    <div className="md:col-span-4 space-y-2">
                      <label className="font-semibold text-[var(--muted-foreground)] block">
                        Target API Route
                      </label>
                      <select
                        value={schemaTestEndpoint}
                        onChange={(e) => setSchemaTestEndpoint(e.target.value)}
                        className="w-full p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl font-mono text-[var(--foreground)] font-bold text-xs"
                      >
                        <option value="/api/auth/login">POST /api/auth/login (LoginSchema)</option>
                        <option value="/api/auth/signup">POST /api/auth/signup (SignupSchema)</option>
                        <option value="/api/auth/verify-pin">POST /api/auth/verify-pin (VerifyPinSchema)</option>
                        <option value="/api/auth/password-reset">POST /api/auth/password-reset (PasswordResetSchema)</option>
                        <option value="/api/invoices/save">POST /api/invoices/save (SaveInvoicePayloadSchema)</option>
                        <option value="/api/invoices/send-email">POST /api/invoices/send-email (EmailInvoiceSchema)</option>
                        <option value="/api/cms/generate-copy">POST /api/cms/generate-copy (GenerateCopySchema)</option>
                        <option value="/api/admin/rate-limit/config">POST /api/admin/rate-limit/config (RateLimitConfigSchema)</option>
                      </select>

                      <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[11px] text-[var(--muted-foreground)] space-y-1">
                        <span className="font-bold text-[var(--foreground)] block">Schema Defense Rule:</span>
                        <p>Requests are intercepted and evaluated against strict Zod type constraints. Any violation halts execution before route logic runs.</p>
                      </div>

                      <button
                        type="button"
                        disabled={schemaTestLoading}
                        onClick={handleRunSchemaTest}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{schemaTestLoading ? 'Validating Payload...' : 'Send Test Request to Server'}</span>
                      </button>
                    </div>

                    <div className="md:col-span-8 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-[var(--muted-foreground)] block">
                          Request JSON Payload
                        </label>
                        <span className="text-[10px] text-[var(--muted-foreground)] font-mono">Editable JSON</span>
                      </div>
                      <textarea
                        rows={6}
                        value={schemaTestPayload}
                        onChange={(e) => setSchemaTestPayload(e.target.value)}
                        className="w-full p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl font-mono text-xs text-[var(--foreground)] leading-relaxed focus:outline-none focus:border-indigo-500"
                      />

                      {schemaTestResult && (
                        <div
                          className={`p-3.5 rounded-xl border font-mono text-xs space-y-2 animate-in fade-in ${
                            schemaTestResult.status === 200 || schemaTestResult.status === 201
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold border-b border-current/15 pb-1.5">
                            <span className="flex items-center gap-1.5">
                              {schemaTestResult.status === 200 || schemaTestResult.status === 201 ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-500" />
                              )}
                              <span>
                                HTTP {schemaTestResult.status} {schemaTestResult.statusText || (schemaTestResult.status === 400 ? 'Schema Validation Failed' : 'Success')}
                              </span>
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/10">
                              {schemaTestResult.status === 400 ? 'REJECTED' : 'ACCEPTED'}
                            </span>
                          </div>

                          <div className="text-[11px] leading-relaxed">
                            <div className="font-semibold">{schemaTestResult.error || schemaTestResult.message}</div>
                            {schemaTestResult.details && Array.isArray(schemaTestResult.details) && (
                              <div className="mt-2 space-y-1 pt-1.5 border-t border-current/15">
                                <span className="font-bold block text-[10px] uppercase tracking-wider">Field Violations:</span>
                                {schemaTestResult.details.map((d: any, idx: number) => (
                                  <div key={idx} className="bg-black/10 dark:bg-white/10 px-2 py-1 rounded text-[11px] flex items-center gap-1.5">
                                    <span className="font-bold text-rose-600 dark:text-rose-400">[{d.field}]:</span>
                                    <span>{d.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
