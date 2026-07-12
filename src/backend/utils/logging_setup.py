import logging
import sys
import traceback
from typing import cast

import sentry_sdk
import structlog
from sentry_sdk.integrations import Integration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from structlog.typing import EventDict, WrappedLogger

from settings.config.app_config import settings

_fastapi_integration: type[Integration] | None
try:
    from sentry_sdk.integrations.fastapi import FastApiIntegration

    _fastapi_integration = FastApiIntegration
except ImportError:
    try:
        from sentry_sdk.integrations.starlette import StarletteIntegration

        _fastapi_integration = StarletteIntegration
    except ImportError:
        _fastapi_integration = None

LOGGER_NAME = "foodize"
TRACEBACK_FRAME_LIMIT = 3

_RESET = "\033[0m"
_DIM = "\033[2m"
_LEVEL_COLORS = {
    "debug": "\033[36m",
    "info": "\033[32m",
    "warning": "\033[33m",
    "error": "\033[31m",
    "critical": "\033[41m\033[97m",
}


def _compact_exception(logger: WrappedLogger, method_name: str, event_dict: EventDict) -> EventDict:
    exc_info = event_dict.pop("exc_info", None)
    if not exc_info:
        return event_dict

    if exc_info is True:
        exc_info = sys.exc_info()
    exc_type, exc_value, exc_tb = exc_info
    if exc_type is None:
        return event_dict

    formatted = traceback.format_exception(exc_type, exc_value, exc_tb, limit=TRACEBACK_FRAME_LIMIT)
    event_dict["exception"] = "".join(formatted).strip()
    return event_dict


def _colored_console_renderer(
    logger: WrappedLogger, method_name: str, event_dict: EventDict
) -> str:
    timestamp = event_dict.pop("timestamp", "")
    level = event_dict.pop("level", "info")
    event = event_dict.pop("event", "")
    exception = event_dict.pop("exception", None)

    color = _LEVEL_COLORS.get(level, "")
    level_tag = f"{color}{level.upper():<8}{_RESET}"
    fields = " ".join(f"\033[36m{k}\033[0m={v}" for k, v in event_dict.items())

    line = f"{_DIM}{timestamp}{_RESET} {level_tag} {event}"
    if fields:
        line += f" {fields}"
    if exception:
        line += f"\n{color}{exception}{_RESET}"
    return line


def configure_logging() -> None:
    level = settings.logs.level.upper()
    is_dev = settings.logs.environment != "production"

    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=level)

    for noisy_logger in ("uvicorn", "uvicorn.error"):
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)
    access_logger = logging.getLogger("uvicorn.access")
    access_logger.handlers.clear()
    access_logger.propagate = False
    access_logger.disabled = True

    if settings.logs.sentry_dsn:
        integrations: list[Integration] = [SqlalchemyIntegration()]
        if _fastapi_integration is not None:
            integrations.insert(0, _fastapi_integration())

        sentry_sdk.init(
            dsn=settings.logs.sentry_dsn,
            environment=settings.logs.environment,
            integrations=integrations,
            traces_sample_rate=settings.logs.sentry_traces_sample_rate,
            send_default_pii=False,
        )

    shared_processors: list[structlog.typing.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="%H:%M:%S"),
        _compact_exception,
    ]

    renderer = _colored_console_renderer if is_dev else structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = LOGGER_NAME) -> structlog.BoundLogger:
    return cast("structlog.BoundLogger", structlog.get_logger(name).bind(service="foodize"))
