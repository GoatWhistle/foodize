from i18n.types import TranslationTree

BOT: TranslationTree = {
    "messages": {
        "welcome": "Welcome to <b>Foodize</b>!",
        "welcomeRestaurant": "Welcome to <b>Foodize</b>!\n\nOpen <b>{name}</b>:",
        "welcomeRegistered": (
            "\n\nYour account is registered as <b>{username_hint}</b>.\n"
            "You can now sign in on the website via Telegram — just enter your @username.\n\n"
            "You can also link a phone number for regular sign-in:"
        ),
        "openApp": "Open the app:",
        "openFoodize": "Open Foodize:",
        "openOrder": "Open order <b>#{display_id}</b>:",
        "miniAppNotConfigured": (
            "The Mini App URL is not configured yet. Set MINI_APP_URL in .env and in BotFather."
        ),
        "botNotConfigured": (
            "The bot is not configured for registration: TELEGRAM__BOT_API_SECRET is not set."
        ),
        "botAccessDenied": "The bot failed the Foodize API access check.",
        "apiUnavailable": "The Foodize API is unavailable right now. Please try again shortly.",
        "phoneLinked": (
            "Done, your phone is linked to Telegram.\n\n"
            "You can now open Foodize and start using it."
        ),
        "phoneLinkFailed": (
            "Could not link the phone number. Check the number and try again."
        ),
        "sendOwnPhone": "Please send your own phone number.",
        "vendorStatusNotConfigured": "Vendor status check is not configured yet.",
        "vendorStatusError": "Could not fetch the status. Please try again later.",
        "vendorNotFound": (
            "Vendor profile not found.\n\n"
            "Submit an application on the Foodize website, then check the status here."
        ),
        "vendorApproved": (
            "Your vendor application has been approved. "
            "The dashboard is available on the Foodize website."
        ),
        "vendorRejected": "Your vendor application was rejected.{suffix}",
        "vendorPending": (
            "Your vendor application is under review. "
            "We'll let you know once an administrator decides."
        ),
        "vendorRejectionReason": "\n\nReason: {reason}",
        "ordersNotConfigured": "Order viewing is not configured yet.",
        "ordersError": "Could not fetch orders. Please try again later.",
        "noActiveOrders": "You have no active orders right now.",
        "activeOrdersHeader": "Your active orders:",
        "noUsername": "no username",
    },
    "buttons": {
        "restart": "Restart the bot",
        "openFoodize": "Open Foodize",
        "openOrder": "Open order",
        "openRestaurant": "Open restaurant",
        "openNamedRestaurant": "Open {name}",
        "sharePhone": "Share phone number",
    },
    "orderStatus": {
        "PENDING": "Awaiting confirmation",
        "ACCEPTED": "Accepted by the restaurant",
        "COOKING": "Cooking",
        "READY": "Ready for pickup",
        "COMPLETED": "Completed",
        "CANCELLED": "Cancelled",
    },
    "notifications": {
        "orderPlaced": (
            "Order{order_ref} at <b>{restaurant}</b> accepted!\n\n"
            "Items: {items_count}\n"
            "Total: {total}\n\n"
            "We'll notify you when the status changes."
        ),
        "orderStatusChanged": (
            "Order{order_ref} update at <b>{restaurant}</b>\n\n"
            "Status: <b>{status}</b>\n"
            "Total: {total}"
        ),
    },
    "fallback": {
        "restaurant": "restaurant",
    },
}
