import asyncio
import uuid
from functools import lru_cache

import boto3
from botocore.config import Config

from settings.config.app_config import settings

# Allowed image content types mapped to the file extension used for the S3 key.
_ALLOWED_TYPES: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


class UnsupportedImageType(Exception):
    """Raised when the uploaded file is not an accepted image type."""


@lru_cache(maxsize=1)
def _client():
    cfg = settings.s3
    return boto3.client(
        "s3",
        endpoint_url=cfg.endpoint_url or None,
        region_name=cfg.region,
        aws_access_key_id=cfg.access_key or None,
        aws_secret_access_key=cfg.secret_key or None,
        config=Config(
            signature_version="s3v4",
            # Cloud.ru (and most S3-compatible providers) address buckets as
            # <endpoint>/<bucket> rather than <bucket>.<endpoint>. Forcing
            # path-style avoids DNS/TLS failures against s3.cloud.ru.
            s3={"addressing_style": "path"},
            retries={"max_attempts": 3},
        ),
    )


def _public_url(key: str) -> str:
    cfg = settings.s3
    base = cfg.public_base_url or f"{cfg.endpoint_url}/{cfg.bucket}"
    return f"{base.rstrip('/')}/{key}"


def _key_from_url(url: str) -> str | None:
    cfg = settings.s3
    base = (cfg.public_base_url or f"{cfg.endpoint_url}/{cfg.bucket}").rstrip("/")
    if url.startswith(base + "/"):
        return url[len(base) + 1 :]
    return None


def _upload_image_sync(data: bytes, content_type: str, prefix: str) -> str:
    ext = _ALLOWED_TYPES.get(content_type)
    if ext is None:
        raise UnsupportedImageType(content_type)
    key = f"{prefix}/{uuid.uuid4().hex}.{ext}"
    _client().put_object(
        Bucket=settings.s3.bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable",
    )
    return _public_url(key)


def _delete_image_sync(url: str) -> None:
    key = _key_from_url(url)
    if not key:
        return
    _client().delete_object(Bucket=settings.s3.bucket, Key=key)


async def upload_image(data: bytes, content_type: str, prefix: str = "menu") -> str:
    """Upload image bytes to object storage and return the public URL.

    boto3 is synchronous, so the blocking call runs in a worker thread to avoid
    stalling the event loop.
    """
    return await asyncio.to_thread(_upload_image_sync, data, content_type, prefix)


async def delete_image(url: str) -> None:
    """Best-effort delete of a previously uploaded object by its public URL."""
    await asyncio.to_thread(_delete_image_sync, url)
