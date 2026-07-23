import logging
from collections.abc import AsyncIterator, Iterable

from features.ai_order_agent.schemas import OrderChatMessageIn
from features.ai_order_agent.tools import build_order_executor, build_order_tools
from features.cart.service import CartService
from features.users.models import User
from infra.cache.redis import get_redis_cache
from infra.llm import AgentRole, Message, Role, get_llm_client, stream_agent
from settings.config.app_config import settings
from settings.config.runtime.llm import LLMProvider
from shared.i18n import DEFAULT_LANGUAGE, translate

logger = logging.getLogger("ai.order")


def build_system_prompt(language: str = DEFAULT_LANGUAGE) -> str:
    return (
        f"{translate('prompts.order.system', language)}\n\n"
        f"{translate('prompts.common.languageInstruction', language)}"
    )


def to_messages(items: Iterable[OrderChatMessageIn]) -> list[Message]:
    return [Message(role=Role(item.role), content=item.content) for item in items]


def _user_turns(history: list[Message]) -> int:
    return sum(1 for message in history if message.role == Role.USER)


async def stream_chat(
    user: User,
    history: Iterable[OrderChatMessageIn],
    language: str = DEFAULT_LANGUAGE,
) -> AsyncIterator[str]:
    if settings.llm.provider == LLMProvider.ANTHROPIC and not settings.llm.anthropic_api_key:
        yield translate("prompts.order.unavailable", language)
        return

    client = await get_llm_client(AgentRole.ORDER)
    cache = get_redis_cache()
    cart_service = CartService(cache)
    messages = to_messages(history)
    try:
        execute = build_order_executor(
            user,
            cart_service,
            cache,
            user_turn=_user_turns(messages),
            language=language,
        )
        async for chunk in stream_agent(
            client,
            system=build_system_prompt(language),
            messages=messages,
            tools=build_order_tools(language),
            execute=execute,
            max_steps=settings.llm.max_agent_steps,
            max_tokens=settings.llm.max_session_tokens,
            language=language,
        ):
            yield chunk
    except Exception:
        logger.exception("order chat stream failed")
        yield translate("prompts.order.streamError", language)
