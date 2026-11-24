import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  LogIn,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { submitTestimonialToFirestore } from '../services/firestoreService';
import { TestimonialItem } from '../types';

interface AddTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (item: TestimonialItem) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Needs work',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

export const AddTestimonialModal: React.FC<AddTestimonialModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const { currentUser, signInWithGoogle } = useAuth();

  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [author, setAuthor] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [quote, setQuote] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedItem, setSubmittedItem] = useState<TestimonialItem | null>(null);
  const [isFirebaseSignedIn, setIsFirebaseSignedIn] = useState<boolean>(
    Boolean(auth.currentUser)
  );

  useEffect(() => {
    if (!isOpen) return;
    setIsFirebaseSignedIn(Boolean(auth.currentUser));
    setAuthor((prev) => prev || auth.currentUser?.displayName || currentUser?.name || '');
    setCompany((prev) => prev || currentUser?.companyName || '');
    setErrorMsg(null);
    setSubmittedItem(null);
    setIsSubmitting(false);
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const activeStarValue = hoveredRating || rating;

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setIsSigningIn(true);
    try {
      const account = await signInWithGoogle();
      const verified = Boolean(auth.currentUser);
      setIsFirebaseSignedIn(verified);
      if (account?.name && !author.trim()) {
        setAuthor(account.name);
      }
      if (account?.companyName && !company.trim()) {
        setCompany(account.companyName);
      }
      if (!verified) {
        setErrorMsg(
          'Google pop-up sign-in was blocked or cancelled. Please allow pop-ups to verify your account and publish to Firestore.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not complete Google sign-in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanAuthor = author.trim();
    const cleanRole = role.trim();
    const cleanCompany = company.trim();
    const cleanQuote = quote.trim();

    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a star rating from 1 to 5.');
      return;
    }

    if (cleanAuthor.length < 2 || cleanAuthor.length > 80) {
      setErrorMsg('Please enter your name (between 2 and 80 characters).');
      return;
    }

    if (cleanQuote.length < 10) {
      setErrorMsg('Please write at least 10 characters in your feedback message.');
      return;
    }

    if (cleanQuote.length > 500) {
      setErrorMsg('Feedback message must be 500 characters or fewer.');
      return;
    }

    if (!auth.currentUser) {
      setIsFirebaseSignedIn(false);
      setErrorMsg('Please sign in with Google below so your testimonial can be verified and stored in Firestore.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitTestimonialToFirestore({
        author: cleanAuthor,
        role: cleanRole,
        company: cleanCompany,
        quote: cleanQuote,
        rating,
      });

      setSubmittedItem(created);
      setQuote('');
      if (onSubmitted) {
        onSubmitted(created);
      }
    } catch (err: any) {
      const raw = err?.message || '';
      if (raw.includes('permission-denied') || raw.includes('insufficient permissions')) {
        setErrorMsg(
          'Your account must have a verified Google sign-in to publish a testimonial. Please sign in with Google and try again.'
        );
      } else {
        setErrorMsg('Unable to save testimonial right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedItem(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-testimonial-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleResetAndClose();
        }
      }}
    >
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="add-testimonial-title"
                className="text-sm sm:text-base font-bold text-[var(--foreground)]"
              >
                Add Testimonial
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Share your rating and experience with Invobill
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submittedItem ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-[var(--foreground)]">
                  Testimonial Published
                </h4>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-sm mx-auto">
                  Thank you, {submittedItem.author}. Your {submittedItem.rating}-star review is now saved and live in the Client Stories section.
                </p>
              </div>

              <div className="text-left rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 space-y-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: submittedItem.rating }).map((_, idx) => (
                    <Star
                      key={idx}
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[var(--foreground)] italic leading-relaxed">
                  &ldquo;{submittedItem.quote}&rdquo;
                </p>
                <div className="text-[11px] text-[var(--muted-foreground)]">
                  <span className="font-semibold text-[var(--foreground)]">
                    {submittedItem.author}
                  </span>
                  {(submittedItem.role || submittedItem.company) && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span>
                        {[submittedItem.role, submittedItem.company].filter(Boolean).join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white transition-colors cursor-pointer"
              >
                View in Client Stories
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Google Verification Notice when not authenticated with Firebase */}
              {!isFirebaseSignedIn && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    <span className="font-semibold text-[var(--foreground)] block">
                      Verify your account to publish
                    </span>
                    Sign in with Google so your testimonial is saved directly to Firestore.
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isSigningIn}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {isSigningIn ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogIn className="w-3.5 h-3.5" />
                    )}
                    <span>{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              )}

              {/* Star Rating Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--foreground)]">
                    Your Rating
                  </label>
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] font-mono tabular-nums">
                    {activeStarValue}/5 · {RATING_LABELS[activeStarValue]}
                  </span>
                </div>

                <div
                  className="inline-flex items-center gap-1 p-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                  role="radiogroup"
                  aria-label="Star rating from 1 to 5"
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= activeStarValue;
                    return (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={rating === star}
                        aria-label={`${star} out of 5 stars — ${RATING_LABELS[star]}`}
                        onMouseEnter={() => setHoveredRating(star)}
                        onClick={() => {
                          setRating(star);
                          setErrorMsg(null);
                        }}
                        className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition-transform duration-150 hover:scale-105 cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors duration-150 ${
                            filled
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-[var(--muted-foreground)]/40'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Author & Attribution Fields */}
              <div className="space-y-3.5">
                <div>
                  <label
                    htmlFor="testimonial-author"
                    className="block text-xs font-semibold text-[var(--foreground)] mb-1.5"
                  >
                    Full Name <span className="text-[var(--primary)]">*</span>
                  </label>
                  <input
                    id="testimonial-author"
                    type="text"
                    value={author}
                    onChange={(e) => {
                      setAuthor(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="e.g., Priya Nair"
                    maxLength={80}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="testimonial-role"
                      className="block text-xs font-semibold text-[var(--foreground)] mb-1.5"
                    >
                      Role / Profession
                    </label>
                    <input
                      id="testimonial-role"
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g., Brand Designer"
                      maxLength={80}
                      className="w-full px-3.5 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="testimonial-company"
                      className="block text-xs font-semibold text-[var(--foreground)] mb-1.5"
                    >
                      Company / Studio
                    </label>
                    <input
                      id="testimonial-company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g., Studio Kora"
                      maxLength={80}
                      className="w-full px-3.5 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="testimonial-quote"
                      className="text-xs font-semibold text-[var(--foreground)]"
                    >
                      Feedback Message <span className="text-[var(--primary)]">*</span>
                    </label>
                    <span className="text-[11px] font-mono tabular-nums text-[var(--muted-foreground)]">
                      {quote.trim().length}/500
                    </span>
                  </div>
                  <textarea
                    id="testimonial-quote"
                    rows={4}
                    value={quote}
                    onChange={(e) => {
                      setQuote(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="What changed in your invoicing workflow after switching to Invobill?"
                    maxLength={500}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 focus:border-[var(--primary)] transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Validation / Submission Error */}
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] text-[var(--foreground)] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      <span>Submit Testimonial</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
