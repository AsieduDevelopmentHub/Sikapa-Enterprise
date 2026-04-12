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
    className:
      "h-[2.625rem] w-auto max-w-[min(168px,44vw)] object-contain sm:h-[2.25rem] sm:max-w-[min(178px,46vw)]",
  },
  primary: {
    width: 512,
    height: 640,
    className: "h-28 w-auto max-w-[200px] object-contain",
  },
};

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
