import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { template: "%s · Sikapa Admin", default: "Admin · Sikapa Admin" },
  robots: { index: false, follow: false },
  description: "Sikapa storefront administration.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
