from core.config import settings
from fastapi import APIRouter
from features.users.router import router as user_router
from features.auth.router import router as auth_router

router = APIRouter(
    prefix=settings.api.v1.prefix,
)

router.include_router(user_router)
router.include_router(auth_router)
