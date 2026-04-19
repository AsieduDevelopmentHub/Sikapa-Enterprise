"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { TwoFactorRequiredError } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";
import { getGoogleOAuthStartUrl, isGoogleOAuthButtonEnabled } from "@/lib/oauth";
import { privacyUrl, termsUrl } from "@/lib/site";
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

function PasswordInputWithToggle({
  id,
  value,
  onChange,
  autoComplete,
  minLength,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-1">
      <input
        id={id}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-[10px] border-0 bg-white py-3 pl-3 pr-12 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
      />
      <button
        type="button"
        className="sikapa-tap absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-sikapa-text-muted hover:bg-black/[0.04] hover:text-sikapa-text-primary dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function LegalInlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  const cls = "font-semibold text-sikapa-gold underline-offset-2 hover:underline";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 10-4.24-4.24"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

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
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);
    const idVal = sanitizePlainText(identifier, 255);
    if (mode === "signin") {
      if (!idVal) return setLocalError("Enter your email or username.");
      if (idVal.includes("@")) {
        const emailErr = validateEmail(idVal);
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
      if (password !== passwordConfirm) {
        setLocalError("Passwords do not match.");
        return;
      }
      if (!acceptedLegal) {
        setLocalError("Please accept the Terms of Service and Privacy Policy.");
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
          await loginWithTotp(idVal, password, sanitizeDigits(totpCode, 6));
          setSigninStep("password");
          setTotpCode("");
          onSignInSuccess?.();
        } else {
          try {
            await login(idVal, password);
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
            setPasswordConfirm("");
            setAcceptedLegal(false);
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
            setPasswordConfirm("");
            setAcceptedLegal(false);
            setLocalError(null);
            clearAuthError();
            onClearMessages?.();
          }}
        >
          Register
        </button>
      </div>

      {isGoogleOAuthButtonEnabled() && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-black/[0.06] dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted dark:text-zinc-500">
              <span className="bg-sikapa-cream px-2 dark:bg-zinc-950">Or</span>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            className="sikapa-tap flex w-full items-center justify-center gap-2 rounded-[10px] border border-black/[0.08] bg-white py-3 text-small font-semibold text-sikapa-text-primary shadow-sm ring-1 ring-black/[0.04] hover:bg-sikapa-gray-soft/50 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10 dark:hover:bg-zinc-800"
            onClick={() => {
              window.location.href = getGoogleOAuthStartUrl();
            }}
          >
            <GoogleMark />
            Continue with Google
          </button>
        </>
      )}

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
          <>
            <div>
              <label htmlFor={`${id}-password`} className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
                Password{" "}
                {mode === "register" && (
                  <span className="font-normal text-sikapa-text-muted dark:text-zinc-500">(min. 8 characters)</span>
                )}
              </label>
              <PasswordInputWithToggle
                id={`${id}-password`}
                value={password}
                onChange={setPassword}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 8 : undefined}
                required
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
            {mode === "register" && (
              <div>
                <label htmlFor={`${id}-password-confirm`} className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200">
                  Confirm password
                </label>
                <PasswordInputWithToggle
                  id={`${id}-password-confirm`}
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            )}
            {mode === "register" && (
              <label className="flex cursor-pointer items-start gap-3 text-small text-sikapa-text-primary dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={(e) => setAcceptedLegal(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-sikapa-gold"
                />
                <span className="leading-relaxed">
                  I agree to the{" "}
                  <LegalInlineLink href={termsUrl()}>Terms of Service</LegalInlineLink>
                  {" "}and{" "}
                  <LegalInlineLink href={privacyUrl()}>Privacy Policy</LegalInlineLink>.
                </span>
              </label>
            )}
          </>
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
