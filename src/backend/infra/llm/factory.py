from __future__ import annotations

import asyncio
import hashlib
from enum import Enum
from typing import TYPE_CHECKING

from infra.llm.anthropic_client import AnthropicClient
from infra.llm.exceptions import (
    MissingAnthropicAPIKeyError,
    MissingGigaChatAPIKeyError,
    MissingOpenAIAPIKeyError,
    UnsupportedLLMProviderError,
)
from infra.llm.openai_compatible import OpenAICompatibleClient
from settings.config.app_config import settings
from settings.config.runtime.llm import LLMConfig, LLMProvider

if TYPE_CHECKING:
    from infra.llm.base import LLMClient


class AgentRole(str, Enum):
    ORDER = "order"
    ADVISOR = "advisor"


_clients: dict[tuple[str, str, str], LLMClient] = {}
_clients_lock: asyncio.Lock | None = None


def _get_lock() -> asyncio.Lock:
    global _clients_lock
    if _clients_lock is None:
        _clients_lock = asyncio.Lock()
    return _clients_lock


def _config_fingerprint(provider: LLMProvider, cfg: LLMConfig) -> str:
    api_key = {
        LLMProvider.ANTHROPIC: cfg.anthropic_api_key,
        LLMProvider.OPENAI: cfg.openai_api_key,
        LLMProvider.OLLAMA: "",
        LLMProvider.GIGACHAT: cfg.gigachat_api_key,
    }.get(provider, "")
    base_url = {
        LLMProvider.OPENAI: cfg.openai_base_url or "",
        LLMProvider.OLLAMA: cfg.ollama_base_url,
        LLMProvider.GIGACHAT: cfg.gigachat_base_url,
    }.get(provider, "")
    parts = (
        str(cfg.max_output_tokens),
        str(cfg.request_timeout_seconds),
        str(cfg.max_retries),
        api_key,
        base_url,
    )
    return hashlib.sha256("|".join(parts).encode()).hexdigest()[:16]


def resolve_model(role: AgentRole, provider: LLMProvider, cfg: LLMConfig) -> str:
    if provider == LLMProvider.ANTHROPIC:
        return cfg.anthropic_order_model if role == AgentRole.ORDER else cfg.anthropic_advisor_model
    if provider == LLMProvider.OPENAI:
        return cfg.openai_model
    if provider == LLMProvider.OLLAMA:
        return cfg.ollama_model
    if provider == LLMProvider.GIGACHAT:
        return cfg.gigachat_model
    raise UnsupportedLLMProviderError(f"Unsupported LLM provider: {provider}")


def _openai_compatible_credentials(provider: LLMProvider, cfg: LLMConfig) -> tuple[str, str | None]:
    if provider == LLMProvider.OPENAI:
        if not cfg.openai_api_key:
            raise MissingOpenAIAPIKeyError("LLM__OPENAI_API_KEY is not set")
        return cfg.openai_api_key, cfg.openai_base_url
    if provider == LLMProvider.OLLAMA:
        return "ollama", cfg.ollama_base_url
    if provider == LLMProvider.GIGACHAT:
        if not cfg.gigachat_api_key:
            raise MissingGigaChatAPIKeyError("LLM__GIGACHAT_API_KEY is not set")
        return cfg.gigachat_api_key, cfg.gigachat_base_url
    raise UnsupportedLLMProviderError(f"Unsupported LLM provider: {provider}")


def _build(provider: LLMProvider, model: str, cfg: LLMConfig) -> LLMClient:
    if provider == LLMProvider.ANTHROPIC:
        if not cfg.anthropic_api_key:
            raise MissingAnthropicAPIKeyError("LLM__ANTHROPIC_API_KEY is not set")
        return AnthropicClient(
            api_key=cfg.anthropic_api_key,
            model=model,
            max_tokens=cfg.max_output_tokens,
            timeout=cfg.request_timeout_seconds,
            max_retries=cfg.max_retries,
        )
    api_key, base_url = _openai_compatible_credentials(provider, cfg)
    return OpenAICompatibleClient(
        api_key=api_key,
        model=model,
        base_url=base_url,
        max_tokens=cfg.max_output_tokens,
        timeout=cfg.request_timeout_seconds,
        max_retries=cfg.max_retries,
    )


async def get_llm_client(role: AgentRole, *, provider: LLMProvider | None = None) -> LLMClient:
    cfg = settings.llm
    provider = provider or cfg.provider
    model = resolve_model(role, provider, cfg)
    key = (provider.value, model, _config_fingerprint(provider, cfg))
    if key in _clients:
        return _clients[key]
    async with _get_lock():
        if key not in _clients:
            stale = [
                existing_key
                for existing_key in _clients
                if existing_key[0] == key[0]
                and existing_key[1] == key[1]
                and existing_key[2] != key[2]
            ]
            for existing_key in stale:
                await _clients.pop(existing_key).aclose()
            _clients[key] = _build(provider, model, cfg)
        return _clients[key]
