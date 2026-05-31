"""Coupon API schemas for shoppers."""
from pydantic import BaseModel, Field, field_validator

from app.api.v1.coupons.service import normalize_coupon_code


class CouponValidateRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=64)

    @field_validator("code", mode="before")
    @classmethod
    def _normalize(cls, v: str) -> str:
        return normalize_coupon_code(str(v))


class CouponValidateResponse(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    discount_amount: float
    subtotal: float
    subtotal_after_discount: float
