from fastapi import APIRouter

from features.auth.api import router as auth_router
from features.menu.api import router as menu_router
from features.orders.router import router as order_router
from features.restaurants.api import router as restaurant_router
from features.staff.api import router as staff_router
from features.users.api import router as user_router
from features.vendors.api import router as vendor_router
from settings.config.app_config import settings

router = APIRouter(
    prefix=settings.api.v1.prefix,
)


router.include_router(user_router)
router.include_router(auth_router)
router.include_router(staff_router)
router.include_router(vendor_router)
router.include_router(restaurant_router)
router.include_router(menu_router)
router.include_router(order_router)
