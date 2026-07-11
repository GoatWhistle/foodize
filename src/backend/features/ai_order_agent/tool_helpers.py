import hashlib
import json
import re
import uuid

from features.cart.schemas import CartItemIn, CartResponse, CartSelectedOption
from features.orders.exceptions import (
    MenuItemRestaurantMismatchException,
    MenuItemsNotFoundException,
    MenuItemUnavailableException,
)
from features.restaurants.exceptions import RestaurantClosedException, RestaurantNotFoundException
from shared.exceptions import AppException

PLACE_ORDER_ERRORS: dict[type[AppException], str] = {
    RestaurantClosedException: "restaurant_closed",
    RestaurantNotFoundException: "restaurant_not_found",
    MenuItemsNotFoundException: "menu_items_not_found",
    MenuItemRestaurantMismatchException: "menu_item_restaurant_mismatch",
    MenuItemUnavailableException: "item_unavailable",
}

PROMO_RE = re.compile(r"^[A-Za-z0-9_\-]{1,64}$")

CONFIRM_TTL_SECONDS = 1800


def order_confirm_key(identifier: str) -> str:
    return f"ai:order:confirm:{identifier}"


_ITEM_MARKER_RE = re.compile(r"<<<\s*/?\s*(?:END_)?ITEM\s*>>>", re.IGNORECASE)


def _strip_item_markers(text: str) -> str:
    return _ITEM_MARKER_RE.sub("", text)


def _dumps(payload: object) -> str:
    return json.dumps(payload, ensure_ascii=False, default=str)


def _parse_uuid(value: object) -> uuid.UUID | None:
    if not value:
        return None
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError):
        return None


def _existing_items(cart: CartResponse) -> list[CartItemIn]:
    items: list[CartItemIn] = []
    for it in cart.items:
        items.append(
            CartItemIn(
                menu_item_id=it.menuItem.id,
                name=it.menuItem.name,
                price=it.menuItem.price,
                image_url=it.menuItem.image_url,
                quantity=it.quantity,
                selected_option_ids=list(it.selected_option_ids),
                selected_options=[
                    CartSelectedOption(
                        option_id=o.option_id, name=o.name, price_delta=o.price_delta
                    )
                    for o in it.selected_options
                ],
            )
        )
    return items


def _parse_confirm(stored: str | None) -> tuple[int | None, str | None, str | None]:
    if not stored or ":" not in stored:
        return None, None, None
    parts = stored.split(":", 2)
    turn_part, token = parts[0], parts[1]
    cart_hash = parts[2] if len(parts) > 2 else None
    if not token:
        return None, None, None
    try:
        return int(turn_part), token, cart_hash
    except ValueError:
        return None, token, cart_hash


def cart_state_hash(cart: CartResponse) -> str:
    parts = [str(cart.restaurant_id) if cart.restaurant_id else ""]
    for it in sorted(cart.items, key=lambda x: str(x.menuItem.id)):
        option_ids = ",".join(sorted(str(o) for o in it.selected_option_ids))
        parts.append(f"{it.menuItem.id}x{it.quantity}:{option_ids}")
    return hashlib.sha256("|".join(parts).encode()).hexdigest()[:16]


def cart_summary(cart: CartResponse) -> dict:
    items = []
    total = 0
    for it in cart.items:
        options_sum = sum(o.price_delta for o in it.selected_options)
        unit = it.menuItem.price + options_sum
        line_total = unit * it.quantity
        total += line_total
        items.append(
            {
                "menu_item_id": str(it.menuItem.id),
                "name": it.menuItem.name,
                "quantity": it.quantity,
                "unit_price": unit,
                "options": [o.name for o in it.selected_options],
                "line_total": line_total,
            }
        )
    return {
        "restaurant_id": str(cart.restaurant_id) if cart.restaurant_id else None,
        "items": items,
        "total": total,
    }
