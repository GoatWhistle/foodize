from http import HTTPStatus
from typing import Any


class AppException(Exception):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "APP_ERROR"
    detail: str = "Application error"

    def __init__(
        self,
        status_code: int | None = None,
        detail: str | None = None,
        code: str | None = None,
        **params: Any,
    ):
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code
        self.params: dict[str, Any] = params
        self.detail = detail if detail is not None else self._render_detail()
        super().__init__(self.detail)

    def _render_detail(self) -> str:
        template = type(self).detail
        if not self.params:
            return template
        try:
            return template.format(**self.params)
        except (KeyError, IndexError):
            return template


class BadRequestException(AppException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "BAD_REQUEST"
    detail: str = "Bad request"
