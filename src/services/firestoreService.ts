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
  serverTimestamp,
} from 'firebase/firestore';
import { InvoiceData, UserAccount } from '../types';

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfileToFirestore(user: UserAccount): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const userDocRef = doc(db, 'users', user.id);
    const cleanPayload = {
      uid: user.id,
      email: user.email,
      displayName: user.name || '',
      photoURL: user.avatarUrl || '',
      companyName: user.companyName || '',
      createdAt: user.createdAt || new Date().toISOString(),
      lastLoginAt: user.lastLoginAt || new Date().toISOString(),
    };
    await setDoc(userDocRef, cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch user profile from Firestore
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
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
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
      clientAddress: invoice.clientAddress || '',
      businessName: invoice.businessName || '',
      businessEmail: invoice.businessEmail || '',
      currency: invoice.currency || '₹',
      issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate || new Date().toISOString().split('T')[0],
      status: invoice.status || 'Draft',
      taxRate: invoice.taxRate ?? 0,
      discountAmount: invoice.discountAmount ?? 0,
      notes: invoice.notes || '',
      themeColor: invoice.themeColor || '#FF5238',
      templateStyle: invoice.templateStyle || 'Modern',
      items: invoice.items || [],
      bankDetails: invoice.bankDetails || {},
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
            businessLogoLetter: d.businessName ? d.businessName.charAt(0) : 'B',
            clientName: d.clientName || '',
            clientEmail: d.clientEmail || '',
            clientAddress: d.clientAddress || '',
            invoiceNumber: d.invoiceNumber || docSnap.id,
            issueDate: d.issueDate || '',
            dueDate: d.dueDate || '',
            items: d.items || [],
            taxRate: d.taxRate ?? 0,
            discountAmount: d.discountAmount ?? 0,
            notes: d.notes || '',
            status: d.status || 'Draft',
            currency: d.currency || '₹',
            themeColor: d.themeColor || '#FF5238',
            templateStyle: d.templateStyle || 'Modern',
            bankDetails: d.bankDetails || {},
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
