from fastapi import APIRouter

from features.admin.api.users import router as users_router
from features.admin.api.restaurants import router as restaurants_router
from features.admin.api.vendors import router as vendors_router
from features.admin.api.reviews import router as reviews_router
from features.admin.api.stats import router as stats_router
from features.admin.api.export import router as export_router

router = APIRouter(prefix="/admin", tags=["Admin"])
router.include_router(users_router)
router.include_router(restaurants_router)
router.include_router(vendors_router)
router.include_router(reviews_router)
router.include_router(stats_router)
router.include_router(export_router)
