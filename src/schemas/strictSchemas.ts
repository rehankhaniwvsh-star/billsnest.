import { z, ZodSchema, ZodError } from "zod";

/**
 * Strict Regex Patterns
 */
export const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
export const DATE_YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const PIN_REGEX = /^\d{4,8}$/;
export const INVOICE_NUMBER_REGEX = /^[A-Za-z0-9_#/-]{2,40}$/;

// =================================================================
// 1. AUTHENTICATION SCHEMAS
// =================================================================

export const VerifyPinSchema = z
  .object({
    pin: z
      .string()
      .trim()
      .min(4, "PIN must be at least 4 digits")
      .max(8, "PIN cannot exceed 8 digits")
      .regex(PIN_REGEX, "PIN must consist strictly of 4 to 8 numeric digits"),
    customTargetPin: z
      .string()
      .trim()
      .min(4, "Custom target PIN must be at least 4 digits")
      .max(8, "Custom target PIN cannot exceed 8 digits")
      .regex(PIN_REGEX, "Custom target PIN must consist strictly of 4 to 8 numeric digits")
      .optional(),
    account: z
      .string()
      .trim()
      .email("Must be a valid email format")
      .max(254, "Email cannot exceed 254 characters")
      .optional(),
  })
  .strict();

export const LoginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(3, "Email is too short")
      .max(254, "Email cannot exceed 254 characters")
      .email("Must be a valid email address format (e.g., user@domain.com)"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(128, "Password cannot exceed 128 characters"),
  })
  .strict();

export const SignupSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(3, "Email is too short")
      .max(254, "Email cannot exceed 254 characters")
      .email("Must be a valid email address format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters for security")
      .max(128, "Password cannot exceed 128 characters"),
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
    businessName: z
      .string()
      .trim()
      .max(120, "Business name cannot exceed 120 characters")
      .optional(),
    role: z
      .string()
      .trim()
      .max(50)
      .optional(),
  })
  .strict();

export const PasswordResetSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(3, "Email is too short")
      .max(254, "Email cannot exceed 254 characters")
      .email("Must be a valid email address format"),
  })
  .strict();

// =================================================================
// 2. INVOICE STUDIO & ITEM SCHEMAS
// =================================================================

export const InvoiceItemSchema = z
  .object({
    id: z
      .string()
      .min(1, "Item ID cannot be empty")
      .max(64, "Item ID exceeds maximum length"),
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(500, "Description cannot exceed 500 characters"),
    quantity: z
      .number()
      .positive("Quantity must be greater than 0")
      .max(1000000, "Quantity exceeds realistic ceiling (1,000,000)"),
    rate: z
      .number()
      .min(0, "Rate cannot be negative")
      .max(1000000000, "Rate exceeds ceiling (1,000,000,000)"),
  })
  .strict();

export const BankDetailsSchema = z
  .object({
    bankName: z.string().trim().max(100, "Bank name cannot exceed 100 characters").optional().default(""),
    accountName: z.string().trim().max(120, "Account name cannot exceed 120 characters").optional().default(""),
    accountNumber: z.string().trim().max(60, "Account number cannot exceed 60 characters").optional().default(""),
    routingCode: z.string().trim().max(60, "Routing/IFSC code cannot exceed 60 characters").optional().default(""),
    iban: z.string().trim().max(60, "IBAN cannot exceed 60 characters").optional().default(""),
    upiId: z.string().trim().max(80, "UPI ID cannot exceed 80 characters").optional().default(""),
    paymentInstructions: z.string().trim().max(500, "Payment instructions cannot exceed 500 characters").optional().default(""),
  })
  .strict();

