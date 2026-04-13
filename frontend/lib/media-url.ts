import { getBackendOrigin } from "@/lib/api/client";

/** Turn API-relative paths (e.g. `/uploads/...`) into an absolute URL for `<Image src>`. */
export function resolveMediaUrl(pathOrUrl: string | null | undefined): string {
  const t = pathOrUrl?.trim();
  if (!t) return "https://placehold.co/200x200/e8e4e0/6b5b54?text=Sikapa";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const origin = getBackendOrigin();
  return `${origin}${t.startsWith("/") ? "" : "/"}${t}`;
}
