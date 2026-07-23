from collections.abc import Sequence
from unittest.mock import AsyncMock, MagicMock


def make_orders_session(
    scalar_result: object = None,
    scalar_one: object = None,
    scalars_list: Sequence[object] | None = None,
) -> AsyncMock:
    session = AsyncMock()
    result = MagicMock()
    if scalars_list is not None:
        result.scalars.return_value.all.return_value = scalars_list
    result.scalar_one_or_none.return_value = scalar_result
    result.scalar_one.return_value = scalar_one if scalar_one is not None else 0
    session.execute = AsyncMock(return_value=result)
    session.add = MagicMock()
    session.flush = AsyncMock()
    return session
