import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.audit_log.models import AuditLog
from features.admin.audit_log.schemas import AuditDetails


async def log_action(
    session: AsyncSession,
    actor_id: uuid.UUID | None,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID | None = None,
    details: AuditDetails | None = None,
) -> None:
    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=dict(details) if details else {},
    )
    session.add(entry)
