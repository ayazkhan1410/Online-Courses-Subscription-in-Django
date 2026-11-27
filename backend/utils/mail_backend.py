"""Email backends that also write the shared test inbox."""

from __future__ import annotations

from django.core.mail.backends.console import EmailBackend as ConsoleBackend
from django.core.mail.backends.locmem import EmailBackend as LocmemBackend

from utils.inbox import record_outbound_mail


def _record(messages) -> None:
    for message in messages:
        recipients = list(message.to or []) + list(message.cc or [])
        if not recipients:
            continue
        record_outbound_mail(
            recipients,
            message.subject or '',
            message.body or '',
        )


class InboxLocmemEmailBackend(LocmemBackend):
    def send_messages(self, email_messages):
        sent = super().send_messages(email_messages)
        _record(email_messages)
        return sent


class InboxConsoleEmailBackend(ConsoleBackend):
    def send_messages(self, email_messages):
        sent = super().send_messages(email_messages)
        _record(email_messages)
        return sent
