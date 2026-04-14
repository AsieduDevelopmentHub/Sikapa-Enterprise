"""
Admin API routes - main router
"""
from fastapi import APIRouter

from app.api.v1.admin.analytics import router as analytics_router
from app.api.v1.admin.users import router as users_router
from app.api.v1.admin.products import router as products_router
from app.api.v1.admin.orders import router as orders_router
from app.api.v1.admin.categories import router as categories_router
from app.api.v1.admin.payments import router as payments_router
from app.api.v1.admin.reviews import router as reviews_router

router = APIRouter(prefix="/admin")

# All admin endpoints grouped under single "Admin" tag for cleaner Swagger UI
router.include_router(analytics_router, prefix="/analytics")
router.include_router(users_router, prefix="/users")
router.include_router(products_router, prefix="/products")
router.include_router(categories_router, prefix="/categories")
router.include_router(orders_router, prefix="/orders")
router.include_router(payments_router, prefix="/payments")
router.include_router(reviews_router, prefix="/reviews")
