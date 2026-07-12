import uuid

from pydantic import BaseModel

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
