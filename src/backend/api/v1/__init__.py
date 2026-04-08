from fastapi import APIRouter

from features.auth.api import router as auth_router
from features.users.api import router as user_router
from settings.config.app_config import settings
from features.vendors.api import router as vendor_router
router = APIRouter(
    prefix=settings.api.v1.prefix,
)

router.include_router(user_router)
router.include_router(auth_router)
router.include_router(vendor_router)