export const InvoiceSchema = z
  .object({
    id: z.string().optional(),
    invoiceNumber: z
      .string()
      .trim()
      .min(2, "Invoice number must be at least 2 characters")
      .max(40, "Invoice number cannot exceed 40 characters")
      .regex(INVOICE_NUMBER_REGEX, "Invoice number contains invalid characters"),
    businessName: z
      .string()
      .trim()
      .max(120, "Business name cannot exceed 120 characters")
      .default(""),
    businessEmail: z
      .string()
      .trim()
      .max(254, "Business email cannot exceed 254 characters")
      .refine(
        (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        "Business email must be a valid email address if provided"
      )
      .default(""),
    businessLogoLetter: z.string().optional().default("I"),
    businessLogoUrl: z
      .string()
      .max(2000000, "Business logo image size is too large")
      .optional()
      .default(""),
    ownerName: z
      .string()
      .trim()
      .max(120, "Owner name cannot exceed 120 characters")
      .optional()
      .default(""),
    gstNumber: z
      .string()
      .trim()
      .max(60, "GST/VAT number cannot exceed 60 characters")
      .optional()
      .default(""),
    businessPhone: z
      .string()
      .trim()
      .max(30, "Business phone cannot exceed 30 characters")
      .optional()
      .default(""),
    businessWebsite: z
      .string()
      .trim()
      .max(200, "Business website cannot exceed 200 characters")
      .optional()
      .default(""),
    businessAddress: z
      .string()
      .trim()
      .max(300, "Business address cannot exceed 300 characters")
      .optional()
      .default(""),
    clientName: z
      .string()
      .trim()
      .max(120, "Client name cannot exceed 120 characters")
      .default(""),
    clientEmail: z
      .string()
      .trim()
      .max(254, "Client email cannot exceed 254 characters")
      .refine(
        (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        "Client email must be a valid email address if provided"
      )
      .default(""),
    clientPhone: z
      .string()
      .trim()
      .max(30, "Client phone cannot exceed 30 characters")
      .optional()
      .default(""),
    clientGst: z
      .string()
      .trim()
      .max(60, "Client GST/VAT cannot exceed 60 characters")
      .optional()
      .default(""),
    clientAddress: z
      .string()
      .trim()
      .max(300, "Client address cannot exceed 300 characters")
      .optional()
      .default(""),
    issueDate: z
      .string()
      .trim()
      .regex(DATE_YYYY_MM_DD_REGEX, "Issue date must be in YYYY-MM-DD format")
      .default(() => new Date().toISOString().split("T")[0]),
    dueDate: z
      .string()
      .trim()
      .regex(DATE_YYYY_MM_DD_REGEX, "Due date must be in YYYY-MM-DD format")
      .default(() => new Date().toISOString().split("T")[0]),
    currency: z
      .string()
      .trim()
      .min(1, "Currency symbol is required")
      .max(10, "Currency code/symbol cannot exceed 10 characters")
      .default("₹"),
    taxRate: z
      .number()
      .min(0, "Tax rate cannot be negative")
      .max(100, "Tax rate cannot exceed 100%")
      .default(0),
    taxType: z.enum(["add", "deduct"]).optional().default("add"),
    discountAmount: z
      .number()
      .min(0, "Discount amount cannot be negative")
      .max(1000000000, "Discount cannot exceed invoice boundary")
      .default(0),
    discountType: z.enum(["amount", "percentage"]).optional().default("amount"),
    notes: z
      .string()
      .trim()
      .max(1000, "Notes cannot exceed 1,000 characters")
      .default(""),
    status: z
      .enum(["Draft", "Sent", "Paid", "Overdue"])
      .default("Draft"),
    items: z
      .array(InvoiceItemSchema)
      .min(1, "Invoice must contain at least one item")
      .max(200, "Invoice cannot exceed 200 line items"),
    themeColor: z.string().optional(),
    templateStyle: z.enum(["Classic", "Modern", "Minimal"]).optional(),
    bankDetails: BankDetailsSchema.optional(),
    showBankDetails: z.boolean().optional().default(true),
    hideWatermark: z.boolean().optional().default(false),
    createdAt: z.string().optional(),
  })
  .strict();

export const SaveInvoicePayloadSchema = z
  .object({
    invoice: InvoiceSchema,
  })
  .strict();

export const CreateOrderSchema = z
  .object({
    amount: z
      .number()
      .int("Amount must be an integer in smallest currency unit (paise/cents)")
      .min(100, "Minimum order amount is 100 paise/cents"),
    currency: z.enum(["INR", "USD"]).default("INR"),
    receipt: z.string().trim().min(3).max(40),
    planId: z.enum(["free", "pro", "business"]).optional(),
    billingCycle: z.enum(["monthly", "annual"]).optional(),
    invoiceId: z.string().trim().max(64).optional(),
    notes: z.record(z.string(), z.string()).optional(),
  })
  .strict();

export const VerifyPaymentSchema = z
  .object({
    razorpay_order_id: z.string().trim().min(5, "Missing razorpay_order_id").max(100),
    razorpay_payment_id: z.string().trim().min(5, "Missing razorpay_payment_id").max(100),
    razorpay_signature: z.string().trim().min(10, "Missing razorpay_signature").max(200),
    planId: z.enum(["free", "pro", "business"]).optional(),
    billingCycle: z.enum(["monthly", "annual"]).optional(),
    currency: z.enum(["INR", "USD"]).optional(),
    amount: z.number().min(0).optional(),
    invoiceId: z.string().trim().max(64).optional(),
  })
  .strict();

export const SubmitRatingSchema = z
  .object({
    rating: z
      .number()
      .int("Rating must be a whole number between 1 and 5")
      .min(1, "Please select at least 1 star")
      .max(5, "Rating cannot exceed 5 stars"),
    message: z
      .string()
      .trim()
      .min(2, "Please enter a short message (at least 2 characters)")
      .max(400, "Message cannot exceed 400 characters"),
    authorName: z
      .string()
      .trim()
      .max(80, "Name cannot exceed 80 characters")
      .optional()
      .default("Invobill User"),
  })
  .strict();

export const EmailInvoiceSchema = z
  .object({
    recipient: z
      .string()
      .trim()
      .min(3, "Recipient email is required")
      .max(254, "Recipient email cannot exceed 254 characters")
      .email("Must be a valid recipient email address format (e.g. client@domain.com)")
      .optional(),
    recipientEmail: z
      .string()
      .trim()
      .min(3, "Recipient email is required")
      .max(254, "Recipient email cannot exceed 254 characters")
      .email("Must be a valid recipient email address format")
      .optional(),
    subject: z
      .string()
      .trim()
      .min(1, "Email subject cannot be empty")
      .max(200, "Email subject cannot exceed 200 characters"),
    message: z
      .string()
      .trim()
      .max(2000, "Email message body cannot exceed 2,000 characters")
      .default(""),
    invoiceNumber: z
      .string()
      .trim()
      .min(2, "Invoice number must be at least 2 characters")
      .max(40, "Invoice number cannot exceed 40 characters")
      .regex(INVOICE_NUMBER_REGEX, "Invoice number contains invalid characters")
      .optional(),
    invoiceId: z
      .string()
      .trim()
      .min(1, "Invoice ID cannot be empty")
      .max(64, "Invoice ID exceeds 64 characters")
      .optional(),
    invoiceData: InvoiceSchema.optional(),
  })
  .strict()
  .refine(
    (data) => Boolean(data.recipient || data.recipientEmail),
    {
      message: "Recipient email must be provided and must be a valid email format.",
      path: ["recipient"],
    }
  );

// =================================================================
// 3. RATE LIMITING CONFIGURATION SCHEMA
// =================================================================

export const AuthRateLimitConfigSchema = z
  .object({
    ipMaxAttempts: z
      .number()
      .int("IP max attempts must be an integer")
      .min(1, "Must allow at least 1 attempt")
      .max(100, "Cannot exceed 100 attempts"),
    accountMaxAttempts: z
      .number()
      .int("Account max attempts must be an integer")
      .min(1, "Must allow at least 1 attempt")
      .max(50, "Cannot exceed 50 attempts"),
    baseBackoffMs: z
      .number()
      .int("Base backoff must be an integer in milliseconds")
      .min(100, "Base backoff must be at least 100ms")
      .max(60000, "Base backoff cannot exceed 60,000ms"),
    backoffFactor: z
      .number()
      .min(1.1, "Backoff multiplier must be at least 1.1")
      .max(10, "Backoff multiplier cannot exceed 10"),
    maxBackoffMs: z
      .number()
      .int("Max backoff cap must be an integer in milliseconds")
      .min(1000, "Max backoff must be at least 1,000ms")
      .max(86400000, "Max backoff cannot exceed 24 hours (86,400,000ms)"),
    resetWindowMs: z
      .number()
      .int("Reset window must be an integer in milliseconds")
      .min(5000, "Reset window must be at least 5,000ms")
      .max(86400000, "Reset window cannot exceed 24 hours"),
  })
  .strict();

export const StandardRateLimitConfigSchema = z
  .object({
    maxRequests: z
      .number()
      .int("Max requests must be an integer")
      .min(1, "Must allow at least 1 request")
      .max(10000, "Max requests cannot exceed 10,000"),
    windowMs: z
      .number()
      .int("Window duration must be an integer in milliseconds")
      .min(1000, "Window duration must be at least 1,000ms")
      .max(86400000, "Window duration cannot exceed 24 hours"),
  })
  .strict();

export const RateLimitConfigSchema = z
  .object({
    config: z
      .object({
        authRoutes: AuthRateLimitConfigSchema,
        public: StandardRateLimitConfigSchema,
        authenticatedUser: StandardRateLimitConfigSchema,
      })
      .strict(),
  })
  .strict();

// =================================================================
// 4. CMS & COPY GENERATION SCHEMAS
// =================================================================

export const GenerateCopySchema = z
  .object({
    prompt: z
      .string()
      .trim()
      .min(2, "Prompt must be at least 2 characters")
      .max(1000, "Prompt cannot exceed 1,000 characters"),
    contentType: z
      .enum(["hero_headline", "hero_subheadline", "feature_pitch", "seo_description", "cta_button", "email_subject", "custom"])
      .default("custom"),
    currentText: z
      .string()
      .trim()
      .max(2000, "Context text cannot exceed 2,000 characters")
      .optional(),
  })
  .strict();

export const CmsBrandSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    tagline: z.string().trim().max(150),
    primaryColor: z.string().trim().regex(HEX_COLOR_REGEX, "Primary color must be valid Hex"),
    accentColor: z.string().trim().regex(HEX_COLOR_REGEX, "Accent color must be valid Hex"),
    logoUrl: z.string().trim().max(500),
    darkThemeByDefault: z.boolean(),
  })
  .strict();

