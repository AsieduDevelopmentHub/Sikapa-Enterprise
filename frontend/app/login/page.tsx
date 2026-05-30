import { redirect } from "next/navigation";

import { accountUrlWithAdminReturn, sanitizeAdminReturnPath } from "@/lib/admin-return-path";

type Props = {
  searchParams: Promise<{ from?: string }>;
};

/** Legacy admin gate target — sign-in lives at /account. */
export default async function LoginRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const from = sanitizeAdminReturnPath(params.from);
  redirect(from ? accountUrlWithAdminReturn(from) : "/account");
}
