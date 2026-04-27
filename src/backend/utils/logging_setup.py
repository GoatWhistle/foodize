import logging
import logging.config

from settings.config.app_config import settings

LOGGER_NAME = "foodize"


def configure_logging() -> None:
    level = settings.logs.level.upper()
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {
                    "format": (
                        '{"time": "%(asctime)s", "level": "%(levelname)s", '
                        '"name": "%(name)s", "message": %(message)s}'
                    ),
                    "datefmt": "%Y-%m-%dT%H:%M:%S",
                },
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                    "stream": "ext://sys.stderr",
                },
                "access": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "handlers": ["default"],
                "level": level,
            },
            "loggers": {
                LOGGER_NAME: {"handlers": ["default"], "level": level, "propagate": False},
                "foodize.access": {"handlers": ["access"], "level": level, "propagate": False},
                "uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False},
                "uvicorn.access": {"handlers": ["access"], "level": "WARNING", "propagate": False},
                "uvicorn.error": {"level": "ERROR", "propagate": False},
                "sqlalchemy.engine": {"level": "WARNING", "propagate": False},
                "aio_pika": {"level": "ERROR", "propagate": False},
            },
        }
    )


def get_logger(name: str = LOGGER_NAME) -> logging.Logger:
    return logging.getLogger(name)
