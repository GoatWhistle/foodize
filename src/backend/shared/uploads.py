from fastapi import Request, UploadFile

from infra.storage import ALLOWED_IMAGE_CONTENT_TYPES, MAX_IMAGE_BYTES
from shared.exceptions import BadRequestException

_TOO_LARGE_DETAIL = "Файл слишком большой (максимум 5 МБ)"


def _exceeds_declared_size(request: Request) -> bool:
    content_length = request.headers.get("content-length")
    return (
        content_length is not None
        and content_length.isdigit()
        and int(content_length) > MAX_IMAGE_BYTES
    )


async def read_image_upload(
    file: UploadFile, request: Request, *, validate_content_type: bool = False
) -> bytes:
    if validate_content_type and (file.content_type or "") not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise BadRequestException(detail="Недопустимый тип файла")
    if _exceeds_declared_size(request):
        raise BadRequestException(detail=_TOO_LARGE_DETAIL)

    data = await file.read(MAX_IMAGE_BYTES + 1)
    if not data:
        raise BadRequestException(detail="Пустой файл")
    if len(data) > MAX_IMAGE_BYTES:
        raise BadRequestException(detail=_TOO_LARGE_DETAIL)
    return data
