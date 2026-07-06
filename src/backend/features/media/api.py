import re

from fastapi import APIRouter, Response

from infra.storage import fetch_object
from shared.exceptions.existence import NotFoundException

router = APIRouter(prefix="/media", tags=["Media"])

# Only keys produced by upload_image (uuid hex + known extension under a known
# prefix) are servable — anything else 404s without touching the storage.
_KEY_RE = re.compile(r"^(menu|restaurants)/[a-f0-9]{32}\.(jpg|png|webp)$")


@router.get("/{key:path}")
async def get_media(key: str) -> Response:
    if not _KEY_RE.fullmatch(key):
        raise NotFoundException(detail="File not found")
    fetched = await fetch_object(key)
    if fetched is None:
        raise NotFoundException(detail="File not found")
    data, content_type = fetched
    # Keys are content-addressed (uuid per upload), so the response is immutable.
    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
