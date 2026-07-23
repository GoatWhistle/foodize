from features.cart.schemas import CartResponse
from features.cart.service import CartService
from tests.fake_cache import FakeCache


class FakeCartService(CartService):
    def __init__(self, cart: CartResponse | None = None) -> None:
        super().__init__(cache=FakeCache())
        self.cart = cart if cart is not None else CartResponse(restaurant_id=None, items=[])
        self.cleared: list[str] = []
        self.updated: list[str] = []

    async def get_cart(self, identifier: str) -> CartResponse:
        del identifier
        return self.cart

    async def clear_cart(self, identifier: str) -> None:
        self.cleared.append(identifier)

    async def update_cart(
        self,
        identifier: str,
        _cart_data: object = None,
        session: object = None,
    ) -> None:
        del session
        self.updated.append(identifier)
