"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  adminFetchUsers,
  adminPromoteUser,
  adminRevokeAdmin,
  type AdminUser,
} from "@/lib/api/admin";

export default function AdminStaffPage() {
  const { accessToken, user: me } = useAuth();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await adminFetchUsers(accessToken, { limit: 100, is_admin: true });
      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const nonAdmins = useCallback(async () => {
    if (!accessToken) return;
    const all = await adminFetchUsers(accessToken, { limit: 100 });
    const pick = all.find((u) => !u.is_admin);
    if (!pick) {
      alert("No non-admin user to promote. Register a test account first.");
      return;
    }
    if (!confirm(`Grant admin to @${pick.username}?`)) return;
    try {
      await adminPromoteUser(accessToken, pick.id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  }, [accessToken, load]);

  return (
    <div>
      <h1 className="font-serif text-page-title font-semibold">Staff & admins</h1>
      <p className="text-small text-sikapa-text-secondary">
        Super-admins use the same role today; granular RBAC can extend the backend later.
      </p>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => void nonAdmins()}
          className="rounded-full bg-sikapa-crimson px-4 py-2 text-small font-semibold text-white"
        >
          Promote next customer to admin
        </button>
      </div>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      <ul className="mt-6 divide-y divide-sikapa-gray-soft rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        {rows.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p className="font-semibold">{u.name}</p>
              <p className="text-[11px] text-sikapa-text-muted">
                @{u.username} · {u.email ?? "no email"}
              </p>
            </div>
            {u.id !== me?.id ? (
              <button
                type="button"
                className="text-[11px] font-semibold text-red-700 hover:underline"
                onClick={() => {
                  if (!accessToken || !confirm(`Revoke admin from @${u.username}?`)) return;
                  void (async () => {
                    try {
                      await adminRevokeAdmin(accessToken, u.id);
                      await load();
                    } catch (e) {
                      alert(e instanceof Error ? e.message : "Failed");
                    }
                  })();
                }}
              >
                Revoke admin
              </button>
            ) : (
              <span className="text-[11px] text-sikapa-text-muted">You</span>
            )}
          </li>
        ))}
        {rows.length === 0 && !err && (
          <li className="px-4 py-8 text-center text-small text-sikapa-text-muted">No admins.</li>
        )}
      </ul>
    </div>
  );
}
