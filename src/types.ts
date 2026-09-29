export interface HeroData {
  eyebrow: string;
  headlineMain: string;
  headlineAccent: string;
  subheadline: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  previewInvoice: {
    clientName: string;
    clientEmail: string;
    invoiceNumber: string;
    items: Array<{ description: string; amount: number }>;
    total: number;
    currencySymbol: string;
    status: 'Paid' | 'Sent' | 'Draft' | 'Overdue';
  };
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon name
}

export interface StatItem {
  id: string;
  number: string;
  label: string;
}

export interface StepItem {
  id: string;
  stepNumber: string;
  title: string;
  description: string;
  theme: 'ruby' | 'gold' | 'rust';
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface TestimonialItem {
  id: string;
  author: string;
  role: string;
  company: string;
  avatarUrl?: string;
  quote: string;
  rating: number;
}

export interface BankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingCode?: string; // Routing / IFSC / Sort Code / SWIFT / BIC
  iban?: string;
  upiId?: string;
  paymentInstructions?: string;
}

export interface BrandSettings {
  brandName: string;
  tagline: string;
  primaryColor: string; // e.g. #7A1E2B
  accentColor: string;  // e.g. #E8DCC8
  backgroundColor: string; // e.g. #FBF9F6
  contactEmail: string;
  logoLetter: string;
  googleSiteVerification?: string; // Google Search Console code or full meta content
  adminPin?: string; // Secret security PIN for CMS Admin panel (default: 1234)
  showAdminButtonInHeader?: boolean; // Whether the CMS Admin button is visible publicly in the header
  defaultBankDetails?: BankDetails;
}

export interface CmsContent {
  brand: BrandSettings;
  hero: HeroData;
  about: {
    eyebrow: string;
    title: string;
    paragraph1: string;
    paragraph2: string;
    stats: StatItem[];
  };
  features: {
    title: string;
    subtitle: string;
    items: FeatureItem[];
  };
  howItWorks: {
    title: string;
    steps: StepItem[];
  };
  faqs: {
    title: string;
    subtitle: string;
    items: FaqItem[];
  };
  testimonials: TestimonialItem[];
  cta: {
    headline: string;
    buttonText: string;
  };
  lastUpdated: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider?: 'google' | 'email' | 'github' | string;
  createdAt: string;
  lastLoginAt?: string;
  companyName?: string;
  businessName?: string;
  role?: string;
  onboardingCompleted?: boolean;
  password?: string;
  [key: string]: any;
}

export type UserProfile = UserAccount;

export interface CustomerOnboardingAnswers {
  businessName?: string;
  businessType?: string;
  industry?: string;
  monthlyInvoiceVolume?: string;
  primaryCurrency?: string;
  defaultTaxRate?: number;
  acceptedTerms?: boolean;
  [key: string]: any;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceData {
  id?: string;
  businessName: string;
  businessEmail: string;
  businessLogoLetter: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  taxRate: number;
  discountAmount: number;
  notes: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  currency: string;
  themeColor?: string;
  templateStyle?: 'Classic' | 'Modern' | 'Minimal';
  bankDetails?: BankDetails;
  createdAt?: string;
}
