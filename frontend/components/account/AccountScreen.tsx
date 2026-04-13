"use client";

import { useState } from "react";
import { AccountAuthForm } from "@/components/auth/AccountAuthForm";
import { AccountSignedInHub } from "@/components/account/AccountSignedInHub";
import { useAuth } from "@/context/AuthContext";
import { authPasswordResetConfirm, authPasswordResetRequest } from "@/lib/api/auth";
import { validateEmail } from "@/lib/validation/input";

export function AccountScreen() {
  const { user, loading, accessToken } = useAuth();
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const [resetToken, setResetToken] = useState("");
  const [resetNewPw, setResetNewPw] = useState("");
  const [resetConfirmBusy, setResetConfirmBusy] = useState(false);

  if (loading && !user) {
    return (
      <div className="mx-auto max-w-mobile px-5 py-16 text-center text-small text-sikapa-text-secondary dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  if (user && accessToken) {
    return <AccountSignedInHub />;
  }

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setResetBusy(true);
    setBanner(null);
    const err = validateEmail(resetEmail);
    if (err) {
      setBanner({ type: "err", text: err });
      setResetBusy(false);
      return;
    }
    try {
      await authPasswordResetRequest(resetEmail.trim());
      setBanner({
        type: "ok",
        text: "If an account exists for that email, you will receive reset instructions.",
      });
    } catch (err) {
      setBanner({ type: "err", text: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setResetBusy(false);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    setResetConfirmBusy(true);
    setBanner(null);
    if (resetNewPw.length < 8) {
      setBanner({ type: "err", text: "New password must be at least 8 characters." });
      setResetConfirmBusy(false);
      return;
    }
    if (!resetToken.trim()) {
      setBanner({ type: "err", text: "Paste the reset token from your email." });
      setResetConfirmBusy(false);
      return;
    }
    try {
      await authPasswordResetConfirm(resetToken.trim(), resetNewPw);
      setBanner({ type: "ok", text: "Password updated. You can sign in now." });
      setResetToken("");
      setResetNewPw("");
    } catch (err) {
      setBanner({ type: "err", text: err instanceof Error ? err.message : "Reset failed" });
    } finally {
      setResetConfirmBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-mobile space-y-6 px-5 py-8">
      <div>
        <h1 className="font-serif text-[1.35rem] font-semibold text-sikapa-text-primary dark:text-zinc-100">
          Account
        </h1>
        <p className="mt-1 text-small leading-relaxed text-sikapa-text-secondary dark:text-zinc-400">
          Sign in to shop, pay securely, and manage your profile.
        </p>
      </div>

      {banner && (
        <p
          className={`rounded-[10px] px-3 py-2.5 text-small ${
            banner.type === "ok"
              ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "bg-red-50 text-red-800 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-100"
          }`}
        >
          {banner.text}
        </p>
      )}

      <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
        <AccountAuthForm
          defaultMode="signin"
          onClearMessages={() => setBanner(null)}
          onForgotPassword={() => {
            setShowPasswordRecovery(true);
            setBanner(null);
          }}
          onSignInSuccess={() => setBanner({ type: "ok", text: "Signed in." })}
          onRegisterSuccess={() =>
            setBanner({
              type: "ok",
              text: "Account created. Sign in complete.",
            })
          }
        />
      </section>

      {showPasswordRecovery ? (
        <section className="space-y-5 rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              Password recovery
            </h2>
            <button
              type="button"
              className="shrink-0 text-[11px] font-semibold text-sikapa-text-muted hover:text-sikapa-text-primary dark:text-zinc-500 dark:hover:text-zinc-300"
              onClick={() => {
                setShowPasswordRecovery(false);
                setBanner(null);
              }}
            >
              Close
            </button>
          </div>

          <div>
            <h3 className="text-small font-semibold text-sikapa-text-primary dark:text-zinc-200">Forgot password</h3>
            <form onSubmit={requestReset} className="mt-3 space-y-3">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Your email"
                className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
              />
              <button
                type="submit"
                disabled={resetBusy}
                className="w-full rounded-[10px] bg-sikapa-text-primary py-2.5 text-small font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {resetBusy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </div>

          <div className="border-t border-sikapa-gray-soft pt-5 dark:border-white/10">
            <h3 className="text-small font-semibold text-sikapa-text-primary dark:text-zinc-200">Set new password</h3>
            <p className="mt-1 text-small text-sikapa-text-secondary dark:text-zinc-400">
              Use the token from your reset email.
            </p>
            <form onSubmit={confirmReset} className="mt-4 space-y-3">
              <input
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Reset token"
                className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
              />
              <input
                type="password"
                minLength={8}
                value={resetNewPw}
                onChange={(e) => setResetNewPw(e.target.value)}
                placeholder="New password"
                className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
              />
              <button
                type="submit"
                disabled={resetConfirmBusy}
                className="w-full rounded-[10px] border border-sikapa-gold py-2.5 text-small font-semibold text-sikapa-gold disabled:opacity-50"
              >
                {resetConfirmBusy ? "Saving…" : "Save new password"}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
