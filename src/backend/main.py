import uvicorn
from fastapi import FastAPI

from api import router as api_router
from api.system import router as system_router
from settings.config.app_config import settings
from startup.lifespan import lifespan
from startup.middleware import configure_exception_handlers, configure_middleware
from utils.logging_setup import configure_logging

configure_logging()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Foodize API",
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.docs.enabled else None,
        redoc_url="/redoc" if settings.docs.enabled else None,
        openapi_url="/openapi.json" if settings.docs.enabled else None,
    )
    configure_middleware(app)
    configure_exception_handlers(app)
    app.include_router(api_router)
    app.include_router(system_router)
    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.run.host,
        port=settings.run.port,
        timeout_graceful_shutdown=30,
    )
