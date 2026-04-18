import uvicorn
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from api import router as api_router
from api.exception_handlers import (
    app_exception_handler,
    http_exception_handler,
    integrity_error_handler,
    request_validation_error_handler,
    unhandled_exception_handler,
)
from settings.config.app_config import settings
from shared.exceptions.base import AppException

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:80",
        "http://127.0.0.1",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_exception_handler(RequestValidationError, request_validation_error_handler)  # type: ignore[arg-type]
app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(IntegrityError, integrity_error_handler)  # type: ignore[arg-type]
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
