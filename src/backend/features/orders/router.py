from fastapi import APIRouter

from features.orders.api.order import router as order_router

router = APIRouter()
router.include_router(order_router)
