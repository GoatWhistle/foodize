import hashlib
import uuid

from database import db_helper
from features.admin.crud import CATEGORY_RU
from features.ai_order_agent import search as search_mod
from features.ai_order_agent.tool_helpers import (
    CONFIRM_TTL_SECONDS,
    PLACE_ORDER_ERRORS,
    PROMO_RE,
    _dumps,
    _existing_items,
    _parse_confirm,
    _parse_uuid,
    _strip_item_markers,
    cart_state_hash,
    cart_summary,
    order_confirm_key,
)
from features.ai_order_agent.tool_specs import ORDER_TOOLS
from features.cart.schemas import CartItemIn, CartSelectedOption, CartUpdate
from features.cart.service import CartService
from features.menu.crud import get_menu_item_by_id
from features.orders.schemas.order import OrderCreate, OrderItemCreate
from features.orders.services.order_placement import place_order
from features.users.models import User
from infra.cache.base import CacheRepository
from infra.llm import ToolCall, ToolExecutor
from shared.exceptions import AppException

__all__ = ["ORDER_TOOLS", "build_order_executor"]


def build_order_executor(
    user: User,
    cart_service: CartService,
    cache: CacheRepository,
    *,
    user_turn: int = 0,
) -> ToolExecutor:
    identifier = str(user.id)
    confirm_key = order_confirm_key(identifier)

    async def _cart_summary() -> dict:
        cart = await cart_service.get_cart(identifier)
        return cart_summary(cart)

    async def _search(args: dict) -> str:
        raw_max_price = args.get("max_price")
        max_price: int | None = None
        if raw_max_price is not None:
            try:
                max_price = max(0, int(raw_max_price))
            except (TypeError, ValueError):
                max_price = None
        async with db_helper.session_factory() as session:
            results = await search_mod.semantic_search(
                session,
                cache,
                query=args.get("query"),
                max_price=max_price,
                restaurant_id=_parse_uuid(args.get("restaurant_id")),
            )
        for r in results:
            r["category"] = CATEGORY_RU.get(r["category"], r["category"])
            if r.get("name"):
                clean_name = _strip_item_markers(r["name"])
                r["name"] = f"<<<ITEM>>>{clean_name}<<<END_ITEM>>>"
        if not results:
            return _dumps(
                {
                    "results": [],
                    "message": (
                        "Сейчас нет доступных ресторанов или блюд. Повторять поиск не нужно — "
                        "сообщи об этом пользователю."
                    ),
                }
            )
        return _dumps({"results": results})

    async def _view_cart(_args: dict) -> str:
        cart = await cart_service.get_cart(identifier)
        token = uuid.uuid4().hex
        state_hash = cart_state_hash(cart)
        await cache.set(confirm_key, f"{user_turn}:{token}:{state_hash}", ttl=CONFIRM_TTL_SECONDS)
        return _dumps(cart_summary(cart))

    async def _invalidate_confirm() -> None:
        await cache.delete(confirm_key)

    async def _add(args: dict) -> str:
        item_id = _parse_uuid(args.get("menu_item_id"))
        if item_id is None:
            return _dumps({"error": "invalid_menu_item_id"})
        async with db_helper.session_factory() as session:
            item = await get_menu_item_by_id(session, item_id)
        if item is None or item.is_deleted or not item.is_available:
            return _dumps({"error": "item_unavailable", "message": "Позиция недоступна."})

        try:
            quantity = max(1, min(int(args.get("quantity") or 1), 99))
        except (TypeError, ValueError):
            quantity = 1

        available_options = {
            o.id: o for group in item.option_groups for o in group.options if o.is_available
        }
        valid_options: list[CartSelectedOption] = []
        valid_ids: list[uuid.UUID] = []
        for raw in args.get("option_ids") or []:
            oid = _parse_uuid(raw)
            if oid is None:
                continue
            option = available_options.get(oid)
            if option is not None:
                valid_options.append(
                    CartSelectedOption(
                        option_id=option.id, name=option.name, price_delta=option.price_delta
                    )
                )
                valid_ids.append(option.id)

        cart = await cart_service.get_cart(identifier)
        if cart.items and cart.restaurant_id and str(cart.restaurant_id) != str(item.restaurant_id):
            return _dumps(
                {
                    "error": "cart_has_other_restaurant",
                    "message": (
                        "В корзине позиции из другого ресторана. Очистите её (clear_cart), "
                        "чтобы заказать в этом."
                    ),
                }
            )

        items = _existing_items(cart)
        option_key = tuple(sorted(str(x) for x in valid_ids))
        merged = False
        for existing in items:
            same_options = tuple(sorted(str(x) for x in existing.selected_option_ids)) == option_key
            if str(existing.menu_item_id) == str(item.id) and same_options:
                existing.quantity = min(99, existing.quantity + quantity)
                merged = True
                break
        if not merged:
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

        await cart_service.update_cart(
            identifier, CartUpdate(restaurant_id=item.restaurant_id, items=items)
        )
        await _invalidate_confirm()
        return _dumps({"ok": True, "cart": await _cart_summary()})

    async def _remove(args: dict) -> str:
        item_id = _parse_uuid(args.get("menu_item_id"))
        if item_id is None:
            return _dumps({"error": "invalid_menu_item_id"})
        cart = await cart_service.get_cart(identifier)
        items = [i for i in _existing_items(cart) if str(i.menu_item_id) != str(item_id)]
        if not items or cart.restaurant_id is None:
            await cart_service.clear_cart(identifier)
        else:
            await cart_service.update_cart(
                identifier, CartUpdate(restaurant_id=cart.restaurant_id, items=items)
            )
        await _invalidate_confirm()
        return _dumps({"ok": True, "cart": await _cart_summary()})

    async def _clear(_args: dict) -> str:
        await cart_service.clear_cart(identifier)
        await _invalidate_confirm()
        return _dumps({"ok": True, "cart": {"items": [], "total": 0}})

    async def _place(args: dict) -> str:
        stored = await cache.get(confirm_key)
        confirmed_turn, confirm_token, confirmed_hash = _parse_confirm(stored)
        if confirm_token is None:
            return _dumps(
                {
                    "error": "cart_not_confirmed",
                    "message": (
                        "Перед оформлением нужно показать пользователю состав корзины "
                        "через view_cart и дождаться его явного подтверждения."
                    ),
                }
            )
        if confirmed_turn is None or confirmed_turn >= user_turn:
            return _dumps(
                {
                    "error": "cart_not_confirmed",
                    "message": (
                        "Состав корзины показан, но пользователь ещё не подтвердил заказ "
                        "новым сообщением. Дождись явного согласия в новом сообщении "
                        "пользователя, затем оформляй."
                    ),
                }
            )

        cart = await cart_service.get_cart(identifier)
        if not cart.items or not cart.restaurant_id:
            return _dumps({"error": "cart_empty", "message": "Корзина пуста."})

        if confirmed_hash is not None and confirmed_hash != cart_state_hash(cart):
            await _invalidate_confirm()
            return _dumps(
                {
                    "error": "cart_changed",
                    "message": (
                        "Состав корзины изменился после подтверждения. Покажи актуальный "
                        "состав через view_cart и дождись нового подтверждения."
                    ),
                }
            )

        raw_promo = args.get("promo_code")
        promo_code = raw_promo if raw_promo and PROMO_RE.match(raw_promo) else None
        comment = str(args.get("comment") or "")[:500].strip() or None

        order_items = [
            OrderItemCreate(
                menu_item_id=it.menuItem.id,
                quantity=it.quantity,
                selected_option_ids=list(it.selected_option_ids),
            )
            for it in cart.items
            if it.menuItem is not None
        ]
        if not order_items:
            return _dumps({"error": "item_unavailable", "message": "Позиции недоступны."})

        items_part = ";".join(
            "{}x{}:{}".format(
                it.menuItem.id,
                it.quantity,
                ",".join(sorted(str(o) for o in it.selected_option_ids)),
            )
            for it in cart.items
            if it.menuItem is not None
        )
        fingerprint_source = "|".join(
            [
                str(user.id),
                str(cart.restaurant_id),
                items_part,
                comment or "",
                promo_code or "",
                confirm_token,
            ]
        )
        cart_fingerprint = hashlib.sha256(fingerprint_source.encode()).hexdigest()[:32]

        order_in = OrderCreate(
            restaurant_id=cart.restaurant_id,
            items=order_items,
            promo_code=promo_code,
            comment=comment,
        )
        try:
            async with db_helper.session_factory() as session:
                result = await place_order(
                    session=session,
                    order_data=order_in,
                    user_id=user.id,
                    idempotency_key=cart_fingerprint,
                )
        except AppException as exc:
            error_code = PLACE_ORDER_ERRORS.get(type(exc))
            if error_code is None:
                raise
            return _dumps({"error": error_code, "message": exc.detail})
        await cart_service.clear_cart(identifier)
        await _invalidate_confirm()
        data = result.model_dump()
        return _dumps(
            {
                "ok": True,
                "order": {
                    "number": data.get("display_id"),
                    "status": data.get("status"),
                    "total_price": data.get("total_price"),
                },
            }
        )

    handlers = {
        "search_menu": _search,
        "view_cart": _view_cart,
        "add_to_cart": _add,
        "remove_from_cart": _remove,
        "clear_cart": _clear,
        "place_order": _place,
    }

    async def execute(call: ToolCall) -> str:
        handler = handlers.get(call.name)
        if handler is None:
            return _dumps({"error": f"Unknown tool: {call.name}"})
        return await handler(call.arguments or {})

    return execute
