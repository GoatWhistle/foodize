from core.config import settings
from fastapi import APIRouter
from features.users.router import router as user_router

router = APIRouter(
    prefix=settings.api.v1.prefix,
)

router.include_router(user_router)
