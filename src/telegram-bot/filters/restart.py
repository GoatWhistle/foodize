from aiogram.filters import BaseFilter
from aiogram.types import Message

from keyboards.start_keyboards import RESTART_TEXT


class RestartFilter(BaseFilter):
    async def __call__(self, message: Message) -> bool:
        return message.text == RESTART_TEXT
