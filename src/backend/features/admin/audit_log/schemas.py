from collections.abc import Mapping, Sequence

type AuditDetailValue = (
    str | int | float | bool | None | Sequence[AuditDetailValue] | Mapping[str, AuditDetailValue]
)
type AuditDetails = Mapping[str, AuditDetailValue]
