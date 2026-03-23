from core.config import settings
from fastapi import APIRouter

from .v1 import router as api_v1_router

router = APIRouter(
    prefix=settings.api.prefix,
)
router.include_router(api_v1_router)
