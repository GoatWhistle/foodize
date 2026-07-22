from fastapi import Request, UploadFile

from infra.storage import ALLOWED_IMAGE_CONTENT_TYPES, MAX_IMAGE_BYTES
from shared.exceptions.uploads import (
    EmptyFileException,
    FileTooLargeException,
    UnsupportedFileTypeException,
)


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
        raise UnsupportedFileTypeException()
    if _exceeds_declared_size(request):
        raise FileTooLargeException()

    data = await file.read(MAX_IMAGE_BYTES + 1)
    if not data:
        raise EmptyFileException()
    if len(data) > MAX_IMAGE_BYTES:
        raise FileTooLargeException()
    return data
