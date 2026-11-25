import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
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

export interface GoogleAuthResult {
  account: UserAccount;
  isNewUser: boolean;
  needsProfileCompletion: boolean;
}

export interface CompleteSignUpInput {
  name: string;
  companyName: string;
  role?: string;
}

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  needsSignUpCompletion: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'signin' | 'signup';
  isFirebaseConnected: boolean;
  currentPlan: SubscriptionPlanId;
  planEntitlements: PlanEntitlements;
  openAuthModal: (tab?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  authenticateWithGoogle: (mode: 'signup' | 'login') => Promise<GoogleAuthResult>;
  completeGoogleSignUp: (input: CompleteSignUpInput) => Promise<UserAccount>;
  signInWithGoogle: (customEmail?: string, customName?: string) => Promise<UserAccount>;
  signInWithEmail: (email: string, password: string) => Promise<UserAccount>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
    companyName?: string,
    role?: string
  ) => Promise<UserAccount>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserAccount>) => Promise<void>;
  upgradePlan: (input: UpgradePaymentInput) => Promise<void>;
}

const LOCAL_STORAGE_USER_KEY = 'invobill_current_user_v1';

function detectProvider(fbUser: FirebaseUser): 'google' | 'email' {
  const hasGoogle = fbUser.providerData?.some((p) => p.providerId === 'google.com');
  return hasGoogle ? 'google' : 'email';
}

function buildAccountFromFirebaseUser(
  fbUser: FirebaseUser,
  existingRemote: UserAccount | null
): UserAccount {
  const email = fbUser.email || existingRemote?.email || '';
  const fallbackName = email ? email.split('@')[0] : 'Invobill User';
  const name = existingRemote?.name || fbUser.displayName || fallbackName;
  const now = new Date().toISOString();
  const provider = detectProvider(fbUser);

  // Email/password sign-up already collects profile details in the sign-up form;
  // brand-new Google users complete Step 2 onboarding first.
  const onboardingCompleted = existingRemote
    ? existingRemote.onboardingCompleted !== false
    : provider === 'email';

  return {
    id: fbUser.uid,
    email,
    name,
    avatarUrl:
      fbUser.photoURL ||
      existingRemote?.avatarUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    provider,
    createdAt: existingRemote?.createdAt || fbUser.metadata.creationTime || now,
    lastLoginAt: now,
    companyName: existingRemote?.companyName || '',
    role: existingRemote?.role || '',
    onboardingCompleted,
    plan: existingRemote?.plan || 'free',
    billingCycle: existingRemote?.billingCycle || 'monthly',
    subscriptionStatus: existingRemote?.subscriptionStatus || 'active',
    subscriptionCurrency: existingRemote?.subscriptionCurrency || 'INR',
    subscriptionStartedAt: existingRemote?.subscriptionStartedAt,
    subscriptionExpiresAt: existingRemote?.subscriptionExpiresAt,
    lastPaymentId: existingRemote?.lastPaymentId,
    lastOrderId: existingRemote?.lastOrderId,
  };
}

