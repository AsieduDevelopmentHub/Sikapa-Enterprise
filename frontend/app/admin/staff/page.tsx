"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDialog } from "@/context/DialogContext";
import {
  adminFetchUsers,
  adminSetStaffRole,
  adminPromoteUser,
  adminRevokeAdmin,
  type AdminUser,
} from "@/lib/api/admin";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminStaffListSkeleton } from "@/components/admin/Skeleton";

const ROLE_PRESETS: Record<"super_admin" | "admin" | "staff", string[]> = {
  super_admin: [],
  admin: [
    "view_users",
    "manage_users",
    "manage_staff",
    "manage_products",
    "manage_orders",
    "manage_inventory",
    "manage_coupons",
    "manage_reviews",
    "view_analytics",
    "view_payments",
    "manage_settings",
  ],
  staff: ["manage_products", "manage_orders", "manage_inventory", "manage_reviews", "view_analytics"],
};

export default function AdminStaffPage() {
  const { accessToken, user: me } = useAuth();
  const { confirm: confirmDialog, alert: alertDialog } = useDialog();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [candidateId, setCandidateId] = useState<number | "">("");
  const [candidateRole, setCandidateRole] = useState<"admin" | "staff">("staff");
  const [err, setErr] = useState<string | null>(null);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [staffQuery, setStaffQuery] = useState("");
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await adminFetchUsers(accessToken, { limit: 100 });
      setAllUsers(data);
      setRows(data.filter((u) => u.is_admin));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setReady(true);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const candidates = useMemo(() => {
    const base = allUsers.filter((u) => !u.is_admin);
    const q = candidateQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((u) =>
      `${u.name ?? ""} ${u.username ?? ""} ${u.email ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [allUsers, candidateQuery]);

  const visibleStaff = useMemo(() => {
    const q = staffQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) =>
      `${u.name ?? ""} ${u.username ?? ""} ${u.email ?? ""} ${
        u.admin_role ?? ""
      } ${u.admin_permissions ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [rows, staffQuery]);

  return (
    <div className="w-full min-w-0 max-w-full">
      <h1 className="font-serif text-page-title font-semibold">Staff & admins</h1>
      <p className="text-small text-sikapa-text-secondary">
        Configure role and permission scope per team member.
      </p>
      <div className="mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06] sm:p-5">
          <p className="text-small font-semibold text-sikapa-text-primary">Add specific user as staff/admin</p>
          <div className="mt-3">
            <AdminSearchInput
              value={candidateQuery}
              onChange={setCandidateQuery}
              placeholder="Filter users by name, username, or email…"
              hint={
                candidateQuery
                  ? `${candidates.length} user${candidates.length === 1 ? "" : "s"} match`
                  : undefined
              }
              maxWidthClassName="sm:max-w-md"
            />
          </div>
          <div className="mt-3 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <select
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value ? Number(e.target.value) : "")}
              className="sikapa-select w-full min-w-0 text-small sm:min-w-[200px] sm:flex-1 sm:max-w-md"
            >
              <option value="">Select user…</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || "No name"} (@{u.username})
                </option>
              ))}
            </select>
            <select
              value={candidateRole}
              onChange={(e) => setCandidateRole(e.target.value as "admin" | "staff")}
              className="sikapa-select w-full text-small sm:w-auto sm:shrink-0"
            >
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
            <button
              type="button"
              className="w-full rounded-full bg-sikapa-crimson px-4 py-2 text-small font-semibold text-white sm:w-auto sm:shrink-0"
              onClick={() => {
                if (!accessToken || !candidateId) return;
                const pick = candidates.find((u) => u.id === candidateId);
                if (!pick) return;
                void (async () => {
                  try {
                    await adminPromoteUser(accessToken, pick.id);
                    await adminSetStaffRole(accessToken, pick.id, {
                      role: candidateRole,
                      permissions: ROLE_PRESETS[candidateRole],
                    });
                    setCandidateId("");
                    await load();
                  } catch (e) {
                    void alertDialog(e instanceof Error ? e.message : "Failed", { variant: "error" });
                  }
                })();
              }}
            >
              Add to staff
            </button>
          </div>
        </div>
      </div>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-section-title font-semibold text-sikapa-text-primary">
          Current staff & admins
        </h2>
        <AdminSearchInput
          value={staffQuery}
          onChange={setStaffQuery}
          placeholder="Search staff…"
          hint={staffQuery ? `${visibleStaff.length} of ${rows.length} shown` : undefined}
        />
      </div>
      {!ready && !err ? (
        <AdminStaffListSkeleton />
      ) : (
      <ul className="mt-3 divide-y divide-sikapa-gray-soft rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        {visibleStaff.map((u) => (
          <li
            key={u.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="break-words font-semibold">{u.name}</p>
              <p className="break-words text-[11px] text-sikapa-text-muted">
                @{u.username} · {u.email ?? "no email"} · role: {u.admin_role ?? "admin"}
              </p>
              {u.admin_permissions ? (
                <p className="mt-1 break-words text-[11px] text-sikapa-text-muted">
                  Permissions: {u.admin_permissions}
                </p>
              ) : null}
            </div>
            <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
              {u.id !== me?.id ? (
                <>
                  <select
                    className="sikapa-select min-w-0 flex-1 py-1.5 pl-2 pr-8 text-[11px] sm:flex-none sm:min-w-[8rem]"
                    value={u.admin_role ?? "admin"}
                    onChange={(e) => {
                      if (!accessToken) return;
                      const role = e.target.value as "super_admin" | "admin" | "staff";
                      void adminSetStaffRole(accessToken, u.id, {
                        role,
                        permissions: ROLE_PRESETS[role],
                      })
                        .then(load)
                        .catch((er) =>
                          void alertDialog(er instanceof Error ? er.message : "Failed", { variant: "error" })
                        );
                    }}
                  >
                    <option value="super_admin">super_admin</option>
                    <option value="admin">admin</option>
                    <option value="staff">staff</option>
                  </select>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-red-700 hover:underline"
                    onClick={() => {
                      void (async () => {
                        if (!accessToken) return;
                        const ok = await confirmDialog({
                          title: "Revoke admin access",
                          message: `Revoke admin from @${u.username}?`,
                          confirmLabel: "Revoke",
                          variant: "danger",
                        });
                        if (!ok) return;
                        try {
                          await adminRevokeAdmin(accessToken, u.id);
                          await load();
                        } catch (e) {
                          await alertDialog(e instanceof Error ? e.message : "Failed", { variant: "error" });
                        }
                      })();
                    }}
                  >
                    Revoke admin
                  </button>
                </>
              ) : (
                <span className="text-[11px] text-sikapa-text-muted">You</span>
              )}
            </div>
          </li>
        ))}
        {visibleStaff.length === 0 && !err && ready && (
          <li className="px-4 py-8 text-center text-small text-sikapa-text-muted">
            {staffQuery ? "No staff match your search." : "No admins."}
          </li>
        )}
      </ul>
      )}
    </div>
  );
}
