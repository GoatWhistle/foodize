from collections.abc import Mapping

type JsonValue = str | int | float | bool | None | list["JsonValue"] | dict[str, "JsonValue"]
type EventPayload = Mapping[str, JsonValue]


def event_str(event: EventPayload, key: str, default: str = "") -> str:
    value = event.get(key)
    if isinstance(value, str):
        return value
    if isinstance(value, int | float) and not isinstance(value, bool):
        return str(value)
    return default


def event_int(event: EventPayload, key: str, default: int = 0) -> int:
    value = event.get(key)
    if isinstance(value, bool):
        return default
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return default


def event_optional_str(event: EventPayload, key: str) -> str | None:
    value = event.get(key)
    if isinstance(value, str) and value:
        return value
    if isinstance(value, int) and not isinstance(value, bool):
        return str(value)
    return None
