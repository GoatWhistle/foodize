from core.config import settings
from fastapi import APIRouter
from features.users.router import router as user_router
from .v1 import router as api_v1_router

router = APIRouter(
    prefix=settings.api.prefix,
)
router.include_router(api_v1_router)
router.include_router(user_router)

