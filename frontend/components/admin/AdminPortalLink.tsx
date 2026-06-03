"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentProps, MouseEvent, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { syncSessionCookie } from "@/lib/session-cookie";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: string;
  children: ReactNode;
};

/** Admin nav link — syncs the edge session cookie before entering /system. */
export function AdminPortalLink({ href = "/system", onClick, children, ...rest }: Props) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (!accessToken) return;
    e.preventDefault();
    setSyncError(null);
    const synced = await syncSessionCookie(accessToken);
    if (!synced.ok) {
      setSyncError(synced.error);
      return;
    }
    router.push(href);
  }

  return (
    <span className="block">
      <Link href={href} onClick={(e) => void handleClick(e)} {...rest}>
        {children}
      </Link>
      {syncError ? (
        <p className="mt-2 text-[11px] leading-snug text-red-700 dark:text-red-300" role="alert">
          {syncError}
        </p>
      ) : null}
    </span>
  );
}