function formatFirebaseAuthError(err: any): Error & { code?: string } {
  const code = err?.code || '';
  const createAuthError = (message: string): Error & { code?: string } => {
    const wrapped = new Error(message) as Error & { code?: string };
    wrapped.code = code;
    return wrapped;
  };

  if (code === 'auth/popup-closed-by-user') {
    return createAuthError('Google sign-in window was closed before completing. Please try again.');
  }
  if (code === 'auth/cancelled-popup-request') {
    return createAuthError('Another sign-in window was opened. Please complete the active Google prompt.');
  }
  if (code === 'auth/popup-blocked') {
    return createAuthError('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
  }
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
    return createAuthError(
      `The domain "${host}" is not authorized in Firebase Authentication yet. Add it under Firebase Console → Authentication → Settings → Authorized domains.`
    );
  }
  if (code === 'auth/operation-not-allowed') {
    return createAuthError(
      'Email & Password sign-in is not enabled yet in Firebase Console. Enable it under Authentication → Sign-in method → Email/Password.'
    );
  }
  if (code === 'auth/email-already-in-use') {
    return createAuthError(
      'An account with this email already exists. Switch to Log In to enter with your password.'
    );
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return createAuthError(
      'Invalid email or password. If you are a new user, please switch to Sign Up first.'
    );
  }
  if (code === 'auth/invalid-email') {
    return createAuthError('Please enter a valid email address.');
  }
  if (code === 'auth/weak-password') {
    return createAuthError('Password is too weak. Please use at least 6 characters.');
  }
  if (code === 'auth/too-many-requests') {
    return createAuthError('Too many attempts. Please wait a minute and try again.');
  }
  if (code === 'auth/network-request-failed') {
    return createAuthError('Network error while connecting to authentication service. Please check your internet connection.');
  }
  return createAuthError(err?.message || 'Authentication failed. Please try again.');
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; onAuthSuccess?: () => void }> = ({
  children,
  onAuthSuccess,
}) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signup');
  const [isFirebaseConnected] = useState(true);
  const emailSignUpInFlightRef = useRef(false);

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

  // Authoritative Firebase Auth listener — tracks Google and Email/Password sessions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (emailSignUpInFlightRef.current) {
        return;
      }

      if (!fbUser) {
        saveCurrentUser(null);
        setIsAuthReady(true);
        return;
      }

      let existingRemote: UserAccount | null = null;
      try {
        existingRemote = await fetchUserProfileFromFirestore(fbUser.uid);
      } catch (err) {
        console.warn('Could not read Firestore user profile:', err);
      }

      const account = buildAccountFromFirebaseUser(fbUser, existingRemote);
      saveCurrentUser(account);

      if (existingRemote && account.onboardingCompleted) {
        try {
          await syncUserProfileToFirestore(account);
        } catch (err) {
          console.warn('Firestore login timestamp sync error:', err);
        }
      }

      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = (tab: 'signin' | 'signup' = 'signup') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const authenticateWithGoogle = async (
    _mode: 'signup' | 'login'
  ): Promise<GoogleAuthResult> => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;

      let existingRemote: UserAccount | null = null;
      try {
        existingRemote = await fetchUserProfileFromFirestore(fbUser.uid);
      } catch (err) {
        console.warn('Could not check existing Firestore profile:', err);
      }

      const isNewUser = !existingRemote || existingRemote.onboardingCompleted === false;
      const account = buildAccountFromFirebaseUser(fbUser, existingRemote);

      saveCurrentUser(account);

      if (!isNewUser) {
        try {
          await syncUserProfileToFirestore(account);
        } catch (err) {
          console.warn('Could not sync returning user to Firestore:', err);
        }
        setIsAuthModalOpen(false);
        if (onAuthSuccess) onAuthSuccess();
      }

      return {
        account,
        isNewUser,
        needsProfileCompletion: isNewUser,
      };
    } catch (firebaseErr: any) {
      throw formatFirebaseAuthError(firebaseErr);
    }
  };

  const completeGoogleSignUp = async (input: CompleteSignUpInput): Promise<UserAccount> => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      throw new Error('Please connect your Google account first to complete sign-up.');
    }

    const now = new Date().toISOString();
    const cleanName = input.name.trim().slice(0, 120) || fbUser.displayName || 'Invobill User';
    const cleanCompany = input.companyName.trim().slice(0, 120) || `${cleanName} Studio`;
    const cleanRole = (input.role || '').trim().slice(0, 80);

    const completedAccount: UserAccount = {
      ...(currentUser || buildAccountFromFirebaseUser(fbUser, null)),
      id: fbUser.uid,
      email: fbUser.email || currentUser?.email || '',
      name: cleanName,
      companyName: cleanCompany,
      role: cleanRole,
      avatarUrl:
        fbUser.photoURL ||
        currentUser?.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
      provider: detectProvider(fbUser),
      onboardingCompleted: true,
      plan: currentUser?.plan || 'free',
      billingCycle: currentUser?.billingCycle || 'monthly',
      subscriptionStatus: currentUser?.subscriptionStatus || 'active',
      subscriptionCurrency: currentUser?.subscriptionCurrency || 'INR',
      createdAt: currentUser?.createdAt || fbUser.metadata.creationTime || now,
      lastLoginAt: now,
    };

    await syncUserProfileToFirestore(completedAccount);
    saveCurrentUser(completedAccount);
    setIsAuthModalOpen(false);
    if (onAuthSuccess) onAuthSuccess();
    return completedAccount;
  };

  const signInWithGoogle = async (): Promise<UserAccount> => {
    const { account } = await authenticateWithGoogle('login');
    return account;
  };

  const signInWithEmail = async (email: string, password: string): Promise<UserAccount> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Please enter both your email address and password.');
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = credential.user;

      let existingRemote: UserAccount | null = null;
      try {
        existingRemote = await fetchUserProfileFromFirestore(fbUser.uid);
      } catch (err) {
        console.warn('Could not read Firestore profile on email login:', err);
      }

      const account = buildAccountFromFirebaseUser(fbUser, existingRemote);
      account.onboardingCompleted = true;

      saveCurrentUser(account);

      try {
        await syncUserProfileToFirestore(account);
      } catch (err) {
        console.warn('Could not sync email login profile to Firestore:', err);
      }

      setIsAuthModalOpen(false);
      if (onAuthSuccess) onAuthSuccess();
      return account;
    } catch (firebaseErr: any) {
      throw formatFirebaseAuthError(firebaseErr);
    }
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string,
    companyName?: string,
    role?: string
  ): Promise<UserAccount> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim().slice(0, 120);
    const cleanCompany = (companyName || '').trim().slice(0, 120);
    const cleanRole = (role || '').trim().slice(0, 80);

    if (cleanName.length < 2) {
      throw new Error('Please enter your full name (at least 2 characters).');
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    emailSignUpInFlightRef.current = true;
    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = credential.user;

      try {
        await updateProfile(fbUser, { displayName: cleanName });
      } catch (profileErr) {
        console.warn('Could not update Firebase displayName:', profileErr);
      }

      const now = new Date().toISOString();
      const newAccount: UserAccount = {
        id: fbUser.uid,
        email: cleanEmail,
        name: cleanName,
        companyName: cleanCompany || `${cleanName.split(' ')[0]} Studio`,
        role: cleanRole,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
        provider: 'email',
        onboardingCompleted: true,
        plan: 'free',
        billingCycle: 'monthly',
        subscriptionStatus: 'active',
        subscriptionCurrency: 'INR',
        createdAt: fbUser.metadata.creationTime || now,
        lastLoginAt: now,
      };

      try {
        await syncUserProfileToFirestore(newAccount);
      } catch (syncErr) {
        console.warn('Could not sync newly created email user to Firestore:', syncErr);
      }

      saveCurrentUser(newAccount);
      setIsAuthReady(true);
      setIsAuthModalOpen(false);
      if (onAuthSuccess) onAuthSuccess();
      return newAccount;
    } catch (firebaseErr: any) {
      throw formatFirebaseAuthError(firebaseErr);
    } finally {
      emailSignUpInFlightRef.current = false;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    saveCurrentUser(null);
    setAuthModalTab('signin');
    setIsAuthModalOpen(true);
  };

  const updateUserProfile = async (updates: Partial<UserAccount>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    saveCurrentUser(updated);
    if (auth.currentUser && auth.currentUser.uid === updated.id) {
      try {
        await syncUserProfileToFirestore(updated);
      } catch {}
    }
  };

  const upgradePlan = async (input: UpgradePaymentInput) => {
    const now = new Date();
    const durationDays = input.billingCycle === 'annual' ? 365 : 30;
    const expiresAt = new Date(now.getTime() + durationDays * 86400000).toISOString();
    const startedAt = now.toISOString();

    if (!currentUser) return;

    const targetUser: UserAccount = {
      ...currentUser,
      plan: input.planId,
      billingCycle: input.billingCycle,
      subscriptionStatus: 'active',
      subscriptionCurrency: input.currency,
      subscriptionStartedAt: startedAt,
      subscriptionExpiresAt: expiresAt,
      ...(input.paymentId ? { lastPaymentId: input.paymentId } : {}),
      ...(input.orderId ? { lastOrderId: input.orderId } : {}),
    };

    saveCurrentUser(targetUser);

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

  const needsSignUpCompletion = Boolean(currentUser && currentUser.onboardingCompleted === false);
  const isAuthenticated = Boolean(currentUser && currentUser.onboardingCompleted !== false);
  const currentPlan: SubscriptionPlanId = currentUser?.plan || 'free';
  const planEntitlements = getPlanEntitlements(currentPlan);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthReady,
        isAuthenticated,
        needsSignUpCompletion,
        isAuthModalOpen,
        authModalTab,
        isFirebaseConnected,
        currentPlan,
        planEntitlements,
        openAuthModal,
        closeAuthModal,
        authenticateWithGoogle,
        completeGoogleSignUp,
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
