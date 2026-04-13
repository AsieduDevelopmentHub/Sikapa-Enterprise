"use client";

import { useId, useState } from "react";
import { TwoFactorRequiredError } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";

type Props = {
  defaultMode?: "signin" | "register";
  onSignInSuccess?: () => void;
  onRegisterSuccess?: () => void;
  onClearMessages?: () => void;
};

export function AccountAuthForm({
  defaultMode = "signin",
  onSignInSuccess,
  onRegisterSuccess,
  onClearMessages,
}: Props) {
  const id = useId();
  const { authError, clearAuthError, login, loginWithTotp, register } = useAuth();
  const [mode, setMode] = useState<"signin" | "register">(defaultMode);
  const [signinStep, setSigninStep] = useState<"password" | "totp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearAuthError();
    setBusy(true);
    try {
      if (mode === "signin") {
        if (signinStep === "totp") {
          await loginWithTotp(email.trim(), password, totpCode.trim());
          setSigninStep("password");
          setTotpCode("");
          onSignInSuccess?.();
        } else {
          try {
            await login(email.trim(), password);
            onSignInSuccess?.();
          } catch (err) {
            if (err instanceof TwoFactorRequiredError) {
              setSigninStep("totp");
              setTotpCode("");
              return;
            }
            throw err;
          }
        }
      } else {
        await register(email.trim(), password, firstName.trim() || undefined, lastName.trim() || undefined);
        onRegisterSuccess?.();
      }
    } catch {
      /* authError from context */
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex rounded-[10px] bg-sikapa-gray-soft p-1">
        <button
          type="button"
          className={`sikapa-tap flex-1 rounded-[8px] py-2.5 text-small font-semibold ${
            mode === "signin" ? "bg-white text-sikapa-text-primary shadow-sm" : "text-sikapa-text-secondary"
          }`}
          onClick={() => {
            setMode("signin");
            setSigninStep("password");
            setTotpCode("");
            clearAuthError();
            onClearMessages?.();
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
            setSigninStep("password");
            setTotpCode("");
            clearAuthError();
            onClearMessages?.();
          }}
        >
          Register
        </button>
      </div>

      {authError && (
        <p className="mb-4 rounded-[10px] bg-red-50 px-3 py-2 text-small text-red-800 ring-1 ring-red-100">
          {authError}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <div>
              <label htmlFor={`${id}-first`} className="text-small font-medium text-sikapa-text-primary">
                First name
              </label>
              <input
                id={`${id}-first`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
              />
            </div>
            <div>
              <label htmlFor={`${id}-last`} className="text-small font-medium text-sikapa-text-primary">
                Last name
              </label>
              <input
                id={`${id}-last`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor={`${id}-email`} className="text-small font-medium text-sikapa-text-primary">
            Email
          </label>
          <input
            id={`${id}-email`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={mode === "signin" && signinStep === "totp"}
            className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40 disabled:opacity-60"
          />
        </div>
        {!(mode === "signin" && signinStep === "totp") && (
          <div>
            <label htmlFor={`${id}-password`} className="text-small font-medium text-sikapa-text-primary">
              Password{" "}
              {mode === "register" && <span className="font-normal text-sikapa-text-muted">(min. 8 characters)</span>}
            </label>
            <input
              id={`${id}-password`}
              type="password"
              required
              minLength={mode === "register" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
            />
          </div>
        )}
        {mode === "signin" && signinStep === "totp" && (
          <div>
            <p className="mb-2 text-small text-sikapa-text-secondary">
              Enter the 6-digit code from your authenticator app.
            </p>
            <label htmlFor={`${id}-totp`} className="text-small font-medium text-sikapa-text-primary">
              Authentication code
            </label>
            <input
              id={`${id}-totp`}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body tracking-widest ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
              placeholder="000000"
            />
            <button
              type="button"
              className="mt-2 text-small font-semibold text-sikapa-gold"
              onClick={() => {
                setSigninStep("password");
                setTotpCode("");
                clearAuthError();
              }}
            >
              Back to password
            </button>
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="sikapa-btn-gold sikapa-tap w-full rounded-[10px] py-3 text-small font-semibold text-white disabled:opacity-60"
        >
          {busy
            ? "Please wait…"
            : mode === "register"
              ? "Create account"
              : signinStep === "totp"
                ? "Verify and sign in"
                : "Sign in"}
        </button>
      </form>
    </>
  );
}
