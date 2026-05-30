/** Optional Sentry bootstrap (D-013) — skipped when SENTRY_DSN is unset. */
export async function register() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    });
  }
}
