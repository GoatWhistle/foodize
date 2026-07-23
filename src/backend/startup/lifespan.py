from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from database import db_helper
from features.notifications.broker import broker
from infra.cache.redis import close_redis_pool
from settings.config.app_config import settings
from startup.guards import enforce_production_guards, verify_embedding_dim
from utils.logging_setup import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    if settings.debug:
        logger.warning(
            "Application is running with debug=True: production security guards "
            "(insecure default credentials, weak secrets) are DISABLED. "
            "Docs exposure is controlled separately by DOCS__ENABLED."
        )
    enforce_production_guards()
    if settings.llm.embeddings_enabled:
        await verify_embedding_dim()
    await broker.connect()
    yield
    logger.info("application_shutdown_started")
    await broker.disconnect()
    await close_redis_pool()
    await db_helper.dispose()
    logger.info("application_shutdown_complete")
