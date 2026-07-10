import re

_TAG_RE = re.compile(r"<[^>]*>")
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def strip_html(value: str | None) -> str | None:
    if value is None:
        return None
    without_tags = _TAG_RE.sub("", value)
    cleaned = _CONTROL_RE.sub("", without_tags)
    return cleaned.strip()
