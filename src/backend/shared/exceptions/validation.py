class FieldValidationError(ValueError):
    code: str = "VALIDATION_ERROR"
    detail: str = "Validation error"

    def __init__(self, detail: str | None = None, **params: object):
        self.params: dict[str, object] = params
        self.detail = detail if detail is not None else self._render_detail()
        super().__init__(self.detail)

    def _render_detail(self) -> str:
        template = type(self).detail
        if not self.params:
            return template
        try:
            return template.format(**self.params)
        except (KeyError, IndexError):
            return template
