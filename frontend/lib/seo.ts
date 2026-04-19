import type { Metadata } from "next";
import { publicSiteBaseUrl } from "@/lib/site";

export const SITE_NAME = "Sikapa Enterprise";

/** Primary meta description used when a page omits its own. */
export const SITE_DEFAULT_DESCRIPTION =
  "Sikapa Enterprise — luxury beauty and lifestyle in Ghana. Shop premium cosmetics, human hair wigs, skincare, perfumes, and hair care with secure checkout and nationwide delivery.";

export const SITE_KEYWORDS: string[] = [
  "Sikapa",
  "Sikapa Enterprise",
  "beauty shop Ghana",
  "cosmetics Ghana",
  "wigs Ghana",
  "human hair wigs",
  "skincare",
  "perfumes",
  "hair care",
  "makeup online",
  "beauty products",
  "online beauty store",
  "Ashanti",
  "New Edubiase",
];

export function metadataBaseUrl(): URL {
  const raw = publicSiteBaseUrl();
  return new URL(raw && /^https?:\/\//i.test(raw) ? raw : "http://localhost:3000");
}

/** OG / Twitter preview image (under `public/`). */
export const SITE_OG_IMAGE = "/assets/logos/primary.png";

/** Browser tab / shortcut icon (square logo under `public/`). */
export const SITE_FAVICON_IMAGE = "/assets/logos/brandmark.png";

/**
 * Default metadata merged at the root; individual routes can export `metadata` to override title/description.
 */
export function buildRootMetadata(): Metadata {
  const desc = SITE_DEFAULT_DESCRIPTION;
  return {
    metadataBase: metadataBaseUrl(),
    title: {
      default: `${SITE_NAME} · Luxury Beauty & Lifestyle`,
      template: `%s · ${SITE_NAME}`,
    },
    description: desc,
    keywords: SITE_KEYWORDS,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: metadataBaseUrl().href,
      siteName: SITE_NAME,
      title: `${SITE_NAME} · Luxury Beauty & Lifestyle`,
      description: desc,
      images: [
        {
          url: SITE_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — luxury beauty & lifestyle`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} · Luxury Beauty & Lifestyle`,
      description: desc,
      images: [SITE_OG_IMAGE],
    },
    icons: {
      icon: [{ url: SITE_FAVICON_IMAGE, type: "image/png", sizes: "any" }],
      shortcut: SITE_FAVICON_IMAGE,
      apple: SITE_FAVICON_IMAGE,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical: metadataBaseUrl().href.replace(/\/$/, "") || "/",
    },
  };
}

/** Per-route metadata with optional canonical path (e.g. `/shop`). */
export function pageMetadata(
  title: string,
  options?: { description?: string; path?: string; keywords?: string[] }
): Metadata {
  const description = options?.description ?? SITE_DEFAULT_DESCRIPTION;
  const base = metadataBaseUrl().href.replace(/\/$/, "");
  const path = options?.path ?? "";
  const url = `${base}${path.startsWith("/") ? path : path ? `/${path}` : ""}`;
  const kws = options?.keywords ?? SITE_KEYWORDS;

  return {
    title,
    description,
    keywords: kws,
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [{ url: SITE_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [SITE_OG_IMAGE],
    },
    alternates: path ? { canonical: url } : undefined,
  };
}
