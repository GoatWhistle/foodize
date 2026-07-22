from fastapi import Header

from shared.i18n import normalize_language


def get_language(accept_language: str | None = Header(default=None)) -> str:
    return normalize_language(accept_language)
