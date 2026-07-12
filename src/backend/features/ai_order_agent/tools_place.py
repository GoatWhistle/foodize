import hashlib
from typing import Any

from database import db_helper
from features.ai_order_agent.tool_context import OrderToolContext
from features.ai_order_agent.tool_helpers import (
    PLACE_ORDER_ERRORS,
    PROMO_RE,
    _dumps,
    _parse_confirm,
    cart_state_hash,
)
from features.cart.schemas import CartResponse
from features.orders.schemas.order import OrderCreate
from features.orders.schemas.order_item import OrderItemCreate
from features.orders.services.order_placement import place_order
from features.users.models import User
from shared.exceptions import AppException

_COMMENT_MAX_LENGTH = 500
_FINGERPRINT_LENGTH = 32


def _confirmation_error(ctx: OrderToolContext, stored: str | None) -> str | None:
    confirmed_turn, confirm_token, _ = _parse_confirm(stored)
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
    if confirmed_turn is None or confirmed_turn >= ctx.user_turn:
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
    return None


def _build_order_items(cart: CartResponse) -> list[OrderItemCreate]:
    return [
        OrderItemCreate(
            menu_item_id=it.menuItem.id,
            quantity=it.quantity,
            selected_option_ids=list(it.selected_option_ids),
        )
        for it in cart.items
        if it.menuItem is not None
    ]


def _order_fingerprint(
    user: User,
    cart: CartResponse,
    comment: str | None,
    promo_code: str | None,
    confirm_token: str,
) -> str:
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
    return hashlib.sha256(fingerprint_source.encode()).hexdigest()[:_FINGERPRINT_LENGTH]


async def place_order_tool(ctx: OrderToolContext, args: dict[str, Any]) -> str:
    stored = await ctx.cache.get(ctx.confirm_key)
    confirmation_error = _confirmation_error(ctx, stored)
    if confirmation_error is not None:
        return confirmation_error
    _, confirm_token, confirmed_hash = _parse_confirm(stored)
    if confirm_token is None:
        return confirmation_error or _dumps({"error": "cart_not_confirmed"})

    cart = await ctx.cart_service.get_cart(ctx.identifier)
    if not cart.items or not cart.restaurant_id:
        return _dumps({"error": "cart_empty", "message": "Корзина пуста."})

    if confirmed_hash is not None and confirmed_hash != cart_state_hash(cart):
        await ctx.invalidate_confirm()
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
    comment = str(args.get("comment") or "")[:_COMMENT_MAX_LENGTH].strip() or None

    order_items = _build_order_items(cart)
    if not order_items:
        return _dumps({"error": "item_unavailable", "message": "Позиции недоступны."})

    order_in = OrderCreate(
        restaurant_id=cart.restaurant_id,
        items=order_items,
        promo_code=promo_code,
        comment=comment,
    )
    fingerprint = _order_fingerprint(ctx.user, cart, comment, promo_code, confirm_token)
    try:
        async with db_helper.session_factory() as session:
            result = await place_order(
                session=session,
                order_data=order_in,
                user_id=ctx.user.id,
                idempotency_key=fingerprint,
            )
    except AppException as exc:
        error_code = PLACE_ORDER_ERRORS.get(type(exc))
        if error_code is None:
            raise
        return _dumps({"error": error_code, "message": exc.detail})

    await ctx.cart_service.clear_cart(ctx.identifier)
    await ctx.invalidate_confirm()
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
