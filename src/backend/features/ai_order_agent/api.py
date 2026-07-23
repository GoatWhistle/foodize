from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from features.ai_order_agent import service
from features.ai_order_agent.schemas import OrderChatRequest
from features.users.models import User
from middlewares.limiter import limiter, user_or_ip_key
from settings.config.app_config import settings
from shared.dependencies import get_language, require_permission
from shared.enums.permissions import Permission

router = APIRouter(prefix=settings.api.v1.ai_order.prefix, tags=[settings.api.v1.ai_order.tag])


def _user_rate_limit() -> str:
    return f"{settings.llm.user_requests_per_minute}/minute"


@router.post("/chat")
@limiter.limit(_user_rate_limit, key_func=user_or_ip_key)
async def order_chat(
    request: Request,
    body: OrderChatRequest,
    current_user: User = Depends(require_permission(Permission.ORDERS_CREATE)),
    language: str = Depends(get_language),
) -> StreamingResponse:
    return StreamingResponse(
        service.stream_chat(current_user, body.messages, language),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
