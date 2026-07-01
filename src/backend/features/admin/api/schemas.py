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
