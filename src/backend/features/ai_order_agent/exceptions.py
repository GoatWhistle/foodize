from shared.exceptions.validation import FieldValidationError


class OrderAgentContentTooLargeError(FieldValidationError):
    code: str = "ORDER_AGENT_CONTENT_TOO_LARGE"
    detail: str = "Total message content exceeds {limit} characters"


class EmbeddingDimensionMismatchError(RuntimeError):
    pass


class QueryEmbeddingDimensionMismatchError(RuntimeError):
    pass
