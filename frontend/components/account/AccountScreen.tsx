"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function AccountScreen() {
  const { user, loading, authError, clearAuthError, login, register, logout } = useAuth();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearAuthError();
    setLocalMsg(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await login(email.trim(), password);
        setLocalMsg("Signed in successfully.");
      } else {
        await register(email.trim(), password, firstName.trim() || undefined, lastName.trim() || undefined);
        setLocalMsg("Welcome — your account is ready.");
      }
    } catch {
      /* authError set in context */
    } finally {
      setBusy(false);
    }
  }

  if (loading && !user) {
    return (
      <div className="px-5 py-10 text-center text-small text-sikapa-text-secondary">Loading…</div>
    );
  }

  if (user) {
    const displayName =
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.email;
    return (
      <div className="space-y-6 px-5 py-8">
        <div className="rounded-[10px] bg-white p-4 ring-1 ring-black/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted">
            Signed in
          </p>
          <p className="mt-1 font-serif text-section-title font-semibold text-sikapa-text-primary">
            {displayName}
          </p>
          <p className="mt-1 text-small text-sikapa-text-secondary">{user.email}</p>
          <dl className="mt-4 space-y-2 text-small text-sikapa-text-secondary">
            <div className="flex justify-between gap-2">
              <dt>Email verified</dt>
              <dd className="font-medium text-sikapa-text-primary">{user.email_verified ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Two-factor auth</dt>
              <dd className="font-medium text-sikapa-text-primary">{user.two_fa_enabled ? "On" : "Off"}</dd>
            </div>
          </dl>
        </div>
        <button
          type="button"
          className="sikapa-tap w-full rounded-[10px] border border-sikapa-crimson/30 bg-white py-3 text-small font-semibold text-sikapa-crimson"
          onClick={() => logout()}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 py-8">
      <div className="mb-6 flex rounded-[10px] bg-sikapa-gray-soft p-1">
        <button
          type="button"
          className={`sikapa-tap flex-1 rounded-[8px] py-2.5 text-small font-semibold ${
            mode === "signin" ? "bg-white text-sikapa-text-primary shadow-sm" : "text-sikapa-text-secondary"
          }`}
          onClick={() => {
            setMode("signin");
            clearAuthError();
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`sikapa-tap flex-1 rounded-[8px] py-2.5 text-small font-semibold ${
            mode === "register" ? "bg-white text-sikapa-text-primary shadow-sm" : "text-sikapa-text-secondary"
          }`}
          onClick={() => {
            setMode("register");
            clearAuthError();
          }}
        >
          Register
        </button>
      </div>

      {(authError || localMsg) && (
        <p
          className={`mb-4 rounded-[10px] px-3 py-2 text-small ${
            authError ? "bg-red-50 text-red-800 ring-1 ring-red-100" : "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100"
          }`}
        >
          {authError ?? localMsg}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <div>
              <label htmlFor="acc-first" className="text-small font-medium text-sikapa-text-primary">
                First name
              </label>
              <input
                id="acc-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
              />
            </div>
            <div>
              <label htmlFor="acc-last" className="text-small font-medium text-sikapa-text-primary">
                Last name
              </label>
              <input
                id="acc-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor="acc-email" className="text-small font-medium text-sikapa-text-primary">
            Email
          </label>
          <input
            id="acc-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
          />
        </div>
        <div>
          <label htmlFor="acc-password" className="text-small font-medium text-sikapa-text-primary">
            Password {mode === "register" && <span className="font-normal text-sikapa-text-muted">(min. 8 characters)</span>}
          </label>
          <input
            id="acc-password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="sikapa-btn-gold sikapa-tap w-full rounded-[10px] py-3 text-small font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-[11px] leading-relaxed text-sikapa-text-muted">
        Connected to your Sikapa API at sign-in. Tokens stay on this device (local storage).
      </p>
    </div>
  );
}
