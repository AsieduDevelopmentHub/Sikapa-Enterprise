export const COOKIE_PREFERENCES_KEY = "sikapa_cookie_preferences";

export type CookiePreferences = {
  essential: true;
  analytics: boolean;
  decidedAt: string;
};

export function readCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    if (!parsed?.decidedAt) return null;
    return { essential: true, analytics: Boolean(parsed.analytics), decidedAt: parsed.decidedAt };
  } catch {
    return null;
  }
}

export function writeCookiePreferences(analytics: boolean): CookiePreferences {
  const payload: CookiePreferences = {
    essential: true,
    analytics,
    decidedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("sikapa:cookie-consent", { detail: payload }));
  }
  return payload;
}

export function analyticsConsentGranted(): boolean {
  return readCookiePreferences()?.analytics === true;
}
