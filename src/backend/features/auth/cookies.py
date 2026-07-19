import secrets
from typing import Literal

from fastapi import Response

from features.auth.schemas import TokenResponse
from settings.config.app_config import settings

SameSite = Literal["lax", "strict", "none"]


def cookie_secure(same_site: SameSite) -> bool:
    return settings.logs.environment != "development" or same_site == "none"


def set_auth_cookies(
    response: Response,
    tokens: TokenResponse,
    same_site: SameSite = "lax",
) -> None:
    secure = cookie_secure(same_site)
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        secure=secure,
        max_age=settings.auth.access_token_lifetime_seconds,
        samesite=same_site,
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=secure,
        max_age=settings.auth.refresh_token_lifetime_seconds,
        samesite=same_site,
    )
    set_csrf_cookie(response, same_site=same_site)


def clear_auth_cookies(response: Response, same_site: SameSite = "lax") -> None:
    secure = cookie_secure(same_site)
    response.delete_cookie("access_token", httponly=True, secure=secure, samesite=same_site)
    response.delete_cookie("refresh_token", httponly=True, secure=secure, samesite=same_site)
    response.delete_cookie(
        settings.auth.csrf_cookie_name, httponly=False, secure=secure, samesite=same_site
    )


def set_csrf_cookie(response: Response, same_site: SameSite = "lax") -> str:
    token = secrets.token_urlsafe(32)
    response.set_cookie(
        key=settings.auth.csrf_cookie_name,
        value=token,
        httponly=False,
        secure=cookie_secure(same_site),
        max_age=settings.auth.refresh_token_lifetime_seconds,
        samesite=same_site,
    )
    return token


def set_telegram_auth_cookies(response: Response, tokens: TokenResponse) -> None:
    set_auth_cookies(response, tokens, same_site="none")
