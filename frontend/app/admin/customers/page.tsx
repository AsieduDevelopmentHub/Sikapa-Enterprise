"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  adminActivateUser,
  adminDeactivateUser,
  adminFetchUsers,
  type AdminUser,
} from "@/lib/api/admin";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";

export default function AdminCustomersPage() {
  const { accessToken, user: me } = useAuth();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await adminFetchUsers(accessToken, { limit: 100 });
      setRows(data.filter((u) => !u.is_admin));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) => {
      const hay = `${u.name ?? ""} ${u.username ?? ""} ${u.email ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-page-title font-semibold">Customers</h1>
          <p className="text-small text-sikapa-text-secondary">Registered shoppers (excludes admin accounts).</p>
        </div>
        <AdminSearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name, username, or email…"
          hint={query ? `${visibleRows.length} of ${rows.length} shown` : undefined}
        />
      </div>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      {loading ? (
        <p className="mt-6 text-small text-sikapa-text-muted">Loading…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
          <table className="w-full min-w-[560px] text-left text-small">
            <thead className="border-b border-black/[0.06] text-[11px] font-semibold uppercase tracking-wider text-sikapa-text-muted">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sikapa-gray-soft">
              {visibleRows.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-[11px] text-sikapa-text-muted">@{u.username}</p>
                  </td>
                  <td className="px-4 py-3 text-sikapa-text-muted">{u.email ?? "—"}</td>
                  <td className="px-4 py-3 text-[11px] text-sikapa-text-muted">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id === me?.id ? (
                      <span className="text-[11px] text-sikapa-text-muted">You</span>
                    ) : u.is_active ? (
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-red-700 hover:underline"
                        onClick={() => {
                          if (!accessToken || !confirm(`Deactivate ${u.username}?`)) return;
                          void (async () => {
                            try {
                              await adminDeactivateUser(accessToken, u.id);
                              await load();
                            } catch (e) {
                              alert(e instanceof Error ? e.message : "Failed");
                            }
                          })();
                        }}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                        onClick={() => {
                          if (!accessToken) return;
                          void (async () => {
                            try {
                              await adminActivateUser(accessToken, u.id);
                              await load();
                            } catch (e) {
                              alert(e instanceof Error ? e.message : "Failed");
                            }
                          })();
                        }}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 && (
            <p className="px-4 py-8 text-center text-small text-sikapa-text-muted">
              {query ? "No customers match your search." : "No customers."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
