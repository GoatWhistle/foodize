from typing import TYPE_CHECKING

from features.ai_order_agent.search import build_item_text, query_cache_key

if TYPE_CHECKING:
    from features.ai_order_agent.schemas_search import MenuItemText


class TestItemText:
    def test_with_description(self) -> None:
        item: MenuItemText = {"name": "Бургер", "description": "Сочный"}
        assert build_item_text(item) == "Бургер. Сочный"

    def test_without_description(self) -> None:
        item: MenuItemText = {"name": "Бургер", "description": None}
        assert build_item_text(item) == "Бургер."

    def test_missing_description(self) -> None:
        item: MenuItemText = {"name": "Пицца", "description": None}
        assert build_item_text(item) == "Пицца."


class TestQueryCacheKey:
    def test_starts_with_prefix(self) -> None:
        assert query_cache_key("model", "text").startswith("emb:query:")

    def test_same_inputs_same_key(self) -> None:
        assert query_cache_key("model", "text") == query_cache_key("model", "text")

    def test_different_inputs_different_keys(self) -> None:
        assert query_cache_key("model", "text1") != query_cache_key("model", "text2")
