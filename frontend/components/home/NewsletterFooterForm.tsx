"use client";

import { useState } from "react";
import Link from "next/link";
import { newsletterSubscribe } from "@/lib/api/subscriptions";
import { validateEmail } from "@/lib/validation/input";

export function NewsletterFooterForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-sikapa-gold/90">Newsletter</p>
      <p className="mt-1 text-[11px] leading-relaxed text-white/55">
        Occasional drops, restocks, and beauty tips. Unsubscribe anytime.
      </p>
      <p className="mt-1 text-[11px] text-white/60">
        Already subscribed?{" "}
        <Link href="/newsletter/unsubscribe" className="font-semibold text-sikapa-gold hover:underline">
          Unsubscribe here
        </Link>
        .
      </p>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          const err = validateEmail(email);
          if (err) {
            setMsg(err);
            setBusy(false);
            return;
          }
          try {
            await newsletterSubscribe(email.trim());
            setMsg("Thanks — you are on the list.");
            setEmail("");
          } catch (ex) {
            setMsg(ex instanceof Error ? ex.message : "Could not subscribe.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="min-w-0 flex-1 rounded-[10px] border-0 bg-white/10 py-2.5 px-3 text-small text-white placeholder:text-white/40 ring-1 ring-white/15 focus:ring-2 focus:ring-sikapa-gold/50"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-[10px] bg-sikapa-gold px-4 py-2.5 text-small font-semibold text-white disabled:opacity-50"
        >
          {busy ? "…" : "Subscribe"}
        </button>
      </form>
      {msg ? <p className="mt-2 text-[11px] text-white/70">{msg}</p> : null}
    </div>
  );
}
