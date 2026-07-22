from typing import Any

TELEGRAM: dict[str, Any] = {
    "siteLoginCode": {
        "plain": (
            "Код входа на сайт Foodize: {code}\n\n"
            "Если это были не вы, просто проигнорируйте сообщение."
        ),
        "html": (
            "Код входа на сайт Foodize: <b>{code}</b>\n\n"
            "Если это были не вы, просто проигнорируйте сообщение."
        ),
    },
}
