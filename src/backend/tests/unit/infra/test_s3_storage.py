from io import BytesIO
from typing import Any

import pytest
from PIL import Image

from infra.storage import s3
from settings.config.app_config import settings


def _png_bytes() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (2, 2), (255, 0, 0)).save(buffer, format="PNG")
    return buffer.getvalue()


def _jpeg_bytes() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (2, 2), (0, 255, 0)).save(buffer, format="JPEG")
    return buffer.getvalue()


def test_detect_image_ext_png() -> None:
    assert s3._detect_image_ext(_png_bytes()) == "png"


def test_detect_image_ext_jpeg() -> None:
    assert s3._detect_image_ext(_jpeg_bytes()) == "jpg"


def test_detect_image_ext_rejects_non_image() -> None:
    with pytest.raises(s3.UnsupportedImageType):
        s3._detect_image_ext(b"<html><script>alert(1)</script></html>")


def test_upload_uses_detected_ext_not_client_type(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, Any] = {}

    class _FakeClient:
        def put_object(self, **kwargs: Any) -> None:
            captured.update(kwargs)

    monkeypatch.setattr(s3, "_client", lambda: _FakeClient())
    monkeypatch.setattr(settings.s3, "bucket", "test-bucket", raising=False)

    url = s3._upload_image_sync(_png_bytes(), "image/jpeg", "menu")

    assert captured["Key"].endswith(".png")
    assert captured["ContentType"] == "image/png"
    assert url.endswith(captured["Key"])


def test_upload_rejects_disallowed_client_type() -> None:
    with pytest.raises(s3.UnsupportedImageType):
        s3._upload_image_sync(_png_bytes(), "application/octet-stream", "menu")


def test_delete_ignores_untrusted_key(monkeypatch: pytest.MonkeyPatch) -> None:
    deleted: list[Any] = []

    class _FakeClient:
        def delete_object(self, **kwargs: Any) -> None:
            deleted.append(kwargs)

    monkeypatch.setattr(s3, "_client", lambda: _FakeClient())
    monkeypatch.setattr(s3, "_key_from_url", lambda url: "menu/../../etc/passwd")

    s3._delete_image_sync("http://x/menu/../../etc/passwd")
    assert deleted == []
