"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountAuthForm } from "@/components/auth/AccountAuthForm";
import { AccountTwoFactorPanel } from "@/components/account/AccountTwoFactorPanel";
import { useAuth } from "@/context/AuthContext";
import {
  authChangePassword,
  authDeleteAccount,
  authPasswordResetConfirm,
  authPasswordResetRequest,
  authUpdateProfile,
  authVerifyEmail,
} from "@/lib/api/auth";
import { newsletterSubscribe } from "@/lib/api/subscriptions";

export function AccountScreen() {
  const { user, loading, accessToken, logout, refreshProfile } = useAuth();
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const [inboxEmail, setInboxEmail] = useState("");
  const [inboxCode, setInboxCode] = useState("");
  const [inboxBusy, setInboxBusy] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  const [newsEmail, setNewsEmail] = useState("");
  const [newsBusy, setNewsBusy] = useState(false);

  const [delPw, setDelPw] = useState("");
  const [delBusy, setDelBusy] = useState(false);

  const [resetToken, setResetToken] = useState("");
  const [resetNewPw, setResetNewPw] = useState("");
  const [resetConfirmBusy, setResetConfirmBusy] = useState(false);

  const [guestVerifyEmail, setGuestVerifyEmail] = useState("");
  const [guestVerifyCode, setGuestVerifyCode] = useState("");
  const [guestVerifyBusy, setGuestVerifyBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
    setPhone(user.phone ?? "");
    if (!user.email_verified) setInboxEmail(user.email);
  }, [user]);

  if (loading && !user) {
    return (
      <div className="mx-auto max-w-mobile px-5 py-16 text-center text-small text-sikapa-text-secondary">
        Loading…
      </div>
    );
  }

  if (user && accessToken) {
    const token: string = accessToken;
    const u = user;
    const displayName =
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.email;

    async function saveProfile(e: React.FormEvent) {
      e.preventDefault();
      setBanner(null);
      setProfileBusy(true);
      try {
        await authUpdateProfile(token, {
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          phone: phone.trim() || null,
        });
        await refreshProfile();
        setBanner({ type: "ok", text: "Profile updated." });
      } catch (err) {
        setBanner({ type: "err", text: err instanceof Error ? err.message : "Update failed" });
      } finally {
        setProfileBusy(false);
      }
    }

    async function changePw(e: React.FormEvent) {
      e.preventDefault();
      setBanner(null);
      setPwBusy(true);
      try {
        await authChangePassword(token, curPw, newPw);
        setCurPw("");
        setNewPw("");
        setBanner({ type: "ok", text: "Password updated." });
      } catch (err) {
        setBanner({ type: "err", text: err instanceof Error ? err.message : "Could not change password" });
      } finally {
        setPwBusy(false);
      }
    }

    async function verifySignedIn(e: React.FormEvent) {
      e.preventDefault();
      setBanner(null);
      setInboxBusy(true);
      try {
        await authVerifyEmail(inboxEmail.trim() || u.email, inboxCode.trim());
        setInboxCode("");
        await refreshProfile();
        setBanner({ type: "ok", text: "Email verified." });
      } catch (err) {
        setBanner({ type: "err", text: err instanceof Error ? err.message : "Verification failed" });
      } finally {
        setInboxBusy(false);
      }
    }

    async function delAccount(e: React.FormEvent) {
      e.preventDefault();
      setBanner(null);
      setDelBusy(true);
      try {
        await authDeleteAccount(token, delPw);
        setDelPw("");
        await logout();
        setBanner({ type: "ok", text: "Your account has been closed." });
      } catch (err) {
        setBanner({ type: "err", text: err instanceof Error ? err.message : "Could not delete account" });
      } finally {
        setDelBusy(false);
      }
    }

    return (
      <div className="mx-auto max-w-mobile space-y-5 px-5 py-8">
        {banner && (
          <p
            className={`rounded-[10px] px-3 py-2.5 text-small ${
              banner.type === "ok"
                ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100"
                : "bg-red-50 text-red-800 ring-1 ring-red-100"
            }`}
          >
            {banner.text}
          </p>
        )}

        <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted">Profile</p>
          <h1 className="mt-1 font-serif text-[1.25rem] font-semibold text-sikapa-text-primary">{displayName}</h1>
          <p className="mt-0.5 text-small text-sikapa-text-secondary">{user.email}</p>
          <p className="mt-2 text-small text-sikapa-text-secondary">
            Email status:{" "}
            <span className="font-semibold text-sikapa-text-primary">
              {user.email_verified ? "Verified" : "Not verified"}
            </span>
          </p>
          <form onSubmit={saveProfile} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-small font-medium text-sikapa-text-primary" htmlFor="pf-fn">
                  First name
                </label>
                <input
                  id="pf-fn"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
                />
              </div>
              <div>
                <label className="text-small font-medium text-sikapa-text-primary" htmlFor="pf-ln">
                  Last name
                </label>
                <input
                  id="pf-ln"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
                />
              </div>
            </div>
            <div>
              <label className="text-small font-medium text-sikapa-text-primary" htmlFor="pf-ph">
                Phone
              </label>
              <input
                id="pf-ph"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
              />
            </div>
            <button
              type="submit"
              disabled={profileBusy}
              className="sikapa-btn-gold sikapa-tap w-full rounded-[10px] py-2.5 text-small font-semibold text-white disabled:opacity-50"
            >
              {profileBusy ? "Saving…" : "Save profile"}
            </button>
          </form>
        </section>

        {!user.email_verified && (
          <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">Verify email</h2>
            <p className="mt-1 text-small text-sikapa-text-secondary">
              Enter the code from your inbox. Use the address you registered with if it differs below.
            </p>
            <form onSubmit={verifySignedIn} className="mt-4 space-y-3">
              <div>
                <label className="text-small font-medium text-sikapa-text-primary" htmlFor="ve-em">
                  Email
                </label>
                <input
                  id="ve-em"
                  type="email"
                  value={inboxEmail}
                  onChange={(e) => setInboxEmail(e.target.value)}
                  className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
                />
              </div>
              <div>
                <label className="text-small font-medium text-sikapa-text-primary" htmlFor="ve-co">
                  Code
                </label>
                <input
                  id="ve-co"
                  inputMode="numeric"
                  value={inboxCode}
                  onChange={(e) => setInboxCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
                />
              </div>
              <button
                type="submit"
                disabled={inboxBusy}
                className="w-full rounded-[10px] border border-sikapa-gold py-2.5 text-small font-semibold text-sikapa-gold disabled:opacity-50"
              >
                {inboxBusy ? "Verifying…" : "Confirm email"}
              </button>
            </form>
          </section>
        )}

        <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">Security</h2>
          <form onSubmit={changePw} className="mt-4 space-y-3">
            <div>
              <label className="text-small font-medium text-sikapa-text-primary" htmlFor="pw-c">
                Current password
              </label>
              <input
                id="pw-c"
                type="password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                autoComplete="current-password"
                className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
              />
            </div>
            <div>
              <label className="text-small font-medium text-sikapa-text-primary" htmlFor="pw-n">
                New password (min. 8)
              </label>
              <input
                id="pw-n"
                type="password"
                minLength={8}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
              />
            </div>
            <button
              type="submit"
              disabled={pwBusy}
              className="w-full rounded-[10px] border border-sikapa-gray-soft py-2.5 text-small font-semibold text-sikapa-text-primary disabled:opacity-50"
            >
              {pwBusy ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>

        <AccountTwoFactorPanel />

        <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">Newsletter</h2>
          <p className="mt-1 text-small text-sikapa-text-secondary">Occasional updates and offers.</p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setNewsBusy(true);
              setBanner(null);
              try {
                await newsletterSubscribe(newsEmail.trim() || u.email);
                setBanner({ type: "ok", text: "Subscribed. Check your inbox if confirmation is required." });
              } catch (err) {
                setBanner({ type: "err", text: err instanceof Error ? err.message : "Subscribe failed" });
              } finally {
                setNewsBusy(false);
              }
            }}
          >
            <input
              type="email"
              value={newsEmail || user.email}
              onChange={(e) => setNewsEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
            />
            <button
              type="submit"
              disabled={newsBusy}
              className="shrink-0 rounded-[10px] bg-sikapa-gold px-4 py-2.5 text-small font-semibold text-white disabled:opacity-50"
            >
              {newsBusy ? "…" : "Join"}
            </button>
          </form>
        </section>

        <section className="rounded-[12px] border border-sikapa-crimson/20 bg-white p-5">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-crimson">Close account</h2>
          <p className="mt-1 text-small text-sikapa-text-secondary">This cannot be undone.</p>
          <form onSubmit={delAccount} className="mt-4 space-y-3">
            <input
              type="password"
              required
              value={delPw}
              onChange={(e) => setDelPw(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft"
            />
            <button
              type="submit"
              disabled={delBusy}
              className="w-full rounded-[10px] bg-sikapa-crimson py-2.5 text-small font-semibold text-white disabled:opacity-50"
            >
              {delBusy ? "Closing…" : "Delete account"}
            </button>
          </form>
        </section>

        {user.is_admin && (
          <Link
            href="/admin"
            className="block rounded-[12px] bg-sikapa-text-primary px-5 py-4 text-center text-small font-semibold text-white"
          >
            Admin dashboard
          </Link>
        )}

        <button
          type="button"
          className="w-full rounded-[10px] border border-sikapa-gray-soft bg-white py-3 text-small font-semibold text-sikapa-text-primary"
          onClick={() => logout()}
        >
          Sign out
        </button>
      </div>
    );
  }

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setResetBusy(true);
    setBanner(null);
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
        <h1 className="font-serif text-[1.35rem] font-semibold text-sikapa-text-primary">Account</h1>
        <p className="mt-1 text-small leading-relaxed text-sikapa-text-secondary">
          Sign in to shop, pay securely, and manage your profile.
        </p>
      </div>

      {banner && (
        <p
          className={`rounded-[10px] px-3 py-2.5 text-small ${
            banner.type === "ok"
              ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100"
              : "bg-red-50 text-red-800 ring-1 ring-red-100"
          }`}
        >
          {banner.text}
        </p>
      )}

      <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
        <AccountAuthForm
          defaultMode="signin"
          onClearMessages={() => setBanner(null)}
          onSignInSuccess={() => setBanner({ type: "ok", text: "Signed in." })}
          onRegisterSuccess={() =>
            setBanner({ type: "ok", text: "Account created. Check your email for a verification code." })
          }
        />
      </section>

      <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
        <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">Forgot password</h2>
        <form onSubmit={requestReset} className="mt-4 space-y-3">
          <input
            type="email"
            required
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="Your email"
            className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft focus:ring-2 focus:ring-sikapa-gold/40"
          />
          <button
            type="submit"
            disabled={resetBusy}
            className="w-full rounded-[10px] bg-sikapa-text-primary py-2.5 text-small font-semibold text-white disabled:opacity-50"
          >
            {resetBusy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </section>

      <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
        <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">Set new password</h2>
        <p className="mt-1 text-small text-sikapa-text-secondary">Use the token from your reset email.</p>
        <form onSubmit={confirmReset} className="mt-4 space-y-3">
          <input
            value={resetToken}
            onChange={(e) => setResetToken(e.target.value)}
            placeholder="Reset token"
            className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft"
          />
          <input
            type="password"
            minLength={8}
            value={resetNewPw}
            onChange={(e) => setResetNewPw(e.target.value)}
            placeholder="New password"
            className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft"
          />
          <button
            type="submit"
            disabled={resetConfirmBusy}
            className="w-full rounded-[10px] border border-sikapa-gold py-2.5 text-small font-semibold text-sikapa-gold disabled:opacity-50"
          >
            {resetConfirmBusy ? "Saving…" : "Save new password"}
          </button>
        </form>
      </section>

      <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
        <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">Verify email</h2>
        <p className="mt-1 text-small text-sikapa-text-secondary">Enter the code from your registration email.</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setGuestVerifyBusy(true);
            setBanner(null);
            try {
              await authVerifyEmail(guestVerifyEmail.trim(), guestVerifyCode.trim());
              setGuestVerifyCode("");
              setBanner({ type: "ok", text: "Email verified. You can sign in." });
            } catch (err) {
              setBanner({ type: "err", text: err instanceof Error ? err.message : "Verification failed" });
            } finally {
              setGuestVerifyBusy(false);
            }
          }}
        >
          <input
            type="email"
            required
            value={guestVerifyEmail}
            onChange={(e) => setGuestVerifyEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft"
          />
          <input
            required
            value={guestVerifyCode}
            onChange={(e) => setGuestVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="Code"
            className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft"
          />
          <button
            type="submit"
            disabled={guestVerifyBusy}
            className="w-full rounded-[10px] bg-sikapa-gold py-2.5 text-small font-semibold text-white disabled:opacity-50"
          >
            {guestVerifyBusy ? "Verifying…" : "Verify"}
          </button>
        </form>
      </section>

      <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
        <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">Newsletter</h2>
        <form
          className="mt-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setNewsBusy(true);
            setBanner(null);
            try {
              await newsletterSubscribe(newsEmail.trim());
              setBanner({ type: "ok", text: "Subscribed." });
            } catch (err) {
              setBanner({ type: "err", text: err instanceof Error ? err.message : "Subscribe failed" });
            } finally {
              setNewsBusy(false);
            }
          }}
        >
          <input
            type="email"
            required
            value={newsEmail}
            onChange={(e) => setNewsEmail(e.target.value)}
            placeholder="Email"
            className="min-w-0 flex-1 rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft"
          />
          <button
            type="submit"
            disabled={newsBusy}
            className="shrink-0 rounded-[10px] bg-sikapa-gold px-4 py-2.5 text-small font-semibold text-white"
          >
            {newsBusy ? "…" : "Join"}
          </button>
        </form>
      </section>
    </div>
  );
}
