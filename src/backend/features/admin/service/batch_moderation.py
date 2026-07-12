import logging
import uuid
from collections.abc import Awaitable, Callable
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.api.schemas import BatchModerationResult
from features.admin.audit_log import service as audit_service

logger = logging.getLogger(__name__)

ModerateCallable = Callable[[AsyncSession, uuid.UUID], Awaitable[object]]


async def run_batch_moderation(
    session: AsyncSession,
    ids: list[uuid.UUID],
    actor_id: uuid.UUID,
    moderate: ModerateCallable,
    audit_action: str,
    entity_type: str,
    audit_details: dict[str, Any] | None = None,
) -> BatchModerationResult:
    succeeded: list[str] = []
    failed: list[dict[str, str]] = []
    for entity_id in ids:
        try:
            async with session.begin_nested():
                await moderate(session, entity_id)
                await audit_service.log_action(
                    session,
                    actor_id,
                    audit_action,
                    entity_type,
                    entity_id,
                    audit_details,
                )
            succeeded.append(str(entity_id))
        except Exception:
            logger.exception("%s failed for id=%s", audit_action, entity_id)
            failed.append({"id": str(entity_id), "error": "operation_failed"})
    return BatchModerationResult(succeeded=succeeded, failed=failed)
