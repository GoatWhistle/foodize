from sqlalchemy import MetaData

from core.config import settings

metadata = MetaData(naming_convention=settings.db.naming_convention)
