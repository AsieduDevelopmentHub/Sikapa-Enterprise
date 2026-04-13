"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AccountTwoFactorPanel } from "@/components/account/AccountTwoFactorPanel";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  authChangePassword,
  authDeleteAccount,
  authUpdateProfile,
  authVerifyEmail,
} from "@/lib/api/auth";
import { newsletterSubscribe } from "@/lib/api/subscriptions";
import type { WishlistItemRead } from "@/lib/api/wishlist";
import { wishlistList } from "@/lib/api/wishlist";
import {
  sanitizeDigits,
  sanitizePlainText,
  validateEmail,
  validatePassword,
  validatePhoneOptional,
} from "@/lib/validation/input";

type Panel =
  | "home"
  | "settings"
  | "address"
  | "appearance"
  | "security"
  | "notifications"
  | "wishlist"
  | "verify"
  | "newsletter"
  | "danger";

function NavRow({
  label,
  hint,
  onClick,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sikapa-tap flex w-full items-center justify-between gap-3 rounded-[12px] bg-white px-4 py-3.5 text-left shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10"
    >
      <span>
        <span className="block text-small font-semibold text-sikapa-text-primary dark:text-zinc-100">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[11px] text-sikapa-text-muted dark:text-zinc-500">{hint}</span>
        ) : null}
      </span>
      <span className="text-sikapa-text-muted dark:text-zinc-500" aria-hidden>
        ›
      </span>
    </button>
  );
}

