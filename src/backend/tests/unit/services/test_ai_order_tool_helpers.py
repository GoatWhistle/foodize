import json
import uuid

from features.ai_order_agent.tool_helpers import _dumps, _parse_uuid


class TestDumps:
    def test_cyrillic_preserved(self) -> None:
        result = _dumps({"msg": "привет"})
        assert "привет" in result

    def test_returns_json_string(self) -> None:
        result = _dumps({"a": 1})
        data = json.loads(result)
        assert data["a"] == 1


class TestParseUuid:
    def test_valid(self) -> None:
        rid = uuid.uuid4()
        assert _parse_uuid(str(rid)) == rid

    def test_none(self) -> None:
        assert _parse_uuid(None) is None

    def test_empty_string(self) -> None:
        assert _parse_uuid("") is None

    def test_invalid(self) -> None:
        assert _parse_uuid("not-a-uuid") is None
