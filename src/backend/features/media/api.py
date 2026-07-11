import re

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from infra.storage import fetch_object_stream
from middlewares.limiter import limiter
from shared.exceptions.existence import NotFoundException

router = APIRouter(prefix="/media", tags=["Media"])

_KEY_RE = re.compile(r"^(menu|restaurants)/[a-f0-9]{32}\.(jpg|png|webp)$")


@router.get("/{key:path}")
@limiter.limit("120/minute")
async def get_media(request: Request, key: str) -> StreamingResponse:
    if not _KEY_RE.fullmatch(key):
        raise NotFoundException(detail="File not found")
    fetched = await fetch_object_stream(key)
    if fetched is None:
        raise NotFoundException(detail="File not found")
    chunks, content_type, content_length = fetched
    headers = {"Cache-Control": "public, max-age=31536000, immutable"}
    if content_length is not None:
        headers["Content-Length"] = content_length
    return StreamingResponse(chunks, media_type=content_type, headers=headers)
