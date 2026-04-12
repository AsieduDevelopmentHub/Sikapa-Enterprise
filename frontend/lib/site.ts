/** Physical location (home + footer). District omitted for a shorter public line. */
export const SIKAPA_LOCATION_LINE = "New Edubiase, Ashanti Region, Ghana";

/**
 * WhatsApp help link (e.g. https://wa.me/233XXXXXXXXX?text=Hi%20Sikapa).
 * Set `NEXT_PUBLIC_WHATSAPP_HELP_URL` in `.env.local`. Empty = fall back to in-app help only.
 */
export function whatsappHelpUrl(): string {
  const v = process.env.NEXT_PUBLIC_WHATSAPP_HELP_URL?.trim();
  return v && /^https?:\/\//i.test(v) ? v : "";
}
