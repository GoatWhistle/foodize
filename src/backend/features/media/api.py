import re

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from features.media.exceptions import MediaFileNotFoundException
from infra.storage import fetch_object_stream
from middlewares.limiter import limiter
from settings.config.app_config import settings

router = APIRouter(prefix=settings.api.v1.media.prefix, tags=[settings.api.v1.media.tag])

_KEY_RE = re.compile(r"^(menu|restaurants)/[a-f0-9]{32}\.(jpg|png|webp)$")


@router.get("/{key:path}")
@limiter.limit("120/minute")
async def get_media(request: Request, key: str) -> StreamingResponse:
    if not _KEY_RE.fullmatch(key):
        raise MediaFileNotFoundException()
    fetched = await fetch_object_stream(key)
    if fetched is None:
        raise MediaFileNotFoundException()
    chunks, content_type, content_length = fetched
    headers = {"Cache-Control": "public, max-age=31536000, immutable"}
    if content_length is not None:
        headers["Content-Length"] = content_length
    return StreamingResponse(chunks, media_type=content_type, headers=headers)
