from fastapi import APIRouter

from features.telegram.api.bot import router as bot_router
from features.telegram.api.webapp import router as webapp_router

router = APIRouter()
router.include_router(webapp_router)
router.include_router(bot_router)
