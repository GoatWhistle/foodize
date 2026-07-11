from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.crud import create_option_group
from features.menu.models import MenuItem, MenuItemOptionGroup
from features.menu.schemas import MenuItemOptionGroupCreate
from seed.data import OPTION_GROUP_PRESETS


async def create_sample_option_groups(
    session: AsyncSession, item: MenuItem
) -> list[MenuItemOptionGroup]:
    presets = OPTION_GROUP_PRESETS.get(item.name)
    if not presets:
        return []
    created_groups: list[MenuItemOptionGroup] = []
    for preset in presets:
        group = await create_option_group(
            session,
            item,
            MenuItemOptionGroupCreate(**preset),
        )
        created_groups.append(group)
    return created_groups
