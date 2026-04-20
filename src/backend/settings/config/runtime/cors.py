from pydantic import field_validator

from settings.config.base import BaseConfig


class CorsConfig(BaseConfig):
    allowed_origins: list[str] = [
        "http://localhost",
        "http://localhost:80",
        "http://127.0.0.1",
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: object) -> object:
        # Support comma-separated string from env: CORS__ALLOWED_ORIGINS="https://a.com,https://b.com"
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v
