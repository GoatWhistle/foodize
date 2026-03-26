import uvicorn
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from api import router as api_router
from api.exception_handlers import (
    app_exception_handler,
    request_validation_error_handler,
    unhandled_exception_handler,
)
from settings.config.app_config import settings
from shared.exceptions.base import AppException

app = FastAPI()

app.add_exception_handler(RequestValidationError, request_validation_error_handler)
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(api_router)


@app.get("/api/ping")
async def ping():
    return {"status": "pong"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.run.host,
        port=settings.run.port,
    )
