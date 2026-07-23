import uuid
from unittest.mock import AsyncMock, MagicMock


class FakeBotUser:
    def __init__(self) -> None:
        self.id = uuid.uuid4()
        self.name = "Test User"
        self.phone_number = "79001234567"
        self.email = None
        self.telegram_username = "test_tg"
        self.telegram_id = None
        self.permissions: list[str] = []
        self.has_password = False
        self.first_name = None
        self.last_name = None
        self.middle_name = None
        self.is_active = True
        self.created_at = None


def make_bot_cache(count: int = 1) -> MagicMock:
    cache = MagicMock()
    cache.incr_with_expire = AsyncMock(return_value=count)
    return cache
