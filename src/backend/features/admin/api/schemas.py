import uuid

from pydantic import BaseModel, Field, JsonValue

from shared.enums.permissions import Permission


class SetPermissionsRequest(BaseModel):
    permissions: list[Permission]


class BatchIdsRequest(BaseModel):
    ids: list[uuid.UUID]


class BatchRejectRequest(BaseModel):
    ids: list[uuid.UUID]
    reason: str | None = None


class BatchModerationResult(BaseModel):
    succeeded: list[str]
    failed: list[dict[str, str]]


class BatchAffectedResult(BaseModel):
    affected: int


class ForceCancelOrderRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=500)


class AuditLogEntry(BaseModel):
    id: str
    actor_id: str | None
    action: str
    entity_type: str
    entity_id: str | None
    details: dict[str, JsonValue]
    created_at: str
