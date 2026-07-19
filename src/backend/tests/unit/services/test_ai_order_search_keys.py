from features.ai_order_agent.search import _item_text, _query_cache_key


class TestItemText:
    def test_with_description(self) -> None:
        item = {"name": "Бургер", "description": "Сочный"}
        assert _item_text(item) == "Бургер. Сочный"

    def test_without_description(self) -> None:
        item = {"name": "Бургер", "description": None}
        assert _item_text(item) == "Бургер."

    def test_missing_description(self) -> None:
        item = {"name": "Пицца"}
        assert _item_text(item) == "Пицца."


class TestQueryCacheKey:
    def test_starts_with_prefix(self) -> None:
        assert _query_cache_key("model", "text").startswith("emb:query:")

    def test_same_inputs_same_key(self) -> None:
        assert _query_cache_key("model", "text") == _query_cache_key("model", "text")

    def test_different_inputs_different_keys(self) -> None:
        assert _query_cache_key("model", "text1") != _query_cache_key("model", "text2")
