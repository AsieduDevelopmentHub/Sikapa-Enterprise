"""
Admin API routes - main router
"""
from fastapi import APIRouter

from app.api.v1.admin.analytics import router as analytics_router
from app.api.v1.admin.users import router as users_router
from app.api.v1.admin.products import router as products_router
from app.api.v1.admin.orders import router as orders_router
from app.api.v1.admin.categories import router as categories_router

router = APIRouter(prefix="/admin")

# All admin endpoints grouped under single "Admin" tag for cleaner Swagger UI
router.include_router(analytics_router, prefix="/analytics")
router.include_router(users_router, prefix="/users")
router.include_router(products_router, prefix="/products")
router.include_router(categories_router, prefix="/categories")
router.include_router(orders_router, prefix="/orders")
