import { apiFetchJsonAuth } from "@/lib/api/client";
import { V1 } from "@/lib/api/v1-paths";

export type CouponValidateResult = {
  code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  subtotal: number;
  subtotal_after_discount: number;
};

export async function couponsValidate(
  accessToken: string,
  code: string,
): Promise<CouponValidateResult> {
  return apiFetchJsonAuth<CouponValidateResult>(accessToken, V1.coupons.validate, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
}
