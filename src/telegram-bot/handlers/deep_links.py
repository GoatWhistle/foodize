import re
from dataclasses import dataclass
from enum import Enum, auto

_DISPLAY_ID_RE = re.compile(r"^[a-zA-Z0-9-]{1,64}$")
_RESTAURANT_PREFIX = "restaurant_"
_ORDER_PREFIX = "order_"
_MAX_ORDER_DISPLAY_ID_LENGTH = 10


class DeepLinkKind(Enum):
    NONE = auto()
    RESTAURANT = auto()
    ORDER = auto()
    INVALID = auto()


@dataclass(frozen=True)
class DeepLink:
    kind: DeepLinkKind
    value: str = ""


def parse_start_arg(text: str | None) -> str:
    if not text:
        return ""
    parts = text.split(maxsplit=1)
    return parts[1].strip() if len(parts) > 1 else ""


def parse_deep_link(arg: str) -> DeepLink:
    if not arg:
        return DeepLink(DeepLinkKind.NONE)

    if arg.startswith(_RESTAURANT_PREFIX):
        display_id = arg[len(_RESTAURANT_PREFIX) :].strip()
        if _DISPLAY_ID_RE.match(display_id):
            return DeepLink(DeepLinkKind.RESTAURANT, display_id)
        return DeepLink(DeepLinkKind.INVALID)

    if arg.startswith(_ORDER_PREFIX):
        order_display_id = arg[len(_ORDER_PREFIX) :].strip()
        if order_display_id.isdigit() and len(order_display_id) <= _MAX_ORDER_DISPLAY_ID_LENGTH:
            return DeepLink(DeepLinkKind.ORDER, order_display_id)
        return DeepLink(DeepLinkKind.INVALID)

    return DeepLink(DeepLinkKind.NONE)