export const CmsHeroSchema = z
  .object({
    badge: z.string().trim().max(100),
    headline: z.string().trim().min(1).max(200),
    headlineAccent: z.string().trim().max(100),
    subheadline: z.string().trim().min(1).max(500),
    primaryCtaText: z.string().trim().min(1).max(60),
    secondaryCtaText: z.string().trim().min(1).max(60),
    stats: z.array(
      z
        .object({
          label: z.string().trim().min(1).max(50),
          value: z.string().trim().min(1).max(30),
          growth: z.string().trim().max(30),
        })
        .strict()
    ),
  })
  .strict();

export const CmsFeatureItemSchema = z
  .object({
    id: z.string().min(1).max(64),
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(400),
    icon: z.string().trim().min(1).max(50),
    badge: z.string().trim().max(50).optional(),
    highlight: z.boolean().optional(),
  })
  .strict();

export const CmsFeaturesSchema = z
  .object({
    sectionTitle: z.string().trim().min(1).max(150),
    sectionSubtitle: z.string().trim().max(300),
    items: z.array(CmsFeatureItemSchema).max(30),
  })
  .strict();

export const CmsWorkflowStepSchema = z
  .object({
    step: z.number().int().min(1).max(20),
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(400),
    icon: z.string().trim().min(1).max(50),
  })
  .strict();

