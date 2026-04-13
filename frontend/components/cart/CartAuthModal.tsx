"use client";

import { useEffect } from "react";
import { AccountAuthForm } from "@/components/auth/AccountAuthForm";

type Props = {
  open: boolean;
  onDismiss: () => void;
  onAuthenticated: () => void;
};

export function CartAuthModal({ open, onDismiss, onAuthenticated }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="cart-auth-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onDismiss}
      />
      <div className="relative z-[1] w-full max-w-mobile rounded-t-[16px] bg-sikapa-cream px-5 pb-[max(1.5rem,var(--safe-bottom))] pt-5 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] sm:mx-4 sm:max-h-[min(90vh,640px)] sm:overflow-y-auto sm:rounded-[16px] sm:pb-6">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-sikapa-gray-soft sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="cart-auth-title" className="font-serif text-section-title font-semibold text-sikapa-text-primary">
              Sign in to use your cart
            </h2>
            <p className="mt-1 text-small leading-relaxed text-sikapa-text-secondary">
              Create a free account or sign in to add items. Your cart stays on this device after you sign in.
            </p>
          </div>
          <button
            type="button"
            className="sikapa-tap shrink-0 rounded-full p-2 text-sikapa-text-muted hover:bg-white/80"
            aria-label="Close"
            onClick={onDismiss}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-5">
          <AccountAuthForm
            defaultMode="register"
            onClearMessages={() => {}}
            onSignInSuccess={onAuthenticated}
            onRegisterSuccess={onAuthenticated}
          />
        </div>
      </div>
    </div>
  );
}
