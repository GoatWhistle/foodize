from unittest.mock import MagicMock, patch

import pytest


def test_get_logger_returns_bound_logger():
    from utils.logging_setup import get_logger
    logger = get_logger()
    assert logger is not None


def test_get_logger_with_custom_name():
    from utils.logging_setup import get_logger
    logger = get_logger("custom")
    assert logger is not None


def test_configure_logging_no_sentry():
    from unittest.mock import patch
    from utils.logging_setup import configure_logging

    mock_settings = MagicMock()
    mock_settings.logs.level = "INFO"
    mock_settings.logs.sentry_dsn = None

    with (
        patch("utils.logging_setup.settings", mock_settings),
        patch("utils.logging_setup.structlog.configure"),
    ):
        configure_logging()


def test_configure_logging_with_sentry():
    from unittest.mock import patch
    from utils.logging_setup import configure_logging

    mock_settings = MagicMock()
    mock_settings.logs.level = "DEBUG"
    mock_settings.logs.sentry_dsn = "https://fake@sentry.io/123"
    mock_settings.logs.environment = "test"

    with (
        patch("utils.logging_setup.settings", mock_settings),
        patch("utils.logging_setup.sentry_sdk.init"),
        patch("utils.logging_setup.structlog.configure"),
        patch("utils.logging_setup.SqlalchemyIntegration", return_value=MagicMock()),
    ):
        configure_logging()
