import logging
import uuid
from collections.abc import AsyncIterator, Iterable

from features.ai_advisor.schemas import AdvisorInsightsResponse, ChatMessageIn
from features.ai_advisor.tools import build_advisor_executor, build_advisor_tools
from features.vendors.models import VendorProfile
from infra.cache.base import CacheRepository
from infra.llm import AgentRole, Message, Role, get_llm_client, run_agent, stream_agent
from settings.config.app_config import settings
from shared.i18n import DEFAULT_LANGUAGE, translate

logger = logging.getLogger("ai.advisor")

_INSIGHTS_TTL_SECONDS = 86_400
_INSIGHTS_COOLDOWN_SECONDS = 300


def build_system_prompt(language: str = DEFAULT_LANGUAGE) -> str:
    return (
        f"{translate('prompts.advisor.system', language)}\n\n"
        f"{translate('prompts.common.languageInstruction', language)}"
    )


def _to_messages(items: Iterable[ChatMessageIn]) -> list[Message]:
    return [Message(role=Role(item.role), content=item.content) for item in items]


async def stream_chat(
    vendor: VendorProfile,
    history: Iterable[ChatMessageIn],
    restaurant_id: uuid.UUID | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> AsyncIterator[str]:
    client = await get_llm_client(AgentRole.ADVISOR)
    try:
        execute = build_advisor_executor(vendor, restaurant_id, language)
        async for chunk in stream_agent(
            client,
            system=build_system_prompt(language),
            messages=_to_messages(history),
            tools=build_advisor_tools(language),
            execute=execute,
            max_steps=settings.llm.max_agent_steps,
            max_tokens=settings.llm.max_session_tokens,
            language=language,
        ):
            yield chunk
    except Exception:
        logger.exception("advisor chat stream failed")
        yield translate("prompts.advisor.streamError", language)


async def generate_insights(vendor: VendorProfile, language: str = DEFAULT_LANGUAGE) -> str:
    client = await get_llm_client(AgentRole.ADVISOR)
    try:
        execute = build_advisor_executor(vendor, language=language)
        text, _ = await run_agent(
            client,
            system=build_system_prompt(language),
            messages=[
                Message(
                    role=Role.USER, content=translate("prompts.advisor.insights", language)
                )
            ],
            tools=build_advisor_tools(language),
            execute=execute,
            max_steps=settings.llm.max_agent_steps,
            max_tokens=settings.llm.max_session_tokens,
            language=language,
        )
        return text
    except Exception:
        logger.exception("advisor insights generation failed")
        raise


def _insights_cache_key(vendor_id: uuid.UUID, language: str) -> str:
    return f"ai:advisor:insights:{vendor_id}:{language}"


def _insights_cooldown_key(vendor_id: uuid.UUID, language: str) -> str:
    return f"ai:advisor:insights:cooldown:{vendor_id}:{language}"


async def get_insights(
    vendor: VendorProfile,
    cache: CacheRepository,
    *,
    refresh: bool,
    language: str = DEFAULT_LANGUAGE,
) -> AdvisorInsightsResponse:
    key = _insights_cache_key(vendor.id, language)
    serve_cached = not refresh or bool(
        await cache.get(_insights_cooldown_key(vendor.id, language))
    )
    if serve_cached:
        cached = await cache.get(key)
        if cached:
            return AdvisorInsightsResponse(insights=cached, cached=True)

    text = await generate_insights(vendor, language)
    await cache.set(key, text, ttl=_INSIGHTS_TTL_SECONDS)
    await cache.set(
        _insights_cooldown_key(vendor.id, language), "1", ttl=_INSIGHTS_COOLDOWN_SECONDS
    )
    return AdvisorInsightsResponse(insights=text, cached=False)
