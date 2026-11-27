class MfaError(Exception):
    """Safe client message. Never put a code or secret in it."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message
