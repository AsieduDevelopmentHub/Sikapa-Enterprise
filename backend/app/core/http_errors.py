from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError


def _field_label(loc: tuple[Any, ...]) -> str:
    if not loc:
        return "This field"
    tail = loc[-1]
    if isinstance(tail, int):
        return "An item in the list"
    mapping = {
        "code": "The code",
        "email": "Email",
        "password": "Password",
        "title": "Title",
        "content": "Review text",
        "shipping_address": "Shipping address",
        "body": "Request",
    }
    return mapping.get(str(tail), str(tail).replace("_", " ").title())


def friendly_validation_message(errors: list[dict[str, Any]]) -> str:
    if not errors:
        return "Please check your input and try again."
    parts: list[str] = []
    for err in errors[:4]:
        loc = err.get("loc") or ()
        label = _field_label(tuple(loc))
        typ = str(err.get("type") or "")
        ctx = err.get("ctx") or {}
        if typ == "string_too_short":
            m = ctx.get("min_length")
            parts.append(f"{label} must be at least {m} character{'s' if (m or 0) != 1 else ''}.")
        elif typ == "string_too_long":
            m = ctx.get("max_length")
            parts.append(f"{label} is too long (maximum {m} characters).")
        elif typ in ("greater_than", "greater_than_equal"):
            parts.append(f"{label} is too small.")
        elif typ in ("less_than", "less_than_equal"):
            parts.append(f"{label} is too large.")
        elif typ == "value_error.missing":
            parts.append(f"{label} is required.")
        elif typ == "int_parsing":
            parts.append(f"{label} must be a whole number.")
        else:
            parts.append(f"{label} is not valid.")
    return " ".join(parts)


async def request_validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    msg = friendly_validation_message(exc.errors())
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": msg})


def friendly_integrity_message(exc: IntegrityError) -> str:
    """Map database constraint failures to actionable client messages."""
    orig = getattr(exc, "orig", None)
    text = str(orig or exc).lower()

    if "reviewmedia" in text or ("review_id" in text and "review" in text):
        return "This review still has attachments. Try again or remove media from the review first."

    if "orderitem" in text or "order_item" in text:
        return "This product appears on customer orders and cannot be deleted."

    if "cartitem" in text:
        return "This product is still in customer carts. Clear carts or wait until items are removed."

    if "wishlistitem" in text or "wishlist" in text:
        return "This product is on customer wishlists and cannot be deleted yet."

    if "productvariant" in text or "product_variant" in text:
        return "Remove or reassign product variants before deleting this product."

    if "productimage" in text:
        return "Remove product images before deleting this product."

    if "inventoryadjustment" in text or "inventory_adjustment" in text:
        return "This product has inventory history. Deactivate it instead of deleting, or contact support."

    if "review" in text and "product_id" in text:
        return "Delete customer reviews for this product before removing it."

    if "coupon" in text and ("foreign key" in text or "violates" in text):
        return "This coupon is still referenced elsewhere and cannot be deleted."

    if "category" in text and ("foreign key" in text or "violates" in text):
        return "This category is still in use and cannot be deleted."

    if "unique" in text or "duplicate key" in text:
        return "A record with this value already exists."

    if "foreign key" in text or "violates foreign key" in text:
        if "product" in text:
            return "This item is still linked to one or more products. Remove those links first."
        return "This action could not be completed because related records still exist."

    return "This action could not be completed because related records still exist."


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": friendly_integrity_message(exc)},
    )


async def structured_http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """Normalize structured ErrorResponse bodies to `{detail, error_code}` for clients."""
    detail = exc.detail
    headers = dict(getattr(exc, "headers", None) or {})

    if isinstance(detail, dict):
        err = detail.get("error")
        if isinstance(err, dict) and err.get("message"):
            body: dict[str, str] = {"detail": str(err["message"])}
            if err.get("code"):
                body["error_code"] = str(err["code"])
            return JSONResponse(status_code=exc.status_code, content=body, headers=headers)
        if isinstance(detail.get("detail"), str):
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": detail["detail"]},
                headers=headers,
            )

    if isinstance(detail, str):
        return JSONResponse(status_code=exc.status_code, content={"detail": detail}, headers=headers)

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(detail)},
        headers=headers,
    )
