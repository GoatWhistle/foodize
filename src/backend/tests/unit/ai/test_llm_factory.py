import pytest

from infra.llm import factory
from infra.llm.factory import AgentRole, _resolve_model, get_llm_client
from settings.config.runtime.llm import LLMConfig, LLMProvider

_CFG = LLMConfig(
    anthropic_order_model="order-model",
    anthropic_advisor_model="advisor-model",
    openai_model="openai-model",
    ollama_model="ollama-model",
    gigachat_model="gigachat-model",
)


@pytest.mark.parametrize(
    ("role", "provider", "expected"),
    [
        (AgentRole.ORDER, LLMProvider.ANTHROPIC, "order-model"),
        (AgentRole.ADVISOR, LLMProvider.ANTHROPIC, "advisor-model"),
        (AgentRole.ORDER, LLMProvider.OPENAI, "openai-model"),
        (AgentRole.ADVISOR, LLMProvider.OLLAMA, "ollama-model"),
        (AgentRole.ORDER, LLMProvider.GIGACHAT, "gigachat-model"),
    ],
)
def test_resolve_model_maps_role_and_provider(
    role: AgentRole, provider: LLMProvider, expected: str
) -> None:
    assert _resolve_model(role, provider, _CFG) == expected


def test_resolve_model_rejects_unknown_provider() -> None:
    with pytest.raises(ValueError, match="Unsupported LLM provider"):
        _resolve_model(AgentRole.ORDER, "telepathy", _CFG)  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_get_llm_client_is_cached_per_role_and_provider() -> None:
    factory._clients.clear()

    first = await get_llm_client(AgentRole.ORDER, provider=LLMProvider.OLLAMA)
    second = await get_llm_client(AgentRole.ORDER, provider=LLMProvider.OLLAMA)

    assert first is second


def test_gigachat_routes_through_openai_compatible_client() -> None:
    from infra.llm.openai_compatible import OpenAICompatibleClient

    cfg = LLMConfig(gigachat_model="gigachat-model", gigachat_api_key="giga-key")

    client = factory._build(LLMProvider.GIGACHAT, "gigachat-model", cfg)

    assert isinstance(client, OpenAICompatibleClient)


def test_build_requires_gigachat_key() -> None:
    cfg = LLMConfig(gigachat_api_key="")

    with pytest.raises(ValueError, match="GIGACHAT_API_KEY"):
        factory._build(LLMProvider.GIGACHAT, "gigachat-model", cfg)


def test_build_requires_openai_key() -> None:
    cfg = LLMConfig(openai_api_key="")

    with pytest.raises(ValueError, match="OPENAI_API_KEY"):
        factory._build(LLMProvider.OPENAI, "openai-model", cfg)


def test_build_requires_anthropic_key_only_for_anthropic() -> None:
    cfg = LLMConfig(anthropic_api_key="")

    with pytest.raises(ValueError, match="ANTHROPIC_API_KEY"):
        factory._build(LLMProvider.ANTHROPIC, "some-model", cfg)


@pytest.mark.asyncio
async def test_non_anthropic_provider_builds_without_anthropic_key() -> None:
    factory._clients.clear()
    from infra.llm.openai_compatible import OpenAICompatibleClient

    client = await get_llm_client(AgentRole.ORDER, provider=LLMProvider.OLLAMA)

    assert isinstance(client, OpenAICompatibleClient)
