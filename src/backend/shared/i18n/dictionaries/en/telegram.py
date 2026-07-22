from typing import Any

TELEGRAM: dict[str, Any] = {
    "siteLoginCode": {
        "plain": (
            "Your Foodize website login code: {code}\n\n"
            "If this wasn't you, simply ignore this message."
        ),
        "html": (
            "Your Foodize website login code: <b>{code}</b>\n\n"
            "If this wasn't you, simply ignore this message."
        ),
    },
}
