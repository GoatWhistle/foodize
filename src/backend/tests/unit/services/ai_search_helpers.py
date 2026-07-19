import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock


def candidate(name: str, description: str | None = None) -> dict[str, Any]:
    return {
        "menu_item_id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "price": 250,
        "category": "shaurma",
        "restaurant_id": str(uuid.uuid4()),
        "restaurant_name": "R",
        "restaurant_address": "A",
    }


def ranked(item: dict[str, Any], distance: float) -> dict[str, Any]:
    return {**item, "_distance": distance}


def mock_embedding_client(embeddings: list[list[float]] | None = None) -> AsyncMock:
    client = AsyncMock()
    client.model = "model-x"
    client.embed = AsyncMock(return_value=embeddings or [[0.1, 0.2]])
    return client


def apply_llm_settings(mock_settings: MagicMock, dim: int = 2) -> None:
    mock_settings.llm.embeddings_enabled = True
    mock_settings.llm.embedding_candidate_limit = 50
    mock_settings.llm.embedding_dim = dim
