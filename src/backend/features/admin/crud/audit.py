import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.audit_log.models import AuditLog


async def get_audit_logs(
    session: AsyncSession,
    action: str | None = None,
    entity_type: str | None = None,
    actor_id: uuid.UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    offset: int = 0,
    limit: int = 50,
) -> tuple[list[AuditLog], int]:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
    count_stmt = select(func.count()).select_from(AuditLog)
    if action:
        stmt = stmt.where(AuditLog.action == action)
        count_stmt = count_stmt.where(AuditLog.action == action)
    if entity_type:
        stmt = stmt.where(AuditLog.entity_type == entity_type)
        count_stmt = count_stmt.where(AuditLog.entity_type == entity_type)
    if actor_id:
        stmt = stmt.where(AuditLog.actor_id == actor_id)
        count_stmt = count_stmt.where(AuditLog.actor_id == actor_id)
    if date_from:
        ts = datetime.combine(date_from, datetime.min.time(), tzinfo=UTC)
        stmt = stmt.where(AuditLog.created_at >= ts)
        count_stmt = count_stmt.where(AuditLog.created_at >= ts)
    if date_to:
        ts_end = datetime.combine(date_to + timedelta(days=1), datetime.min.time(), tzinfo=UTC)
        stmt = stmt.where(AuditLog.created_at < ts_end)
        count_stmt = count_stmt.where(AuditLog.created_at < ts_end)
    total = (await session.execute(count_stmt)).scalar_one()
    rows = list((await session.execute(stmt.offset(offset).limit(limit))).scalars().all())
    return rows, total
