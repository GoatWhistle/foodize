from pydantic import Field, PostgresDsn

from settings.config.base import BaseConfig


def _default_naming_convention() -> dict[str, str]:
    return {
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_N_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }


class DbConfig(BaseConfig):
    url: PostgresDsn
    echo: bool = False
    echo_pool: bool = False
    max_overflow: int = 10
    pool_size: int = 10
    naming_convention: dict[str, str] = Field(default_factory=_default_naming_convention)
