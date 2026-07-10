import asyncio
import logging
import signal

logger = logging.getLogger(__name__)

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.enums import ParseMode
from aiogram.types import ErrorEvent
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web

from config import bot_config
from handlers import start
from middlewares.throttling import build_throttling_middleware
from notifications.consumer import start_notification_consumer


async def _on_error(event: ErrorEvent) -> None:
    logger.exception(
        "Unhandled error while processing update %s",
        event.update.update_id,
        exc_info=event.exception,
    )


async def _health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})


async def main() -> None:
    logging.basicConfig(level=logging.INFO)

    session = AiohttpSession(proxy=bot_config.proxy_url) if bot_config.proxy_url else None
    bot = Bot(
        token=bot_config.bot_token,
        session=session,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()
    dp.errors.register(_on_error)
    dp.update.outer_middleware(build_throttling_middleware())
    dp.include_router(start.router)

    if bot_config.mode == "webhook":
        if not bot_config.webhook_secret:
            raise RuntimeError(
                "BOT_WEBHOOK_SECRET must be set when BOT_MODE=webhook. "
                "Without it the /webhook endpoint accepts unauthenticated requests."
            )

        async def on_startup(dispatcher: Dispatcher) -> None:
            await bot.set_webhook(
                url=f"{bot_config.webhook_url}/webhook",
                secret_token=bot_config.webhook_secret or None,
            )

        dp.startup.register(on_startup)
        app = web.Application()
        app.router.add_get("/health", _health)
        handler = SimpleRequestHandler(
            dispatcher=dp,
            bot=bot,
            secret_token=bot_config.webhook_secret or None,
        )
        handler.register(app, path="/webhook")
        setup_application(app, dp, bot=bot)

        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", 8080)
        await site.start()

        consumer_task = asyncio.create_task(start_notification_consumer(bot))
        consumer_task.add_done_callback(
            lambda t: logger.error("Notification consumer stopped: %s", t.exception()) if not t.cancelled() and t.exception() else None
        )

        stop_event = asyncio.Event()
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, stop_event.set)
            except NotImplementedError:
                pass

        try:
            await stop_event.wait()
        finally:
            logger.info("Shutting down telegram bot (webhook mode)")
            consumer_task.cancel()
            try:
                await consumer_task
            except asyncio.CancelledError:
                pass
            await runner.cleanup()
            await bot.session.close()
    else:
        health_app = web.Application()
        health_app.router.add_get("/health", _health)
        health_runner = web.AppRunner(health_app)
        await health_runner.setup()
        health_site = web.TCPSite(health_runner, "0.0.0.0", 8080)
        await health_site.start()

        consumer_task = asyncio.create_task(start_notification_consumer(bot))
        consumer_task.add_done_callback(
            lambda t: logger.error("Notification consumer stopped: %s", t.exception()) if not t.cancelled() and t.exception() else None
        )
        await bot.delete_webhook(drop_pending_updates=False)
        await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
