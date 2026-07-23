import uuid

from pydantic import JsonValue

from database import db_helper
from features.admin.crud import translate_category
from features.ai_order_agent import search as search_mod
from features.ai_order_agent.tool_context import OrderToolContext
from features.ai_order_agent.tool_helpers import (
    CONFIRM_TTL_SECONDS,
    cart_state_hash,
    cart_summary,
    dumps,
    existing_items,
    parse_uuid,
    strip_item_markers,
)
from features.cart.schemas import CartItemIn, CartSelectedOption, CartUpdate
from features.menu.crud import get_menu_item_by_id
from features.menu.models import MenuItem
from shared.i18n import translate

_MAX_ITEM_QUANTITY = 99


def _coerce_str(value: object) -> str | None:
    return value if isinstance(value, str) else None


def _coerce_int(value: object) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        try:
            return int(value)
        except ValueError:
            return None
    return None


def _parse_max_price(raw_max_price: object) -> int | None:
    parsed = _coerce_int(raw_max_price)
    if parsed is None:
        return None
    return max(0, parsed)


async def search_menu(ctx: OrderToolContext, args: dict[str, JsonValue]) -> str:
    async with db_helper.session_factory() as session:
        results = await search_mod.semantic_search(
            session,
            ctx.cache,
            query=_coerce_str(args.get("query")),
            max_price=_parse_max_price(args.get("max_price")),
            restaurant_id=parse_uuid(args.get("restaurant_id")),
        )
    for result in results:
        result["category"] = translate_category(result["category"], ctx.language)
        if result.get("name"):
            result["name"] = f"<<<ITEM>>>{strip_item_markers(result['name'])}<<<END_ITEM>>>"
    if not results:
        return dumps(
            {
                "results": [],
                "message": translate("prompts.order.results.noResults", ctx.language),
            }
        )
    return dumps({"results": results})


async def view_cart(ctx: OrderToolContext, _args: dict[str, JsonValue]) -> str:
    cart = await ctx.cart_service.get_cart(ctx.identifier)
    token = uuid.uuid4().hex
    state_hash = cart_state_hash(cart)
    await ctx.cache.set(
        ctx.confirm_key, f"{ctx.user_turn}:{token}:{state_hash}", ttl=CONFIRM_TTL_SECONDS
    )
    return dumps(cart_summary(cart))


def _parse_quantity(raw_quantity: object) -> int:
    if not raw_quantity:
        return 1
    parsed = _coerce_int(raw_quantity)
    if parsed is None:
        return 1
    return max(1, min(parsed, _MAX_ITEM_QUANTITY))


def _collect_valid_options(
    item: MenuItem, raw_option_ids: object
) -> tuple[list[CartSelectedOption], list[uuid.UUID]]:
    available_options = {
        option.id: option
        for group in item.option_groups
        for option in group.options
        if option.is_available
    }
    valid_options: list[CartSelectedOption] = []
    valid_ids: list[uuid.UUID] = []
    for raw in raw_option_ids if isinstance(raw_option_ids, list) else []:
        option_id = parse_uuid(raw)
        if option_id is None:
            continue
        option = available_options.get(option_id)
        if option is not None:
            valid_options.append(
                CartSelectedOption(
                    option_id=option.id, name=option.name, price_delta=option.price_delta
                )
            )
            valid_ids.append(option.id)
    return valid_options, valid_ids


def _merge_or_append_item(
    items: list[CartItemIn],
    item: MenuItem,
    quantity: int,
    valid_ids: list[uuid.UUID],
    valid_options: list[CartSelectedOption],
) -> None:
    option_key = tuple(sorted(str(x) for x in valid_ids))
    for existing in items:
        same_options = tuple(sorted(str(x) for x in existing.selected_option_ids)) == option_key
        if str(existing.menu_item_id) == str(item.id) and same_options:
            existing.quantity = min(_MAX_ITEM_QUANTITY, existing.quantity + quantity)
            return
    items.append(
        CartItemIn(
            menu_item_id=item.id,
            name=item.name,
            price=item.price,
            image_url=item.photo_url,
            quantity=quantity,
            selected_option_ids=valid_ids,
            selected_options=valid_options,
        )
    )


async def add_to_cart(ctx: OrderToolContext, args: dict[str, JsonValue]) -> str:
    item_id = parse_uuid(args.get("menu_item_id"))
    if item_id is None:
        return dumps({"error": "invalid_menu_item_id"})
    async with db_helper.session_factory() as session:
        item = await get_menu_item_by_id(session, item_id)
    if item is None or item.is_deleted or not item.is_available:
        return dumps(
            {
                "error": "item_unavailable",
                "message": translate("prompts.order.results.itemUnavailable", ctx.language),
            }
        )

    quantity = _parse_quantity(args.get("quantity"))
    valid_options, valid_ids = _collect_valid_options(item, args.get("option_ids"))

    cart = await ctx.cart_service.get_cart(ctx.identifier)
    if cart.items and cart.restaurant_id and str(cart.restaurant_id) != str(item.restaurant_id):
        return dumps(
            {
                "error": "cart_has_other_restaurant",
                "message": translate("prompts.order.results.cartHasOtherRestaurant", ctx.language),
            }
        )

    items = existing_items(cart)
    _merge_or_append_item(items, item, quantity, valid_ids, valid_options)
    await ctx.cart_service.update_cart(
        ctx.identifier, CartUpdate(restaurant_id=item.restaurant_id, items=items)
    )
    await ctx.invalidate_confirm()
    return dumps({"ok": True, "cart": await ctx.cart_summary_payload()})


async def remove_from_cart(ctx: OrderToolContext, args: dict[str, JsonValue]) -> str:
    item_id = parse_uuid(args.get("menu_item_id"))
    if item_id is None:
        return dumps({"error": "invalid_menu_item_id"})
    cart = await ctx.cart_service.get_cart(ctx.identifier)
    items = [i for i in existing_items(cart) if str(i.menu_item_id) != str(item_id)]
    if not items or cart.restaurant_id is None:
        await ctx.cart_service.clear_cart(ctx.identifier)
    else:
        await ctx.cart_service.update_cart(
            ctx.identifier, CartUpdate(restaurant_id=cart.restaurant_id, items=items)
        )
    await ctx.invalidate_confirm()
    return dumps({"ok": True, "cart": await ctx.cart_summary_payload()})


async def clear_cart(ctx: OrderToolContext, _args: dict[str, JsonValue]) -> str:
    await ctx.cart_service.clear_cart(ctx.identifier)
    await ctx.invalidate_confirm()
    return dumps({"ok": True, "cart": {"items": [], "total": 0}})
