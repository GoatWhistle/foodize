import uuid

from features.users.models import User
from shared.enums.roles import UserRole


def make_user(
    *,
    user_id: uuid.UUID | None = None,
    name: str = "Test User",
    phone_number: str = "79001234567",
    hashed_password: str = "hashed_secret",
    user_role: UserRole = UserRole.CUSTOMER,
) -> User:
    user = User()
    user.id = user_id or uuid.uuid4()
    user.name = name
    user.phone_number = phone_number
    user.hashed_password = hashed_password
    user.user_role = user_role
    return user
