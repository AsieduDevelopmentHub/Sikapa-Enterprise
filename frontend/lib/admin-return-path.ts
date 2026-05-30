/** Safe post-login return path for admin gate redirects (?from=). */
export function sanitizeAdminReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const path = raw.trim();
  if (path !== "/system" && !path.startsWith("/system/")) return null;
  if (path.includes("//") || path.includes("://") || path.includes("?") || path.includes("#")) {
    return null;
  }
  return path;
}

export function accountUrlWithAdminReturn(fromPath: string): string {
  return `/account?from=${encodeURIComponent(fromPath)}`;
}
