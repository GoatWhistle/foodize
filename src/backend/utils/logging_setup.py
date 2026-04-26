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
                "default": {
                    "()": "uvicorn.logging.DefaultFormatter",
                    "fmt": "%(levelprefix)s %(asctime)s | %(name)s | %(message)s",
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                    "use_colors": True,
                },
                "access": {
                    "()": "uvicorn.logging.DefaultFormatter",
                    "fmt": "%(levelprefix)s %(asctime)s | %(message)s",
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                    "use_colors": True,
                },
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "stream": "ext://sys.stderr",
                },
                "access": {
                    "class": "logging.StreamHandler",
                    "formatter": "access",
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
