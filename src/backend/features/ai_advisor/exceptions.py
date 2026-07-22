from shared.exceptions.validation import FieldValidationError


class AdvisorContentTooLargeError(FieldValidationError):
    code: str = "ADVISOR_CONTENT_TOO_LARGE"
    detail: str = "Total message content exceeds {limit} characters"
