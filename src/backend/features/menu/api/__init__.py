from fastapi import APIRouter

from features.menu.api.menu_items import router as menu_items_router
from features.menu.api.options import router as options_router

router = APIRouter()
router.include_router(options_router)
router.include_router(menu_items_router)
