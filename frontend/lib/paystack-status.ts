/** Backend verify/initialize responses use `paid`; Paystack payloads use `success`. */
export function isPaystackPaymentConfirmed(
  status: string | null | undefined,
  alreadyConfirmed?: boolean,
): boolean {
  if (alreadyConfirmed) return true;
  const s = (status ?? "").trim().toLowerCase();
  return s === "paid" || s === "success";
}
