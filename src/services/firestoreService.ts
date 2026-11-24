import {
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
} from '../lib/firebase';
import {
  InvoiceData,
  SubscriptionPaymentRecord,
  TestimonialItem,
  UserAccount,
} from '../types';

/**
 * Sync user profile (including active subscription tier) to Firestore
 */
export async function syncUserProfileToFirestore(user: UserAccount): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const userDocRef = doc(db, 'users', user.id);
    const cleanPayload: Record<string, any> = {
      uid: user.id,
      email: user.email,
      displayName: user.name || '',
      photoURL: user.avatarUrl || '',
      companyName: user.companyName || '',
      role: user.role || '',
      onboardingCompleted: user.onboardingCompleted ?? false,
      plan: user.plan || 'free',
      billingCycle: user.billingCycle || 'monthly',
      subscriptionStatus: user.subscriptionStatus || 'active',
      subscriptionCurrency: user.subscriptionCurrency || 'INR',
      createdAt: user.createdAt || new Date().toISOString(),
      lastLoginAt: user.lastLoginAt || new Date().toISOString(),
    };

    if (user.subscriptionStartedAt) {
      cleanPayload.subscriptionStartedAt = user.subscriptionStartedAt;
    }
    if (user.subscriptionExpiresAt) {
      cleanPayload.subscriptionExpiresAt = user.subscriptionExpiresAt;
    }
    if (user.lastPaymentId) {
      cleanPayload.lastPaymentId = user.lastPaymentId;
    }
    if (user.lastOrderId) {
      cleanPayload.lastOrderId = user.lastOrderId;
    }

    await setDoc(userDocRef, cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch user profile (and subscription state) from Firestore
 */
export async function fetchUserProfileFromFirestore(userId: string): Promise<UserAccount | null> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: data.uid,
      email: data.email,
      name: data.displayName || data.email.split('@')[0],
      avatarUrl: data.photoURL,
      provider: 'google',
      createdAt: data.createdAt || new Date().toISOString(),
      lastLoginAt: data.lastLoginAt || new Date().toISOString(),
      companyName: data.companyName,
      role: data.role || '',
      onboardingCompleted: data.onboardingCompleted ?? true,
      plan: data.plan || 'free',
      billingCycle: data.billingCycle || 'monthly',
      subscriptionStatus: data.subscriptionStatus || 'active',
      subscriptionCurrency: data.subscriptionCurrency || 'INR',
      subscriptionStartedAt: data.subscriptionStartedAt,
      subscriptionExpiresAt: data.subscriptionExpiresAt,
      lastPaymentId: data.lastPaymentId,
      lastOrderId: data.lastOrderId,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Record an immutable verified Razorpay subscription payment under /users/{userId}/payments/{paymentId}
 */
export async function recordSubscriptionPaymentToFirestore(
  userId: string,
  payment: SubscriptionPaymentRecord
): Promise<void> {
  const safeId = (payment.paymentId || payment.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${userId}/payments/${safeId}`;
  try {
    const paymentRef = doc(db, 'users', userId, 'payments', safeId);
    await setDoc(paymentRef, {
      userId,
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      planId: payment.planId,
      billingCycle: payment.billingCycle,
      currency: payment.currency,
      amount: payment.amount,
      status: 'verified',
      createdAt: payment.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Save or update an invoice in Firestore under /users/{userId}/invoices/{invoiceId}
 */
export async function saveInvoiceToFirestore(
  userId: string,
  invoice: InvoiceData
): Promise<void> {
  const invoiceId = invoice.id || invoice.invoiceNumber;
  const path = `users/${userId}/invoices/${invoiceId}`;
  try {
    const invoiceDocRef = doc(db, 'users', userId, 'invoices', invoiceId);
    const payload = {
      userId: userId,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName || 'Client',
      clientEmail: invoice.clientEmail || '',
      clientPhone: invoice.clientPhone || '',
      clientGst: invoice.clientGst || '',
      clientAddress: invoice.clientAddress || '',
      businessName: invoice.businessName || '',
      businessEmail: invoice.businessEmail || '',
      businessLogoLetter: invoice.businessLogoLetter || 'I',
      businessLogoUrl: invoice.businessLogoUrl || '',
      ownerName: invoice.ownerName || '',
      gstNumber: invoice.gstNumber || '',
      businessPhone: invoice.businessPhone || '',
      businessWebsite: invoice.businessWebsite || '',
      businessAddress: invoice.businessAddress || '',
      currency: invoice.currency || '₹',
      issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate || new Date().toISOString().split('T')[0],
      status: invoice.status || 'Draft',
      taxRate: invoice.taxRate ?? 0,
      taxType: invoice.taxType || 'add',
      discountAmount: invoice.discountAmount ?? 0,
      discountType: invoice.discountType || 'amount',
      notes: invoice.notes || '',
      themeColor: invoice.themeColor || '#FF5238',
      templateStyle: invoice.templateStyle || 'Modern',
      items: invoice.items || [],
      bankDetails: invoice.bankDetails || {},
      showBankDetails: invoice.showBankDetails ?? true,
      hideWatermark: invoice.hideWatermark ?? false,
      createdAt: invoice.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(invoiceDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete an invoice from Firestore
 */
export async function deleteInvoiceFromFirestore(
  userId: string,
  invoiceId: string
): Promise<void> {
  const path = `users/${userId}/invoices/${invoiceId}`;
  try {
    const invoiceDocRef = doc(db, 'users', userId, 'invoices', invoiceId);
    await deleteDoc(invoiceDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time subscription to user invoices in Firestore
 */
export function subscribeToUserInvoices(
  userId: string,
  onInvoices: (invoices: InvoiceData[]) => void
): () => void {
  const path = `users/${userId}/invoices`;
  try {
    const invoicesColRef = collection(db, 'users', userId, 'invoices');
    const unsubscribe = onSnapshot(
      invoicesColRef,
      (snapshot) => {
        const list: InvoiceData[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: docSnap.id,
            businessName: d.businessName || '',
            businessEmail: d.businessEmail || '',
            businessLogoLetter:
              d.businessLogoLetter ||
              (d.businessName ? d.businessName.charAt(0).toUpperCase() : 'I'),
            businessLogoUrl: d.businessLogoUrl || '',
            ownerName: d.ownerName || '',
            gstNumber: d.gstNumber || '',
            businessPhone: d.businessPhone || '',
            businessWebsite: d.businessWebsite || '',
            businessAddress: d.businessAddress || '',
            clientName: d.clientName || '',
            clientEmail: d.clientEmail || '',
            clientPhone: d.clientPhone || '',
            clientGst: d.clientGst || '',
            clientAddress: d.clientAddress || '',
            invoiceNumber: d.invoiceNumber || docSnap.id,
            issueDate: d.issueDate || '',
            dueDate: d.dueDate || '',
            items: d.items || [],
            taxRate: d.taxRate ?? 0,
            taxType: d.taxType || 'add',
            discountAmount: d.discountAmount ?? 0,
            discountType: d.discountType || 'amount',
            notes: d.notes || '',
            status: d.status || 'Draft',
            currency: d.currency || '₹',
            themeColor: d.themeColor || '#FF5238',
            templateStyle: d.templateStyle || 'Modern',
            bankDetails: d.bankDetails || {},
            showBankDetails: d.showBankDetails ?? true,
            hideWatermark: d.hideWatermark ?? false,
            createdAt: d.createdAt,
          });
        });
        onInvoices(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export interface ClientSuggestion {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientGst?: string;
  clientAddress?: string;
  lastInvoiceNumber?: string;
  lastIssueDate?: string;
  source: 'firestore' | 'local';
}

const GENERIC_CLIENT_NAMES = new Set(['new client', 'customer name', 'client', 'valued client']);

/**
 * Deduplicate and merge client profiles from local invoices and Firestore records
 */
export function buildClientSuggestions(
  localInvoices: InvoiceData[],
  remoteClients: ClientSuggestion[] = []
): ClientSuggestion[] {
  const byKey = new Map<string, ClientSuggestion>();

  const upsert = (entry: ClientSuggestion) => {
    const cleanName = (entry.clientName || '').trim();
    if (!cleanName || GENERIC_CLIENT_NAMES.has(cleanName.toLowerCase())) {
      return;
    }
    const cleanEmail = (entry.clientEmail || '').trim();
    const key = `${cleanName.toLowerCase()}::${cleanEmail.toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        ...entry,
        clientName: cleanName,
        clientEmail: cleanEmail,
      });
      return;
    }

    byKey.set(key, {
      clientName: cleanName,
      clientEmail: existing.clientEmail || cleanEmail,
      clientPhone: existing.clientPhone || entry.clientPhone,
      clientGst: existing.clientGst || entry.clientGst,
      clientAddress: existing.clientAddress || entry.clientAddress,
      lastInvoiceNumber: existing.lastInvoiceNumber || entry.lastInvoiceNumber,
      lastIssueDate:
        (existing.lastIssueDate || '') >= (entry.lastIssueDate || '')
          ? existing.lastIssueDate
          : entry.lastIssueDate,
      source: existing.source === 'firestore' ? 'firestore' : entry.source,
    });
  };

  remoteClients.forEach(upsert);
  localInvoices.forEach((inv) => {
    upsert({
      clientName: inv.clientName || '',
      clientEmail: inv.clientEmail || '',
      clientPhone: inv.clientPhone || '',
      clientGst: inv.clientGst || '',
      clientAddress: inv.clientAddress || '',
      lastInvoiceNumber: inv.invoiceNumber,
      lastIssueDate: inv.issueDate || inv.createdAt || '',
      source: 'local',
    });
  });

  return Array.from(byKey.values()).sort((a, b) =>
    (b.lastIssueDate || '').localeCompare(a.lastIssueDate || '')
  );
}

