export const GHANA_REGIONS: { slug: string; label: string; feeGhs: number }[] = [
  { slug: "greater-accra", label: "Greater Accra", feeGhs: 15 },
  { slug: "ashanti", label: "Ashanti", feeGhs: 25 },
  { slug: "western", label: "Western", feeGhs: 28 },
  { slug: "central", label: "Central", feeGhs: 28 },
  { slug: "eastern", label: "Eastern", feeGhs: 28 },
  { slug: "volta", label: "Volta", feeGhs: 30 },
  { slug: "northern", label: "Northern", feeGhs: 40 },
  { slug: "upper-east", label: "Upper East", feeGhs: 45 },
  { slug: "upper-west", label: "Upper West", feeGhs: 45 },
  { slug: "bono", label: "Bono", feeGhs: 32 },
  { slug: "bono-east", label: "Bono East", feeGhs: 32 },
  { slug: "ahafo", label: "Ahafo", feeGhs: 32 },
  { slug: "western-north", label: "Western North", feeGhs: 35 },
  { slug: "oti", label: "Oti", feeGhs: 35 },
  { slug: "north-east", label: "North East", feeGhs: 42 },
  { slug: "savannah", label: "Savannah", feeGhs: 42 },
];

/** Couriers shown when customer chooses home delivery (pickup uses backend default). */
export const DELIVERY_COURIER_OPTIONS = [
  "Station driver",
  "Speedaf",
  "FedEx",
  "Ghana Post",
  "Other courier",
] as const;

export const COURIER_OPTIONS = [
  "Local pickup (store)",
  ...DELIVERY_COURIER_OPTIONS,
] as const;

export type ShippingMethodClient = "pickup" | "delivery";

export function deliveryFeeFor(method: ShippingMethodClient, regionSlug: string | null): number {
  if (method === "pickup") return 0;
  if (!regionSlug) return 0;
  const row = GHANA_REGIONS.find((r) => r.slug === regionSlug);
  return row?.feeGhs ?? 35;
}
