import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BillingCycle,
  PlanCurrency,
  SubscriptionPlanId,
  UserAccount,
} from '../types';
import {
  auth,
  googleAuthProvider,
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged,
  type FirebaseUser,
} from '../lib/firebase';
import {
  syncUserProfileToFirestore,
  fetchUserProfileFromFirestore,
  recordSubscriptionPaymentToFirestore,
} from '../services/firestoreService';
import { getPlanEntitlements, PlanEntitlements } from '../data/subscriptionPlans';

interface UpgradePaymentInput {
  planId: SubscriptionPlanId;
  billingCycle: BillingCycle;
  currency: PlanCurrency;
  amount: number;
  orderId?: string;
  paymentId?: string;
}

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'signin' | 'signup';
  isFirebaseConnected: boolean;
  currentPlan: SubscriptionPlanId;
  planEntitlements: PlanEntitlements;
  openAuthModal: (tab?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signInWithGoogle: (customEmail?: string, customName?: string) => Promise<UserAccount>;
  signInWithEmail: (email: string, password: string) => Promise<UserAccount>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
    companyName?: string
  ) => Promise<UserAccount>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserAccount>) => Promise<void>;
  upgradePlan: (input: UpgradePaymentInput) => Promise<void>;
}

const LOCAL_STORAGE_USER_KEY = 'invobill_current_user_v1';
const LOCAL_STORAGE_USERS_DB_KEY = 'invobill_registered_users_db_v1';