/**
 * Fetch unique client details from a user's previous Firestore invoices
 */
export async function fetchPreviousClientsFromFirestore(
  userId: string
): Promise<ClientSuggestion[]> {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    return [];
  }
  const path = `users/${userId}/invoices`;
  try {
    const colRef = collection(db, 'users', userId, 'invoices');
    const snapshot = await getDocs(colRef);
    const items: ClientSuggestion[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      items.push({
        clientName: d.clientName || '',
        clientEmail: d.clientEmail || '',
        clientPhone: d.clientPhone || '',
        clientGst: d.clientGst || '',
        clientAddress: d.clientAddress || '',
        lastInvoiceNumber: d.invoiceNumber || docSnap.id,
        lastIssueDate: d.issueDate || d.updatedAt || d.createdAt || '',
        source: 'firestore',
      });
    });
    return buildClientSuggestions([], items);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export interface SubmitTestimonialInput {
  author: string;
  role?: string;
  company?: string;
  quote: string;
  rating: number;
}

/**
 * Submit a verified user testimonial to Firestore under /testimonials/{testimonialId}
 */
export async function submitTestimonialToFirestore(
  input: SubmitTestimonialInput
): Promise<TestimonialItem> {
  const currentFbUser = auth.currentUser;
  if (!currentFbUser) {
    throw new Error('Please sign in with Google before publishing your testimonial.');
  }

  const author = input.author.trim().slice(0, 80);
  const role = (input.role || '').trim().slice(0, 80);
  const company = (input.company || '').trim().slice(0, 80);
  const quote = input.quote.trim().slice(0, 500);
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));

  const testimonialId = `tst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `testimonials/${testimonialId}`;

  try {
    const ref = doc(db, 'testimonials', testimonialId);
    await setDoc(ref, {
      userId: currentFbUser.uid,
      author,
      role,
      company,
      quote,
      rating,
      createdAt: serverTimestamp(),
    });

    return {
      id: testimonialId,
      userId: currentFbUser.uid,
      author,
      role,
      company,
      quote,
      rating,
      createdAt: new Date().toISOString(),
      source: 'firestore',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Real-time subscription to public testimonials stored in Firestore
 */
export function subscribeToTestimonials(
  onTestimonials: (testimonials: TestimonialItem[]) => void
): () => void {
  const path = 'testimonials';
  try {
    const q = query(
      collection(db, 'testimonials'),
      orderBy('createdAt', 'desc'),
      limit(24)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: TestimonialItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          let createdAtIso = '';
          if (d.createdAt instanceof Timestamp) {
            createdAtIso = d.createdAt.toDate().toISOString();
          } else if (typeof d.createdAt === 'string') {
            createdAtIso = d.createdAt;
          }
          list.push({
            id: docSnap.id,
            userId: typeof d.userId === 'string' ? d.userId : undefined,
            author: typeof d.author === 'string' ? d.author : 'Invobill User',
            role: typeof d.role === 'string' ? d.role : '',
            company: typeof d.company === 'string' ? d.company : '',
            quote: typeof d.quote === 'string' ? d.quote : '',
            rating: typeof d.rating === 'number' ? d.rating : 5,
            createdAt: createdAtIso,
            source: 'firestore',
          });
        });
        onTestimonials(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

/**
 * Allow an authenticated author to delete their own testimonial from Firestore
 */
export async function deleteTestimonialFromFirestore(testimonialId: string): Promise<void> {
  const path = `testimonials/${testimonialId}`;
  try {
    await deleteDoc(doc(db, 'testimonials', testimonialId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

