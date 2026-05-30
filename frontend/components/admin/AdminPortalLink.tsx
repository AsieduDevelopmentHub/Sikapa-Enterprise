"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
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

  async function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (!accessToken) return;
    e.preventDefault();
    await syncSessionCookie(accessToken);
    router.push(href);
  }

  return (
    <Link href={href} onClick={(e) => void handleClick(e)} {...rest}>
      {children}
    </Link>
  );
}
