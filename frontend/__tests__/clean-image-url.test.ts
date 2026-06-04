import { describe, expect, it } from "vitest";

import {
  cleanImageUrl,
  normalizeStorefrontImageUrl,
  STOREFRONT_IMAGE_PLACEHOLDER,
} from "@/lib/clean-image-url";

describe("normalizeStorefrontImageUrl", () => {
  it("strips trailing question marks and hashes", () => {
    const url =
      "https://pqfowptaguuxhujvclvr.supabase.co/storage/v1/object/public/product-images/products/a.jpg?";
    expect(normalizeStorefrontImageUrl(url)).toBe(url.slice(0, -1));
  });

  it("collapses duplicate slashes in the path", () => {
    expect(
      normalizeStorefrontImageUrl(
        "https://example.com/storage//v1//object/public/products/x.jpg"
      )
    ).toBe("https://example.com/storage/v1/object/public/products/x.jpg");
  });
});

describe("cleanImageUrl", () => {
  it("returns placeholder for empty input", () => {
    expect(cleanImageUrl(null)).toBe(STOREFRONT_IMAGE_PLACEHOLDER);
  });
});
