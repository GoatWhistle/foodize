from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from shared.exceptions.base import AppException
from shared.schemas.error import ErrorDescriptionSchema, ErrorSchema
async def request_validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorSchema(detail=ErrorDescriptionSchema(error=str(exc))).model_dump(),
    )
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorSchema(detail=ErrorDescriptionSchema(error=exc.detail)).model_dump(),
    )
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorSchema(
            detail=ErrorDescriptionSchema(error="Internal server error")
        ).model_dump(),
    )
