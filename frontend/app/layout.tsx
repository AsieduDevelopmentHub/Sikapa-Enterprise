import "@/lib/fontawesome-config";
import "./globals.css";
import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import { cookieBannerNeeded } from "@/lib/cookie-consent-server";
import { buildRootMetadata } from "@/lib/seo";

/** Luxury editorial serif — closer to mockup than generic Playfair. */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = buildRootMetadata();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const showCookieConsent = cookieBannerNeeded();
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <Providers showCookieConsent={showCookieConsent}>{children}</Providers>
      </body>
    </html>
  );
}
