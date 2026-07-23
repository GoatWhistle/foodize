from collections.abc import Awaitable, Callable

from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from features.notifications.events import (
    FeedbackRequestedEvent,
    NotificationEvent,
    OrderPlacedEvent,
    OrderStatusChangedEvent,
)
from features.notifications.handlers import (
    handle_feedback_requested,
    handle_order_placed,
    handle_order_status_changed,
)
from shared.exceptions.internal import UnexpectedTypeError


class EventBinding[EventT: NotificationEvent](BaseModel):
    model_config = ConfigDict(frozen=True)

    queue_name: str
    routing_key: str
    event_model: type[EventT]
    handler: Callable[[AsyncSession, EventT], Awaitable[None]]

    def decode(self, body: bytes) -> EventT:
        return self.event_model.model_validate_json(body)

    async def dispatch(self, session: AsyncSession, event: NotificationEvent) -> None:
        if not isinstance(event, self.event_model):
            raise UnexpectedTypeError(self.event_model.__name__, event)
        await self.handler(session, event)


def _binding[EventT: NotificationEvent](
    queue_name: str,
    routing_key: str,
    event_model: type[EventT],
    handler: Callable[[AsyncSession, EventT], Awaitable[None]],
) -> EventBinding[NotificationEvent]:
    binding: EventBinding[NotificationEvent] = EventBinding(
        queue_name=queue_name,
        routing_key=routing_key,
        event_model=event_model,
        handler=handler,
    )
    return binding


BINDINGS: tuple[EventBinding[NotificationEvent], ...] = (
    _binding("notifications.order.placed", "order.placed", OrderPlacedEvent, handle_order_placed),
    _binding(
        "notifications.order.status_changed",
        "order.status_changed",
        OrderStatusChangedEvent,
        handle_order_status_changed,
    ),
    _binding(
        "notifications.feedback_requested",
        "notification.feedback_requested",
        FeedbackRequestedEvent,
        handle_feedback_requested,
    ),
)

BINDINGS_BY_ROUTING_KEY: dict[str, EventBinding[NotificationEvent]] = {
    binding.routing_key: binding for binding in BINDINGS
}
