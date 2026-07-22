from shared.exceptions.validation import FieldValidationError


class DuplicateCartOptionsError(FieldValidationError):
    code: str = "CART_DUPLICATE_OPTIONS_SELECTED"
    detail: str = "Duplicate options selected"