export const CmsWorkflowSchema = z
  .object({
    sectionTitle: z.string().trim().min(1).max(150),
    sectionSubtitle: z.string().trim().max(300),
    steps: z.array(CmsWorkflowStepSchema).max(20),
  })
  .strict();

export const CmsPricingTierSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(60),
    price: z.string().trim().min(1).max(40),
    period: z.string().trim().max(30),
    description: z.string().trim().max(250),
    popular: z.boolean(),
    ctaText: z.string().trim().min(1).max(50),
    features: z.array(z.string().trim().min(1).max(150)).max(30),
  })
  .strict();

export const CmsPricingSchema = z
  .object({
    sectionTitle: z.string().trim().min(1).max(150),
    sectionSubtitle: z.string().trim().max(300),
    tiers: z.array(CmsPricingTierSchema).max(10),
  })
  .strict();

export const CmsTestimonialSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(80),
    role: z.string().trim().max(80),
    company: z.string().trim().max(80),
    quote: z.string().trim().min(1).max(600),
    avatar: z.string().trim().max(500),
    rating: z.number().min(1).max(5),
  })
  .strict();

export const CmsTestimonialsSectionSchema = z
  .object({
    sectionTitle: z.string().trim().min(1).max(150),
    sectionSubtitle: z.string().trim().max(300),
    items: z.array(CmsTestimonialSchema).max(30),
  })
  .strict();