// Seed default demo accounts
const defaultUsersDb: UserAccount[] = [
  {
    id: 'user-google-uzafa',
    email: 'uzafa.shop@gmail.com',
    name: 'Uzafa Shop',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
    provider: 'google',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastLoginAt: new Date().toISOString(),
    companyName: 'Uzafa Commerce Studio',
    plan: 'free',
    billingCycle: 'monthly',
    subscriptionStatus: 'active',
    subscriptionCurrency: 'INR',
  },
  {
    id: 'user-email-demo',
    email: 'alex@invobill.app',
    name: 'Alex Rivera',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80',
    provider: 'email',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    lastLoginAt: new Date().toISOString(),
    companyName: 'Rivera Creative Ltd',
    password: 'password123',
    plan: 'free',
    billingCycle: 'monthly',
    subscriptionStatus: 'active',
    subscriptionCurrency: 'INR',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; onAuthSuccess?: () => void }> = ({
  children,
  onAuthSuccess,
}) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Failed to parse current user from storage:', err);
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [isFirebaseConnected] = useState(true);

  const getUsersDb = (): UserAccount[] => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USERS_DB_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('Failed to parse users DB:', err);
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_DB_KEY, JSON.stringify(defaultUsersDb));
    } catch {}
    return defaultUsersDb;
  };

  const saveUsersDb = (users: UserAccount[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_DB_KEY, JSON.stringify(users));
    } catch (err) {
      console.error('Failed to save users DB:', err);
    }
  };

  const saveCurrentUser = (user: UserAccount | null) => {
    setCurrentUser(user);
    try {
      if (user) {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      }
    } catch (err) {
      console.error('Failed to store current user:', err);
    }
  };

  // Subscribe to Firebase Auth state changes and preserve any remote subscription state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const email = fbUser.email || 'uzafa.shop@gmail.com';
        const name = fbUser.displayName || email.split('@')[0];
        let existingRemote: UserAccount | null = null;
        try {
          existingRemote = await fetchUserProfileFromFirestore(fbUser.uid);
        } catch {}

        const account: UserAccount = {
          id: fbUser.uid,
          email: email,
          name: name,
          avatarUrl:
            fbUser.photoURL ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          provider: 'google',
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          companyName: existingRemote?.companyName || `${name} Studio`,
          plan: existingRemote?.plan || currentUser?.plan || 'free',
          billingCycle: existingRemote?.billingCycle || currentUser?.billingCycle || 'monthly',
          subscriptionStatus: existingRemote?.subscriptionStatus || 'active',
          subscriptionCurrency: existingRemote?.subscriptionCurrency || 'INR',
          subscriptionStartedAt: existingRemote?.subscriptionStartedAt,
          subscriptionExpiresAt: existingRemote?.subscriptionExpiresAt,
          lastPaymentId: existingRemote?.lastPaymentId,
          lastOrderId: existingRemote?.lastOrderId,
        };
        saveCurrentUser(account);
        try {
          await syncUserProfileToFirestore(account);
        } catch (e) {
          console.warn('Firestore user profile sync error:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = (tab: 'signin' | 'signup' = 'signin') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const signInWithGoogle = async (
    customEmail?: string,
    customName?: string
  ): Promise<UserAccount> => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const email = fbUser.email || customEmail || 'uzafa.shop@gmail.com';
      const name = fbUser.displayName || customName || email.split('@')[0];

      let existingRemote: UserAccount | null = null;
      try {
        existingRemote = await fetchUserProfileFromFirestore(fbUser.uid);
      } catch {}

      const account: UserAccount = {
        id: fbUser.uid,
        email: email,
        name: name,
        avatarUrl:
          fbUser.photoURL ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        provider: 'google',
        createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        companyName: existingRemote?.companyName || `${name} Studio`,
        plan: existingRemote?.plan || 'free',
        billingCycle: existingRemote?.billingCycle || 'monthly',
        subscriptionStatus: existingRemote?.subscriptionStatus || 'active',
        subscriptionCurrency: existingRemote?.subscriptionCurrency || 'INR',
        subscriptionStartedAt: existingRemote?.subscriptionStartedAt,
        subscriptionExpiresAt: existingRemote?.subscriptionExpiresAt,
        lastPaymentId: existingRemote?.lastPaymentId,
        lastOrderId: existingRemote?.lastOrderId,
      };

      saveCurrentUser(account);
      try {
        await syncUserProfileToFirestore(account);
      } catch (err) {
        console.warn('Could not sync user to Firestore:', err);
      }

      setIsAuthModalOpen(false);
      if (onAuthSuccess) onAuthSuccess();
      return account;
    } catch (firebaseErr: any) {
      console.warn('Firebase signInWithPopup fallback or blocked:', firebaseErr?.message);
      const targetEmail = customEmail || 'uzafa.shop@gmail.com';
      const targetName =
        customName ||
        targetEmail
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const db = getUsersDb();
      let account = db.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
      const now = new Date().toISOString();

      if (!account) {
        account = {
          id: `google-${Date.now()}`,
          email: targetEmail,
          name: targetName,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            targetName
          )}&backgroundColor=ea4335,4285f4,34a853,fbbc05`,
          provider: 'google',
          createdAt: now,
          lastLoginAt: now,
          companyName: `${targetName} Studio`,
          plan: 'free',
          billingCycle: 'monthly',
          subscriptionStatus: 'active',
          subscriptionCurrency: 'INR',
        };
        saveUsersDb([account, ...db]);
      } else {
        account = {
          ...account,
          lastLoginAt: now,
          plan: account.plan || 'free',
        };
        saveUsersDb(db.map((u) => (u.id === account!.id ? account! : u)));
      }

      saveCurrentUser(account);
      try {
        await syncUserProfileToFirestore(account);
      } catch (e) {
        console.warn('Firestore fallback sync error:', e);
      }

      setIsAuthModalOpen(false);
      if (onAuthSuccess) onAuthSuccess();
      return account;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<UserAccount> => {
    const cleanEmail = email.trim().toLowerCase();
    const db = getUsersDb();
    const account = db.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!account) {
      const now = new Date().toISOString();
      const generatedName = cleanEmail
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const newAcc: UserAccount = {
        id: `email-${Date.now()}`,
        email: cleanEmail,
        name: generatedName,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          generatedName
        )}&backgroundColor=FF5238,2563eb,10b981`,
        provider: 'email',
        createdAt: now,
        lastLoginAt: now,
        password: password,
        companyName: `${generatedName} Invoicing`,
        plan: 'free',
        billingCycle: 'monthly',
        subscriptionStatus: 'active',
        subscriptionCurrency: 'INR',
      };
      saveUsersDb([newAcc, ...db]);
      saveCurrentUser(newAcc);
      try {
        await syncUserProfileToFirestore(newAcc);
      } catch {}
      setIsAuthModalOpen(false);
      if (onAuthSuccess) onAuthSuccess();
      return newAcc;
    }

    if (account.password && account.password !== password) {
      throw new Error('Incorrect password. Please verify your credentials or reset password.');
    }

    const updatedAccount: UserAccount = {
      ...account,
      lastLoginAt: new Date().toISOString(),
      plan: account.plan || 'free',
    };
    saveUsersDb(db.map((u) => (u.id === updatedAccount.id ? updatedAccount : u)));
    saveCurrentUser(updatedAccount);
    try {
      await syncUserProfileToFirestore(updatedAccount);
    } catch {}
    setIsAuthModalOpen(false);
    if (onAuthSuccess) onAuthSuccess();
    return updatedAccount;
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string,
    companyName?: string
  ): Promise<UserAccount> => {
    const cleanEmail = email.trim().toLowerCase();
    const db = getUsersDb();
    const existing = db.find((u) => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      const updated: UserAccount = {
        ...existing,
        name: name.trim() || existing.name,
        companyName: companyName?.trim() || existing.companyName,
        lastLoginAt: new Date().toISOString(),
        plan: existing.plan || 'free',
      };
      saveUsersDb(db.map((u) => (u.id === updated.id ? updated : u)));
      saveCurrentUser(updated);
      try {
        await syncUserProfileToFirestore(updated);
      } catch {}
      setIsAuthModalOpen(false);
      if (onAuthSuccess) onAuthSuccess();
      return updated;
    }

    const now = new Date().toISOString();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const newAcc: UserAccount = {
      id: `email-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        cleanName
      )}&backgroundColor=FF5238,3b82f6,10b981`,
      provider: 'email',
      createdAt: now,
      lastLoginAt: now,
      companyName: companyName?.trim() || `${cleanName} Studio`,
      password: password,
      plan: 'free',
      billingCycle: 'monthly',
      subscriptionStatus: 'active',
      subscriptionCurrency: 'INR',
    };

    saveUsersDb([newAcc, ...db]);
    saveCurrentUser(newAcc);
    try {
      await syncUserProfileToFirestore(newAcc);
    } catch {}
    setIsAuthModalOpen(false);
    if (onAuthSuccess) onAuthSuccess();
    return newAcc;
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    saveCurrentUser(null);
    openAuthModal('signin');
  };

  const updateUserProfile = async (updates: Partial<UserAccount>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    saveCurrentUser(updated);
    const db = getUsersDb();
    saveUsersDb(db.map((u) => (u.id === updated.id ? updated : u)));
    try {
      await syncUserProfileToFirestore(updated);
    } catch {}
  };

  const upgradePlan = async (input: UpgradePaymentInput) => {
    const now = new Date();
    const durationDays = input.billingCycle === 'annual' ? 365 : 30;
    const expiresAt = new Date(now.getTime() + durationDays * 86400000).toISOString();
    const startedAt = now.toISOString();

    const targetUser: UserAccount = currentUser
      ? {
          ...currentUser,
          plan: input.planId,
          billingCycle: input.billingCycle,
          subscriptionStatus: 'active',
          subscriptionCurrency: input.currency,
          subscriptionStartedAt: startedAt,
          subscriptionExpiresAt: expiresAt,
          ...(input.paymentId ? { lastPaymentId: input.paymentId } : {}),
          ...(input.orderId ? { lastOrderId: input.orderId } : {}),
        }
      : {
          id: `guest-${Date.now()}`,
          email: 'uzafa.shop@gmail.com',
          name: 'Invobill Member',
          createdAt: startedAt,
          lastLoginAt: startedAt,
          plan: input.planId,
          billingCycle: input.billingCycle,
          subscriptionStatus: 'active',
          subscriptionCurrency: input.currency,
          subscriptionStartedAt: startedAt,
          subscriptionExpiresAt: expiresAt,
          lastPaymentId: input.paymentId,
          lastOrderId: input.orderId,
        };

    saveCurrentUser(targetUser);
    const dbList = getUsersDb();
    const exists = dbList.some((u) => u.id === targetUser.id);
    saveUsersDb(
      exists
        ? dbList.map((u) => (u.id === targetUser.id ? targetUser : u))
        : [targetUser, ...dbList]
    );

    if (auth.currentUser && auth.currentUser.uid === targetUser.id) {
      try {
        await syncUserProfileToFirestore(targetUser);
        if (input.paymentId && input.orderId) {
          await recordSubscriptionPaymentToFirestore(targetUser.id, {
            id: input.paymentId,
            orderId: input.orderId,
            paymentId: input.paymentId,
            planId: input.planId,
            billingCycle: input.billingCycle,
            currency: input.currency,
            amount: input.amount,
            status: 'verified',
            createdAt: startedAt,
          });
        }
      } catch (err) {
        console.warn('Firestore subscription sync skipped:', err);
      }
    }
  };

  const currentPlan: SubscriptionPlanId = currentUser?.plan || 'free';
  const planEntitlements = getPlanEntitlements(currentPlan);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAuthModalOpen,
        authModalTab,
        isFirebaseConnected,
        currentPlan,
        planEntitlements,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateUserProfile,
        upgradePlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