export function AccountSignedInHub() {
  const { user, accessToken, logout, refreshProfile } = useAuth();
  const { preference, setPreference } = useTheme();
  const [panel, setPanel] = useState<Panel>("home");
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [shipRegion, setShipRegion] = useState("");
  const [shipCity, setShipCity] = useState("");
  const [shipLine1, setShipLine1] = useState("");
  const [shipLine2, setShipLine2] = useState("");
  const [shipLandmark, setShipLandmark] = useState("");
  const [shipContactName, setShipContactName] = useState("");
  const [shipContactPhone, setShipContactPhone] = useState("");
  const [shipBusy, setShipBusy] = useState(false);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const [inboxEmail, setInboxEmail] = useState("");
  const [inboxCode, setInboxCode] = useState("");
  const [inboxBusy, setInboxBusy] = useState(false);

  const [newsEmail, setNewsEmail] = useState("");
  const [newsBusy, setNewsBusy] = useState(false);

  const [delPw, setDelPw] = useState("");
  const [delBusy, setDelBusy] = useState(false);

  const [wishItems, setWishItems] = useState<WishlistItemRead[]>([]);
  const [wishLoading, setWishLoading] = useState(false);

  const token = accessToken as string;
  const u = user!;

  useEffect(() => {
    setName(u.name ?? "");
    setUsername(u.username ?? "");
    setPhone(u.phone ?? "");
    setShipRegion(u.shipping_region ?? "");
    setShipCity(u.shipping_city ?? "");
    setShipLine1(u.shipping_address_line1 ?? "");
    setShipLine2(u.shipping_address_line2 ?? "");
    setShipLandmark(u.shipping_landmark ?? "");
    setShipContactName(u.shipping_contact_name ?? u.name ?? "");
    setShipContactPhone(u.shipping_contact_phone ?? u.phone ?? "");
    if (!u.email_verified && u.email) setInboxEmail(u.email);
  }, [u]);

  const loadWishlist = useCallback(async () => {
    if (!accessToken) return;
    setWishLoading(true);
    try {
      const rows = await wishlistList(accessToken);
      setWishItems(rows);
    } catch {
      setBanner({ type: "err", text: "Could not load wishlist." });
    } finally {
      setWishLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (panel === "wishlist") void loadWishlist();
  }, [panel, loadWishlist]);

  const displayName = (u.name || "").trim() || u.username || u.email || "User";

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    const phoneErr = validatePhoneOptional(phone);
    if (phoneErr) {
      setBanner({ type: "err", text: phoneErr });
      return;
    }
    setProfileBusy(true);
    try {
      await authUpdateProfile(token, {
        name: sanitizePlainText(name, 120) || null,
        username: sanitizePlainText(username, 50)?.toLowerCase() || null,
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
    const err = validatePassword(newPw, 8);
    if (err) {
      setBanner({ type: "err", text: err });
      return;
    }
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
    const em = inboxEmail.trim() || u.email || "";
    const emailErr = validateEmail(em);
    if (emailErr) {
      setBanner({ type: "err", text: emailErr });
      return;
    }
    const code = sanitizeDigits(inboxCode, 12);
    if (code.length < 6) {
      setBanner({ type: "err", text: "Enter the verification code from your email." });
      return;
    }
    setInboxBusy(true);
    try {
      await authVerifyEmail(em, code);
      setInboxCode("");
      await refreshProfile();
      setBanner({ type: "ok", text: "Email verified." });
      setPanel("home");
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

  async function saveShippingProfile(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);
    if (!shipRegion.trim() || !shipCity.trim() || !shipLine1.trim()) {
      setBanner({ type: "err", text: "Region, city, and address line 1 are required." });
      return;
    }
    setShipBusy(true);
    try {
      await authUpdateProfile(token, {
        shipping_region: sanitizePlainText(shipRegion, 80) || null,
        shipping_city: sanitizePlainText(shipCity, 120) || null,
        shipping_address_line1: sanitizePlainText(shipLine1, 255) || null,
        shipping_address_line2: sanitizePlainText(shipLine2, 255) || null,
        shipping_landmark: sanitizePlainText(shipLandmark, 255) || null,
        shipping_contact_name: sanitizePlainText(shipContactName, 120) || null,
        shipping_contact_phone: sanitizePlainText(shipContactPhone, 32) || null,
      });
      await refreshProfile();
      setBanner({ type: "ok", text: "Shipping profile updated." });
    } catch (err) {
      setBanner({ type: "err", text: err instanceof Error ? err.message : "Could not save shipping profile" });
    } finally {
      setShipBusy(false);
    }
  }

  async function clearShippingProfile() {
    setBanner(null);
    setShipBusy(true);
    try {
      await authUpdateProfile(token, {
        shipping_region: "",
        shipping_city: "",
        shipping_address_line1: "",
        shipping_address_line2: "",
        shipping_landmark: "",
        shipping_contact_name: "",
        shipping_contact_phone: "",
      });
      await refreshProfile();
      setBanner({ type: "ok", text: "Shipping profile cleared." });
    } catch (err) {
      setBanner({ type: "err", text: err instanceof Error ? err.message : "Could not clear shipping profile" });
    } finally {
      setShipBusy(false);
    }
  }

  if (!user || !accessToken) return null;

  return (
    <div className="mx-auto max-w-mobile space-y-4 px-5 py-8">
      {banner && (
        <p
          className={`rounded-[10px] px-3 py-2.5 text-small ${
            banner.type === "ok"
              ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-800"
              : "bg-red-50 text-red-800 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-100 dark:ring-red-900"
          }`}
        >
          {banner.text}
        </p>
      )}

      {panel !== "home" && (
        <button
          type="button"
          className="sikapa-tap text-small font-semibold text-sikapa-gold"
          onClick={() => {
            setPanel("home");
            setBanner(null);
          }}
        >
          ← Back
        </button>
      )}

      {panel === "home" && (
        <>
          <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-text-muted">Signed in as</p>
            <h1 className="mt-1 font-serif text-[1.25rem] font-semibold text-sikapa-text-primary dark:text-zinc-100">
              {displayName}
            </h1>
            <p className="mt-0.5 text-small text-sikapa-text-secondary">
              @{u.username}{u.email ? ` · ${u.email}` : ""}
            </p>
            <p className="mt-2 text-small text-sikapa-text-secondary">
              Email{" "}
              <span className="font-semibold text-sikapa-text-primary dark:text-zinc-100">
                {u.email_verified ? "verified" : "not verified yet"}
              </span>
            </p>
          </section>

          <div className="space-y-2">
            <NavRow label="Profile & settings" hint="Name, username, phone" onClick={() => setPanel("settings")} />
            <NavRow
              label="Address & contact"
              hint="Default shipping details for faster checkout"
              onClick={() => setPanel("address")}
            />
            <NavRow label="Appearance" hint="Light, dark, or system" onClick={() => setPanel("appearance")} />
            <NavRow label="Security" hint="Password and two-step sign-in" onClick={() => setPanel("security")} />
            <NavRow label="Notifications" hint="How we reach you" onClick={() => setPanel("notifications")} />
            <NavRow label="Wishlist" hint="Saved products" onClick={() => setPanel("wishlist")} />
            {!!u.email && !u.email_verified && (
              <NavRow label="Verify email" hint="Enter your inbox code" onClick={() => setPanel("verify")} />
            )}
            <NavRow label="Newsletter" hint="Offers and updates" onClick={() => setPanel("newsletter")} />
            <NavRow label="Close account" hint="Permanent" onClick={() => setPanel("danger")} />
          </div>

          {accessToken && u.is_admin === true ? (
            <Link
              href="/admin"
              className="block rounded-[12px] bg-sikapa-text-primary px-5 py-4 text-center text-small font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Admin dashboard
            </Link>
          ) : null}

          <button
            type="button"
            className="w-full rounded-[12px] border border-sikapa-gray-soft bg-white py-3 text-small font-semibold text-sikapa-text-primary dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
            onClick={() => logout()}
          >
            Sign out
          </button>
        </>
      )}

      {panel === "settings" && (
        <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
            Profile
          </h2>
          <form onSubmit={saveProfile} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200" htmlFor="hub-name">
                  Name
                </label>
                <input
                  id="hub-name"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
                />
              </div>
              <div>
                <label className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200" htmlFor="hub-username">
                  Username
                </label>
                <input
                  id="hub-username"
                  value={username}
                  maxLength={80}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
                />
              </div>
            </div>
            <div>
              <label className="text-small font-medium text-sikapa-text-primary dark:text-zinc-200" htmlFor="hub-ph">
                Phone
              </label>
              <input
                id="hub-ph"
                value={phone}
                maxLength={24}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
              />
            </div>
            <button
              type="submit"
              disabled={profileBusy}
              className="sikapa-btn-gold sikapa-tap w-full rounded-[10px] py-2.5 text-small font-semibold text-white disabled:opacity-50"
            >
              {profileBusy ? "Saving…" : "Save"}
            </button>
          </form>
        </section>
      )}

      {panel === "appearance" && (
        <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
            Appearance
          </h2>
          <p className="mt-1 text-small text-sikapa-text-secondary">Choose how Sikapa looks on this device.</p>
          <div className="mt-4 flex flex-col gap-2">
            {(
              [
                { id: "light" as const, label: "Light" },
                { id: "dark" as const, label: "Dark" },
                { id: "system" as const, label: "System" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreference(opt.id)}
                className={`sikapa-tap rounded-[10px] border py-3 text-small font-semibold ${
                  preference === opt.id
                    ? "border-sikapa-gold bg-sikapa-cream text-sikapa-text-primary dark:bg-zinc-800 dark:text-zinc-100"
                    : "border-sikapa-gray-soft text-sikapa-text-secondary dark:border-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {panel === "address" && (
        <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
            Default shipping profile
          </h2>
          <p className="mt-1 text-small text-sikapa-text-secondary dark:text-zinc-400">
            Used to prefill checkout. You can still override contact per order.
          </p>
          <form onSubmit={saveShippingProfile} className="mt-4 space-y-3">
            <input
              value={shipRegion}
              onChange={(e) => setShipRegion(e.target.value)}
              placeholder="Region"
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
            <input
              value={shipCity}
              onChange={(e) => setShipCity(e.target.value)}
              placeholder="City / town"
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
            <input
              value={shipLine1}
              onChange={(e) => setShipLine1(e.target.value)}
              placeholder="Address line 1"
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
            <input
              value={shipLine2}
              onChange={(e) => setShipLine2(e.target.value)}
              placeholder="Address line 2 (optional)"
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
            <input
              value={shipLandmark}
              onChange={(e) => setShipLandmark(e.target.value)}
              placeholder="Landmark (optional)"
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
            <input
              value={shipContactName}
              onChange={(e) => setShipContactName(e.target.value)}
              placeholder="Default contact name"
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
            <input
              value={shipContactPhone}
              onChange={(e) => setShipContactPhone(e.target.value)}
              placeholder="Default contact phone"
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
            <button
              type="submit"
              disabled={shipBusy}
              className="sikapa-btn-gold sikapa-tap w-full rounded-[10px] py-2.5 text-small font-semibold text-white disabled:opacity-50"
            >
              {shipBusy ? "Saving…" : "Save shipping profile"}
            </button>
            <button
              type="button"
              disabled={shipBusy}
              onClick={() => void clearShippingProfile()}
              className="w-full rounded-[10px] border border-sikapa-gray-soft py-2.5 text-small font-semibold text-sikapa-text-primary disabled:opacity-50 dark:border-white/10 dark:text-zinc-100"
            >
              Clear saved address
            </button>
          </form>
        </section>
      )}

      {panel === "security" && (
        <div className="space-y-5">
          <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
            <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
              Password
            </h2>
            <form onSubmit={changePw} className="mt-4 space-y-3">
              <input
                type="password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
                className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
              />
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min. 8)"
                autoComplete="new-password"
                minLength={8}
                className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
              />
              <button
                type="submit"
                disabled={pwBusy}
                className="w-full rounded-[10px] border border-sikapa-gray-soft py-2.5 text-small font-semibold text-sikapa-text-primary disabled:opacity-50 dark:border-white/10 dark:text-zinc-100"
              >
                {pwBusy ? "Updating…" : "Update password"}
              </button>
            </form>
          </section>
          <AccountTwoFactorPanel />
        </div>
      )}

      {panel === "notifications" && (
        <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
            Notifications
          </h2>
          <p className="mt-3 text-small leading-relaxed text-sikapa-text-secondary">
            {u.email
              ? `Order updates, delivery notes, and account security alerts are sent to your email on file (${u.email}).`
              : "No email is on this account yet. Add one to receive email notifications."}
          </p>
        </section>
      )}

      {panel === "wishlist" && (
        <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
            Wishlist
          </h2>
          {wishLoading ? (
            <p className="mt-3 text-small text-sikapa-text-muted">Loading…</p>
          ) : wishItems.length === 0 ? (
            <p className="mt-3 text-small text-sikapa-text-secondary">No saved products yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-sikapa-gray-soft dark:divide-white/10">
              {wishItems.map((w) => (
                <li key={w.id} className="py-3 first:pt-0">
                  <Link
                    href={`/product/${w.product_id}`}
                    className="font-semibold text-sikapa-gold hover:underline dark:text-amber-200"
                  >
                    {w.product_name || `Product #${w.product_id}`}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {panel === "verify" && (
        <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
            Verify email
          </h2>
          <form onSubmit={verifySignedIn} className="mt-4 space-y-3">
            <input
              type="email"
              value={inboxEmail}
              onChange={(e) => setInboxEmail(e.target.value)}
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
            <input
              inputMode="numeric"
              value={inboxCode}
              onChange={(e) => setInboxCode(sanitizeDigits(e.target.value, 6))}
              placeholder="6-digit code"
              maxLength={6}
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
            />
            <button
              type="submit"
              disabled={inboxBusy}
              className="w-full rounded-[10px] border border-sikapa-gold py-2.5 text-small font-semibold text-sikapa-gold disabled:opacity-50"
            >
              {inboxBusy ? "Verifying…" : "Confirm"}
            </button>
          </form>
        </section>
      )}

      {panel === "newsletter" && (
        <section className="rounded-[12px] bg-white p-5 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-900 dark:ring-white/10">
          <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary dark:text-zinc-100">
            Newsletter
          </h2>
          <form
            className="mt-4 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setNewsBusy(true);
              setBanner(null);
              const em = newsEmail.trim() || u.email || "";
              const err = validateEmail(em);
              if (err) {
                setBanner({ type: "err", text: err });
                setNewsBusy(false);
                return;
              }
              try {
                await newsletterSubscribe(em);
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
              value={newsEmail || u.email || ""}
              onChange={(e) => setNewsEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
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
      )}

      {panel === "danger" && (
        <section className="rounded-[12px] border border-sikapa-crimson/20 bg-white p-5 dark:border-red-900/40 dark:bg-zinc-900">
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
              className="w-full rounded-[10px] border-0 bg-sikapa-cream py-2.5 px-3 text-body ring-1 ring-sikapa-gray-soft dark:bg-zinc-800 dark:text-zinc-100 dark:ring-white/10"
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
      )}
    </div>
  );
}
