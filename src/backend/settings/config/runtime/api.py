from pydantic import BaseModel


class RouteConfig(BaseModel):
    prefix: str
    tag: str


class ApiV1Prefix(BaseModel):
    prefix: str = "/v1"

    admin: RouteConfig = RouteConfig(prefix="/admin", tag="Admin")
    ai_advisor: RouteConfig = RouteConfig(prefix="/ai/advisor", tag="AI Advisor")
    ai_order: RouteConfig = RouteConfig(prefix="/ai/order", tag="AI Order")
    auth: RouteConfig = RouteConfig(prefix="", tag="Auth")
    cart: RouteConfig = RouteConfig(prefix="/cart", tag="Cart")
    favorites: RouteConfig = RouteConfig(prefix="/favorites", tag="Favorites")
    loyalty: RouteConfig = RouteConfig(prefix="/loyalty", tag="Loyalty")
    media: RouteConfig = RouteConfig(prefix="/media", tag="Media")
    menu: RouteConfig = RouteConfig(prefix="/menu", tag="Menu")
    notifications: RouteConfig = RouteConfig(prefix="/notifications", tag="Notifications")
    notifications_ws: RouteConfig = RouteConfig(prefix="/ws", tag="WebSockets")
    orders: RouteConfig = RouteConfig(prefix="/orders", tag="Orders")
    promos: RouteConfig = RouteConfig(prefix="/promos", tag="Promos")
    restaurants: RouteConfig = RouteConfig(prefix="/restaurants", tag="Restaurants")
    reviews: RouteConfig = RouteConfig(prefix="/restaurants", tag="Reviews")
    staff: RouteConfig = RouteConfig(prefix="/staff", tag="Staff")
    telegram_bot: RouteConfig = RouteConfig(prefix="/telegram/bot", tag="Telegram")
    telegram_webapp: RouteConfig = RouteConfig(prefix="/telegram", tag="Telegram")
    users: RouteConfig = RouteConfig(prefix="/users", tag="Users")
    vendors: RouteConfig = RouteConfig(prefix="/vendors", tag="Vendors")


class ApiPrefix(BaseModel):
    prefix: str = "/api"
    v1: ApiV1Prefix = ApiV1Prefix()
