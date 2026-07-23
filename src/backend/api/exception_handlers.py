from collections.abc import Awaitable, Callable
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

from shared.exceptions.base import AppException
from shared.exceptions.validation import FieldValidationError
from shared.schemas.error import ErrorDescriptionSchema, ErrorSchema
from utils.logging_setup import get_logger

logger = get_logger()

_CONSTRAINT_MESSAGES: dict[str, str] = {
    "uq_restaurants_address": "A restaurant with this address already exists.",
    "uq_reviews_user_restaurant_active": "You have already reviewed this restaurant.",
    "uq_promo_usages_promo_user": "This promo code has already been used.",
    "ix_promos_code": "A promo code with this value already exists.",
    "uq_promos_code": "A promo code with this value already exists.",
}
_DEFAULT_INTEGRITY_MESSAGE = "Duplicate entry: this information already exists."


def _resolve_integrity_message(error_msg: str) -> str:
    for constraint, message in _CONSTRAINT_MESSAGES.items():
        if constraint in error_msg:
            return message
    return _DEFAULT_INTEGRITY_MESSAGE


def register_exception_handler[ExcT: Exception](
    app: FastAPI,
    exc_class: type[ExcT],
    handler: Callable[[Request, ExcT], Awaitable[Response] | Response],
) -> None:
    async def adapter(request: Request, exc: Exception) -> Response:
        if not isinstance(exc, exc_class):
            raise exc
        result = handler(request, exc)
        if isinstance(result, Response):
            return result
        return await result

    app.add_exception_handler(exc_class, adapter)


def _extract_constraint_name(exc: IntegrityError) -> str:
    constraint = getattr(getattr(exc, "orig", None), "diag", None)
    name = getattr(constraint, "constraint_name", None)
    if isinstance(name, str) and name:
        return name
    error_msg = str(exc.orig) if getattr(exc, "orig", None) else str(exc)
    for known in _CONSTRAINT_MESSAGES:
        if known in error_msg:
            return known
    return "unknown"


def _first_validation_error(exc: RequestValidationError) -> FieldValidationError | None:
    for error in exc.errors():
        original = error.get("ctx", {}).get("error") if error.get("ctx") else None
        if isinstance(original, FieldValidationError):
            return original
    return None


async def request_validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    errors = [
        {"loc": e.get("loc"), "msg": e.get("msg"), "type": e.get("type")} for e in exc.errors()
    ]
    message = "; ".join(
        f"{'.'.join(str(part) for part in (e['loc'] or []) if part != 'body')}: {e['msg']}"
        for e in errors
    )
    first = _first_validation_error(exc)
    return JSONResponse(
        status_code=HTTPStatus.BAD_REQUEST,
        content=ErrorSchema(
            detail=ErrorDescriptionSchema(
                error=message,
                code=first.code if first else "VALIDATION_ERROR",
                params=first.params if first else {},
            )
        ).model_dump(),
    )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.warning(
        "AppException",
        error=exc.detail,
        request_id=request_id,
        path=str(request.url.path),
    )
    return JSONResponse(
        status_code=int(exc.status_code),
        content=ErrorSchema(
            detail=ErrorDescriptionSchema(error=exc.detail, code=exc.code, params=exc.params)
        ).model_dump(),
        headers={"X-Request-ID": request_id} if request_id else {},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.exception(
        "Unhandled exception",
        error=str(exc),
        request_id=request_id,
        path=str(request.url.path),
    )
    return JSONResponse(
        status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
        content=ErrorSchema(
            detail=ErrorDescriptionSchema(error="Internal server error", code="INTERNAL_ERROR")
        ).model_dump(),
        headers={"X-Request-ID": request_id} if request_id else {},
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorSchema(
            detail=ErrorDescriptionSchema(error=str(exc.detail), code="HTTP_ERROR")
        ).model_dump(),
    )


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    error_msg = str(exc.orig) if getattr(exc, "orig", None) else str(exc)
    constraint_name = _extract_constraint_name(exc)
    request_id = getattr(request.state, "request_id", None)
    logger.warning(
        "IntegrityError",
        constraint=constraint_name,
        request_id=request_id,
        path=str(request.url.path),
    )

    friendly_msg = _resolve_integrity_message(error_msg)

    return JSONResponse(
        status_code=HTTPStatus.BAD_REQUEST,
        content=ErrorSchema(detail=ErrorDescriptionSchema(error=friendly_msg)).model_dump(),
    )