export const CmsFaqItemSchema = z
  .object({
    id: z.string().min(1).max(64),
    question: z.string().trim().min(1).max(250),
    answer: z.string().trim().min(1).max(1000),
    category: z.string().trim().max(60),
  })
  .strict();

export const CmsFaqSectionSchema = z
  .object({
    sectionTitle: z.string().trim().min(1).max(150),
    sectionSubtitle: z.string().trim().max(300),
    items: z.array(CmsFaqItemSchema).max(50),
  })
  .strict();

export const CmsSeoSchema = z
  .object({
    metaTitle: z.string().trim().min(1).max(120),
    metaDescription: z.string().trim().min(1).max(300),
    keywords: z.string().trim().max(500),
    canonicalUrl: z.string().trim().max(500),
    ogImage: z.string().trim().max(500),
  })
  .strict();

export const CmsFooterSchema = z
  .object({
    copyrightText: z.string().trim().max(200),
    links: z.array(
      z
        .object({
          label: z.string().trim().min(1).max(50),
          url: z.string().trim().min(1).max(300),
        })
        .strict()
    ),
  })
  .strict();

export const FullCmsContentSchema = z
  .object({
    brand: CmsBrandSchema,
    hero: CmsHeroSchema,
    features: CmsFeaturesSchema,
    workflow: CmsWorkflowSchema,
    pricing: CmsPricingSchema,
    testimonials: CmsTestimonialsSectionSchema,
    faq: CmsFaqSectionSchema,
    seo: CmsSeoSchema,
    footer: CmsFooterSchema,
    lastUpdated: z.string().optional(),
  })
  .strict();

export const SaveCmsPayloadSchema = z
  .object({
    cms: FullCmsContentSchema.optional(),
    brand: CmsBrandSchema.optional(),
    pin: z
      .string()
      .trim()
      .min(4, "PIN must be at least 4 digits")
      .max(8, "PIN cannot exceed 8 digits")
      .regex(PIN_REGEX, "PIN must consist strictly of 4 to 8 numeric digits")
      .optional(),
  })
  .strict()
  .refine(
    (data) => Boolean(data.cms || data.brand || data.pin),
    {
      message: "Payload must contain valid cms, brand, or pin to update.",
      path: ["root"],
    }
  );

export const CmsSavePayloadSchema = SaveCmsPayloadSchema;

// =================================================================
// 5. HELPER FUNCTIONS & FORMATTERS
// =================================================================

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  expected?: string;
  received?: string;
}

export interface FormattedValidationResult {
  summary: string;
  details: ValidationErrorDetail[];
}

export type StrictValidationResult<T> =
  | { success: true; data: T; error?: never; details?: never }
  | { success: false; error: string; details: ValidationErrorDetail[]; data?: never };

/**
 * Transforms ZodError into structured validation details and human-readable summary
 */
export function formatZodErrors(error: ZodError): FormattedValidationResult {
  const details: ValidationErrorDetail[] = (error.issues || []).map((issue) => {
    const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "root";
    return {
      field: fieldPath,
      message: issue.message,
      code: issue.code,
    };
  });

  const firstError = details[0];
  const summary = firstError
    ? `Validation error in field '${firstError.field}': ${firstError.message}`
    : "Payload failed strict schema validation.";

  return { summary, details };
}

/**
 * Client-side validation runner that returns strongly typed data or formatted errors
 */
export function validateStrict<T>(
  schema: ZodSchema<T>,
  data: unknown
): StrictValidationResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formatted = formatZodErrors(result.error);
    return {
      success: false,
      error: formatted.summary,
      details: formatted.details,
    };
  }
  return {
    success: true,
    data: result.data,
  };
}
