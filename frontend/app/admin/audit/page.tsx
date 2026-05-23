"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetchAuditLogs, type AuditLogRow } from "@/lib/api/admin";
import { Skeleton } from "@/components/admin/Skeleton";
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton";
import { useAdminLiveLoad } from "@/lib/hooks/useAdminLiveLoad";

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatChanges(changes: unknown): string {
  if (changes == null) return "—";
  if (typeof changes === "string") return changes;
  try {
    return JSON.stringify(changes, null, 0);
  } catch {
    return String(changes);
  }
}

export default function AdminAuditPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resourceType, setResourceType] = useState("");
  const [action, setAction] = useState("");

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!accessToken) return;
    if (!opts?.silent) setLoading(true);
    setErr(null);
    try {
      const data = await adminFetchAuditLogs(accessToken, {
        limit: 100,
        resource_type: resourceType.trim() || undefined,
        action: action.trim() || undefined,
      });
      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load audit logs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, resourceType, action]);

  const { reload } = useAdminLiveLoad(load, [accessToken, resourceType, action]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-[1.5rem] font-semibold text-sikapa-text-primary">Audit log</h1>
          <p className="mt-1 text-small text-sikapa-text-secondary">
            Actions recorded in Supabase/Postgres (`auditlog`). Syncs with order, product, staff, and payment events.
          </p>
        </div>
        <AdminRefreshButton onClick={() => reload()} loading={loading} />
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Resource type (order, product…)"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          className="rounded-lg border border-sikapa-gray-soft px-3 py-2 text-small"
        />
        <input
          type="text"
          placeholder="Action (status_change, order_created…)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-lg border border-sikapa-gray-soft px-3 py-2 text-small"
        />
        <button
          type="button"
          onClick={() => reload()}
          className="rounded-lg bg-sikapa-gold px-4 py-2 text-small font-semibold text-white"
        >
          Filter
        </button>
      </div>

      {err && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-small text-red-900">{err}</p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-small text-sikapa-text-secondary">No audit entries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-black/[0.06]">
          <table className="min-w-full text-left text-small">
            <thead className="border-b border-black/[0.06] bg-sikapa-cream/60 text-[10px] uppercase tracking-wider text-sikapa-text-muted">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Resource</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Changes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-black/[0.04] align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-sikapa-text-secondary">
                    {formatWhen(r.created_at)}
                  </td>
                  <td className="px-3 py-2">
                    {r.actor_username ? `@${r.actor_username}` : r.user_id ? `User ${r.user_id}` : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.resource_type}
                    {r.resource_id != null ? `#${r.resource_id}` : ""}
                  </td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="max-w-md truncate px-3 py-2 font-mono text-[11px] text-sikapa-text-secondary">
                    {formatChanges(r.changes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
