import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || process.env.SENTRY_DSN?.trim();
const sentryCommon = {
  dsn,
  tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  ignoreErrors: [
    /Paystack is not configured/i,
    /PAYSTACK_SECRET_KEY/i,
  ],
};

if (dsn) {
  Sentry.init(sentryCommon);
}
