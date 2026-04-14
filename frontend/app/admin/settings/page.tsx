"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { adminFetchSettings, adminUpsertSetting, type BusinessSettingRow } from "@/lib/api/admin";

export default function AdminSettingsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<BusinessSettingRow[]>([]);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setRows(await adminFetchSettings(accessToken));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load settings");
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      await adminUpsertSetting(accessToken, { key, value });
      setKey("");
      setValue("");
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Save failed");
    }
  };

  return (
    <div>
      <h1 className="font-serif text-page-title font-semibold">Settings</h1>
      <p className="mt-2 text-small text-sikapa-text-secondary">
        Editable business settings stored in the database.
      </p>
      {err && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-small text-red-800">{err}</p>}
      <form
        onSubmit={(e) => void save(e)}
        className="mt-6 grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06] sm:grid-cols-[1fr_2fr_auto]"
      >
        <input
          required
          placeholder="setting key (e.g. delivery_fee_default)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="rounded-lg border border-black/[0.08] px-3 py-2 text-small"
        />
        <input
          required
          placeholder="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-lg border border-black/[0.08] px-3 py-2 text-small"
        />
        <button type="submit" className="rounded-full bg-sikapa-crimson px-4 py-2 text-small font-semibold text-white">
          Save
        </button>
      </form>
      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <table className="w-full min-w-[720px] text-left text-small">
          <thead className="border-b border-black/[0.06] text-[11px] uppercase tracking-wider text-sikapa-text-muted">
            <tr>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sikapa-gray-soft">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="px-4 py-3 font-mono text-[11px]">{r.key}</td>
                <td className="px-4 py-3">{r.value}</td>
                <td className="px-4 py-3 text-[11px] text-sikapa-text-muted">
                  {new Date(r.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-small text-sikapa-text-muted">
                  No settings saved yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
