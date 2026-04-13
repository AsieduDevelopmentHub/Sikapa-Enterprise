"use client";

import { useId, useState } from "react";
import { TwoFactorRequiredError } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";
import {
  sanitizeDigits,
  sanitizePlainText,
  validateEmail,
  validateOtpCode,
  validatePassword,
} from "@/lib/validation/input";

type Props = {
  defaultMode?: "signin" | "register";
  onSignInSuccess?: () => void;
  onRegisterSuccess?: () => void;
  onClearMessages?: () => void;
  /** Shown on sign-in; opens password recovery UI in the parent. */
  onForgotPassword?: () => void;
};

export function AccountAuthForm({
  defaultMode = "signin",
  onSignInSuccess,
  onRegisterSuccess,
  onClearMessages,
  onForgotPassword,
}: Props) {
  const id = useId();
  const { authError, clearAuthError, login, loginWithTotp, register } = useAuth();
  const [mode, setMode] = useState<"signin" | "register">(defaultMode);
  const [signinStep, setSigninStep] = useState<"password" | "totp">("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);
    const id = sanitizePlainText(identifier, 255);
    if (mode === "signin") {
      if (!id) return setLocalError("Enter your email or username.");
      if (id.includes("@")) {
        const emailErr = validateEmail(id);
        if (emailErr) return setLocalError(emailErr);
      }
    }
    if (mode === "signin" && signinStep === "password" && !password) {
      setLocalError("Enter your password.");
      return;
    }
    if (mode === "register") {
      const u = sanitizePlainText(username, 50)?.toLowerCase() || "";
      if (!/^[a-z0-9._-]{3,50}$/.test(u)) {
        setLocalError("Username must be 3-50 chars using letters, numbers, dot, underscore, or hyphen.");
        return;
      }
      if (!sanitizePlainText(name, 120)) {
        setLocalError("Enter your name.");
        return;
      }
      const registerEmail = email.trim();
      if (registerEmail) {
        const emailErr = validateEmail(registerEmail);
        if (emailErr) {
          setLocalError(emailErr);
          return;
        }
      }
      const pwErr = validatePassword(password, 8);
      if (pwErr) {
        setLocalError(pwErr);
        return;
      }
    }
    if (mode === "signin" && signinStep === "totp") {
      const code = sanitizeDigits(totpCode, 6);
      const codeErr = validateOtpCode(code, 6);
      if (codeErr) {
        setLocalError(codeErr);
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        if (signinStep === "totp") {
          await loginWithTotp(id, password, sanitizeDigits(totpCode, 6));
          setSigninStep("password");
          setTotpCode("");
          onSignInSuccess?.();
        } else {
          try {
            await login(id, password);
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
        await register(
          sanitizePlainText(username, 50)?.toLowerCase() || "",
          sanitizePlainText(name, 120) || "",
          password,
          email.trim() || undefined
        );
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
      <div className="mb-6 flex rounded-[10px] bg-sikapa-gray-soft p-1 dark:bg-zinc-800">
        <button
          type="button"
          className={`sikapa-tap flex-1 rounded-[8px] py-2.5 text-small font-semibold ${
            mode === "signin"
              ? "bg-white text-sikapa-text-primary shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
              : "text-sikapa-text-secondary dark:text-zinc-400"
          }`}
          onClick={() => {
            setMode("signin");
            setSigninStep("password");
            setTotpCode("");
            setLocalError(null);
            clearAuthError();
            onClearMessages?.();
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`sikapa-tap flex-1 rounded-[8px] py-2.5 text-small font-semibold ${
            mode === "register"
              ? "bg-white text-sikapa-text-primary shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
              : "text-sikapa-text-secondary dark:text-zinc-400"
          }`}
          onClick={() => {
            setMode("register");
            setSigninStep("password");
            setTotpCode("");
            setLocalError(null);
            clearAuthError();
            onClearMessages?.();
          }}
        >
          Register
        </button>
      </div>

      {(localError || authError) && (
        <p className="mb-4 rounded-[10px] bg-red-50 px-3 py-2 text-small text-red-800 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-100">
          {localError ?? authError}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <div>
              <label htmlFor={`${id}-name`} className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
                Name
              </label>
              <input
                id={`${id}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
              />
            </div>
            <div>
              <label htmlFor={`${id}-username`} className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
                Username
              </label>
              <input
                id={`${id}-username`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
              />
            </div>
            <div>
              <label htmlFor={`${id}-register-email`} className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
                Email (optional)
              </label>
              <input
                id={`${id}-register-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
              />
            </div>
          </>
        )}
        {mode === "signin" && (
          <div>
            <label htmlFor={`${id}-identifier`} className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
              Email or username
            </label>
            <input
              id={`${id}-identifier`}
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              disabled={signinStep === "totp"}
              className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
          </div>
        )}
        {!(mode === "signin" && signinStep === "totp") && (
          <div>
            <label htmlFor={`${id}-password`} className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
              Password{" "}
              {mode === "register" && (
                <span className="font-normal text-sikapa-text-muted dark:text-zinc-500">(min. 8 characters)</span>
              )}
            </label>
            <input
              id={`${id}-password`}
              type="password"
              required
              minLength={mode === "register" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
            {mode === "signin" && onForgotPassword ? (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  className="text-small font-semibold text-sikapa-gold hover:underline"
                  onClick={() => {
                    onClearMessages?.();
                    onForgotPassword();
                  }}
                >
                  Forgot password?
                </button>
              </div>
            ) : null}
          </div>
        )}
        {mode === "signin" && signinStep === "totp" && (
          <div>
            <p className="mb-2 text-small text-sikapa-text-secondary dark:text-zinc-400">
              Enter the 6-digit code from your authenticator app.
            </p>
            <label htmlFor={`${id}-totp`} className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
              Authentication code
            </label>
            <input
              id={`${id}-totp`}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 w-full rounded-[10px] border-0 bg-white py-3 px-3 text-body tracking-widest ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
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
