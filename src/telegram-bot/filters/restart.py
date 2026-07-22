from aiogram.filters import BaseFilter
from aiogram.types import Message

from keyboards.start_keyboards import restart_texts


class RestartFilter(BaseFilter):
    async def __call__(self, message: Message) -> bool:
        return message.text in restart_texts()
