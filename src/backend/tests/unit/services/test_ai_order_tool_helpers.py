import json
import uuid

from features.ai_order_agent.tool_helpers import dumps, parse_uuid


class TestDumps:
    def test_cyrillic_preserved(self) -> None:
        result = dumps({"msg": "привет"})
        assert "привет" in result

    def test_returns_json_string(self) -> None:
        result = dumps({"a": 1})
        data = json.loads(result)
        assert data["a"] == 1


class TestParseUuid:
    def test_valid(self) -> None:
        rid = uuid.uuid4()
        assert parse_uuid(str(rid)) == rid

    def test_none(self) -> None:
        assert parse_uuid(None) is None

    def test_empty_string(self) -> None:
        assert parse_uuid("") is None

    def test_invalid(self) -> None:
        assert parse_uuid("not-a-uuid") is None
