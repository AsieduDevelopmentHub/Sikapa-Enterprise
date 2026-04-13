import Image from "next/image";
import { LOGOS } from "@/lib/assets";

export type SikapaLogoAsset = "brandmark" | "navigation" | "primary";

type Props = {
  /** Which file under `public/assets/logos/`. */
  asset?: SikapaLogoAsset;
  className?: string;
  /** Merged onto the inner `Image` (e.g. splash size overrides). */
  imageClassName?: string;
  priority?: boolean;
  /** Accessible label; empty alt for decorative use. */
  alt?: string;
};

const DIMENSIONS: Record<
  SikapaLogoAsset,
  { width: number; height: number; className: string }
> = {
  brandmark: {
    width: 512,
    height: 512,
    className: "h-[7.5rem] w-[7.5rem] object-contain sm:h-36 sm:w-36",
  },
  navigation: {
    width: 640,
    height: 240,
    /** Applied to each `fill` image inside the fixed frame below. */
    className: "object-contain object-center",
  },
  primary: {
    width: 512,
    height: 640,
    className: "h-28 w-auto max-w-[200px] object-contain",
  },
};

/** Fixed slot for nav logos (height + width cap match original bar layout). */
const NAV_LOGO_FRAME =
  "relative h-[2.625rem] w-[min(168px,44vw)] shrink-0 overflow-visible sm:h-[2.25rem] sm:w-[min(178px,46vw)]";

/** Intrinsic size of `public/assets/logos/navigation.png` — update when the file changes. */
const NAV_LIGHT_PX = { w: 877, h: 285 } as const;
/** Intrinsic size of `public/assets/logos/navigation_darkmode.png` — update when the file changes. */
const NAV_DARK_PX = { w: 1536, h: 924 } as const;

/**
 * Header slot is height-limited; mismatched aspects → different drawn widths under `object-contain`.
 * Scale dark so its width matches light: `(lightW/lightH) / (darkW/darkH)`.
 */
const NAV_DARK_MATCH_LIGHT_SCALE =
  (NAV_LIGHT_PX.w / NAV_LIGHT_PX.h) / (NAV_DARK_PX.w / NAV_DARK_PX.h);

/**
 * Renders logos from `public/assets/logos/`.
 * - **navigation** — horizontal “SIKAPA ENTERPRISE” for the app bar (see mockups).
 * - **brandmark** — gold emblem; splash uses it on a cream panel over crimson.
 * - **primary** — stacked lockup when you need the full vertical mark.
 */
export function SikapaLogo({
  asset = "navigation",
  className = "",
  imageClassName = "",
  priority = false,
  alt = "Sikapa Enterprise",
}: Props) {
  const dim = DIMENSIONS[asset];
  const imgClass = [dim.className, imageClassName].filter(Boolean).join(" ");

  if (asset === "navigation") {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>
        <span className={NAV_LOGO_FRAME}>
          <Image
            src={LOGOS.navigation}
            alt={alt}
            fill
            className={`${imgClass} dark:hidden`.trim()}
            sizes="(max-width: 640px) 168px, 178px"
            priority={priority}
          />
          <Image
            src={LOGOS.navigationDark}
            alt={alt}
            fill
            className={`${imgClass} hidden dark:block`.trim()}
            sizes="(max-width: 640px) 168px, 178px"
            priority={priority}
            style={{
              transform: `scale(${NAV_DARK_MATCH_LIGHT_SCALE})`,
              transformOrigin: "center center",
            }}
          />
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>
      <Image
        src={LOGOS[asset]}
        alt={alt}
        width={dim.width}
        height={dim.height}
        className={imgClass}
        priority={priority}
      />
    </span>
  );
}
