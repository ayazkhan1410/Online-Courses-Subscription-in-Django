class MfaError(Exception):
    """Safe to show to the client. Never put a code or secret in the message."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message
